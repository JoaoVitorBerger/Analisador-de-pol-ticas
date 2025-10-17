// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch"; // Se usar Node 18+, você pode usar o fetch nativo.

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());

// =========================
// Limites de tokens por REQUISIÇÃO (rigor: <= 6000)
// =========================
// Aproximação padrão: ~4 caracteres ≈ 1 token.
// Mantemos uma margem (OVERHEAD_TOKENS) para o próprio prompt e variações do modelo.
const TOKEN_LIMIT        = 6000;   // total (entrada + saída)
const MAX_OUTPUT_TOKENS  = 300;    // teto para a RESPOSTA do modelo
const OVERHEAD_TOKENS    = 400;    // margem p/ prompt/headers/variações
const CHAR_PER_TOKEN     = 4;      // estimativa 1 token ~ 4 chars

// Orçamento para a ENTRADA (prompt + texto do usuário)
// Observação: o prompt também consome tokens, por isso somamos OVERHEAD_TOKENS e reservamos MAX_OUTPUT_TOKENS.
const INPUT_TOKEN_BUDGET = Math.max(100, TOKEN_LIMIT - MAX_OUTPUT_TOKENS - OVERHEAD_TOKENS);
const INPUT_CHAR_BUDGET  = INPUT_TOKEN_BUDGET * CHAR_PER_TOKEN;

// =========================
// Utils
// =========================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fitTextToBudget(texto) {
  if (!texto) return "";
  // corta o texto para caber no orçamento de ENTRADA (em chars)
  return texto.slice(0, INPUT_CHAR_BUDGET);
}

// Remove cercas ```json e extrai o primeiro JSON válido
function extrairJSON(texto) {
  if (typeof texto !== "string") return null;
  const cercado = texto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (cercado) texto = cercado[1];
  const ini = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (ini === -1 || fim === -1 || fim <= ini) return null;
  try {
    return JSON.parse(texto.slice(ini, fim + 1));
  } catch {
    return null;
  }
}

const clampStr = (s, max = 50) => (s || "").toString().trim().slice(0, max);
function clampArr(a, n = 6, itemMax = 50) {
  const arr = Array.isArray(a) ? a : [];
  const dedup = [...new Set(arr.map((x) => (x || "").toString().trim()).filter(Boolean))];
  return dedup.slice(0, n).map((x) => clampStr(x, itemMax));
}

// Normaliza para o payload compacto desejado
function normalizarPII(obj = {}) {
  const dados_coletados  = clampArr(obj.dados_coletados, 6, 50);
  const dados_sensiveis  = clampArr(obj.dados_sensiveis, 6, 50);
  const rastreamento     = clampArr(obj.rastreamento, 6, 50);
  const compartilhamento = clampArr(obj.compartilhamento, 5, 50);

  // Se o modelo não trouxer a nota, calculamos com a mesma regra do prompt
  const calcNota = () => {
    const n =
      Math.min(dados_coletados.length * 5, 30) +
      Math.min(dados_sensiveis.length * 8, 40) +
      Math.min(rastreamento.length * 4, 20) +
      Math.min(compartilhamento.length * 2, 10);
    return Math.max(0, Math.min(100, n));
  };

  const nota = Number(obj?.intrusividade?.nota ?? calcNota());
  const nivel = nota <= 33 ? "baixo" : nota <= 66 ? "medio" : "alto";

  return {
    dados_coletados,
    dados_sensiveis,
    rastreamento,
    compartilhamento,
    intrusividade: { nota, nivel },
  };
}

// =========================
// Prompt focado em PII + intrusividade
// =========================
function promptCompacto(textoAjustado) {
  return `
Responda SOMENTE em JSON VÁLIDO (sem markdown, sem texto fora do JSON).
Extraia APENAS o que o texto afirmar explicitamente. NÃO invente.

Esquema e limites:
{
  "dados_coletados": ["máx. 6 itens curtos — ex.: nome completo, e-mail, endereço, telefone, data de nascimento, CPF/SSN"],
  "dados_sensiveis": ["máx. 6 — ex.: saúde, biometria, religião, orientação sexual, dados financeiros, geolocalização precisa"],
  "rastreamento": ["máx. 6 — ex.: IP, cookies, device ID, fingerprint, ad ID, SDK/PIXEL de terceiros"],
  "compartilhamento": ["máx. 5 — ex.: anunciantes, analytics, afiliadas, provedores de nuvem, autoridades"],
  "intrusividade": { "nota": 0-100, "nivel": "baixo" | "medio" | "alto" }
}

Regras de extração:
- Inclua um item SÓ se houver menção clara no trecho (sinônimos contam, ex.: “identificador do dispositivo” = device ID).
- Se não houver citação explícita, deixe a lista vazia [].

Como calcular "intrusividade.nota" (clamp 0..100):
- Baseie-se APENAS no trecho.
- Pontos: dados_coletados (5/item, até 30) + dados_sensiveis (8/item, até 40) + rastreamento (4/item, até 20) + compartilhamento (2/item, até 10).
- "intrusividade.nivel": 0–33 => "baixo", 34–66 => "medio", 67–100 => "alto".

Texto:
"""${textoAjustado}"""
`.trim();
}

// =========================
// Rota principal (UMA chamada por requisição, ≤ 6000 tokens)
// =========================
app.post("/analisar", async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto) return res.status(400).json({ erro: "Texto não recebido" });

    // 1) Ajusta o texto para caber no orçamento de ENTRADA
    const textoAjustado = fitTextToBudget(texto);

    // 2) Monta prompt (curto) com o texto já ajustado
    const prompt = promptCompacto(textoAjustado);

    // 3) Chama Groq com limite de saída (MAX_OUTPUT_TOKENS)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        top_p: 0.3,
        max_tokens: MAX_OUTPUT_TOKENS, // <-- saída limitada
        stop: ["```", "\n\n\n"],
      }),
    });

    const data = await response.json();

    if (data?.error) {
      // Em caso de erro da API, retornamos estrutura vazia normalizada
      console.warn("Groq error:", data.error);
      return res.json(normalizarPII({}));
    }

    const content = data?.choices?.[0]?.message?.content || "";
    const json = extrairJSON(content) || {};
    const final = normalizarPII(json);
    return res.json(final);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: "Erro na análise" });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
