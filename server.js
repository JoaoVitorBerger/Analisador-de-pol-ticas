// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch"; // Se usar Node 18+, você pode usar o fetch nativo.

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());



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
  const dados_coletados = clampArr(obj.dados_coletados, 6, 50);
  const dados_sensiveis = clampArr(obj.dados_sensiveis, 6, 50);
  const rastreamento = clampArr(obj.rastreamento, 6, 50);
  const compartilhamento = clampArr(obj.compartilhamento, 5, 50);
  const nota = Number(obj?.intrusividade?.nota);
  return {
    dados_coletados,
    dados_sensiveis,
    rastreamento,
    compartilhamento,
    intrusividade: {nota},
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
  "dados_coletados": ["máx. 6 itens curtos — ex.: Quais dados estão sendo coletados sem a permissão do usuario"],
  "dados_sensiveis": ["máx. 6 — ex.: Quais dados são coletados com a permissão do usuario"],
  "rastreamento": ["máx. 6 — ex.: Os tipos de rastreadores utilizados pela página"],
  "compartilhamento": ["máx. 5 — ex.: Tipo de anunciante que os dados são repassados"],
  "intrusividade": { "nota": 0-100, "nivel": "baixo" | "medio" | "alto" }
}

Regras de extração:
- Inclua um item SÓ se houver menção clara no trecho (sinônimos contam, ex.: “identificador do dispositivo” = device ID).
- Se não houver citação explícita, deixe a lista vazia [].
- No trecho de esquema e limites, utilize palavras chave para informar quais informações estão sendo extraídas do usuário e evite textos longos.

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

    if (!process.env.GEMINI_API_KEY) {
      console.error("Falta GEMINI_API_KEY no .env");
      return res.status(500).json({ erro: "Configuração ausente: GEMINI_API_KEY" });
    }

    console.log(texto)
    const prompt = promptCompacto(texto);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.3,
          }
        })
      }
    );
    const data = await response.json();

    if (!data?.candidates?.length) {
      // Em caso de erro da API, retornamos estrutura vazia normalizada
      console.warn("Gemini error:", data.error);
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
