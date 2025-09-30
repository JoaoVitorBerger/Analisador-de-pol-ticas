// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());

// =========================
// Limites de tokens e blocos
// =========================
const TOKEN_LIMIT        = 6000;
const MAX_OUTPUT_TOKENS  = 300;
const OVERHEAD_TOKENS    = 400;
const CHAR_PER_TOKEN     = 4;

const INPUT_TOKEN_BUDGET = Math.max(100, TOKEN_LIMIT - MAX_OUTPUT_TOKENS - OVERHEAD_TOKENS);
const INPUT_CHAR_BUDGET  = INPUT_TOKEN_BUDGET * CHAR_PER_TOKEN;

const BLOCO_CHAR_LIMIT = 2500; // ~625 tokens aprox
const DELAY_BLOCOS_MS  = 1000; // 1s entre chamadas

// =========================
// Utils
// =========================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function dividirTexto(texto, maxChars = BLOCO_CHAR_LIMIT) {
  const partes = [];
  let inicio = 0;
  while (inicio < texto.length) {
    partes.push(texto.slice(inicio, inicio + maxChars));
    inicio += maxChars;
  }
  return partes;
}

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

function normalizarPII(obj = {}) {
  const dados_coletados  = clampArr(obj.dados_coletados, 6, 50);
  const dados_sensiveis  = clampArr(obj.dados_sensiveis, 6, 50);
  const rastreamento     = clampArr(obj.rastreamento, 6, 50);
  const compartilhamento = clampArr(obj.compartilhamento, 5, 50);

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

function mesclarResultados(resultados) {
  const acumulado = {
    dados_coletados: [],
    dados_sensiveis: [],
    rastreamento: [],
    compartilhamento: [],
  };

  for (const r of resultados) {
    acumulado.dados_coletados.push(...(r.dados_coletados || []));
    acumulado.dados_sensiveis.push(...(r.dados_sensiveis || []));
    acumulado.rastreamento.push(...(r.rastreamento || []));
    acumulado.compartilhamento.push(...(r.compartilhamento || []));
  }

  return normalizarPII(acumulado);
}

// =========================
// Prompt
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

Texto:
"""${textoAjustado}"""
`.trim();
}

// =========================
// Função com retry automático
// =========================
async function chamarGroqComRetry(body, tentativas = 5) {
  for (let i = 0; i < tentativas; i++) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data?.error || data.error.code !== "rate_limit_exceeded") {
      return data;
    }

    const wait = 45000; // 45s
    console.warn(`⚠️ Rate limit atingido. Tentando novamente em ${wait / 1000}s...`);
    await sleep(wait);
  }

  return { error: { message: "Rate limit persistente após várias tentativas." } };
}

// =========================
// Rota principal
// =========================
app.post("/analisar", async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto) return res.status(400).json({ erro: "Texto não recebido" });

    const blocos = dividirTexto(texto);
    const resultados = [];

    let tokensEntradaTotal = 0;

    for (const bloco of blocos) {
      const prompt = promptCompacto(bloco);

      // Estimativa de tokens de entrada do bloco
      const tokensEntradaBloco = Math.ceil(bloco.length / CHAR_PER_TOKEN);
      tokensEntradaTotal += tokensEntradaBloco;

      const data = await chamarGroqComRetry({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        top_p: 0.3,
        max_tokens: MAX_OUTPUT_TOKENS,
        stop: ["```", "\n\n\n"],
      });

      if (data?.error) {
        console.warn("Groq error:", data.error);
        resultados.push(normalizarPII({}));
      } else {
        const content = data?.choices?.[0]?.message?.content || "";
        const json = extrairJSON(content) || {};
        resultados.push(normalizarPII(json));
      }

      await sleep(DELAY_BLOCOS_MS);
    }

    const final = mesclarResultados(resultados);

    // Adiciona informação de tokens ao resultado
    final.tokens = {
      entrada_estimativa: tokensEntradaTotal,
      saida_max: MAX_OUTPUT_TOKENS,
      total_estimativa: tokensEntradaTotal + MAX_OUTPUT_TOKENS + OVERHEAD_TOKENS
    };

    return res.json(final);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: "Erro na análise" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
