import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Se estiver usando node >=18, você pode usar o fetch nativo e remover node-fetch.
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());

/* --------- Utilitários --------- */

// Divide texto em blocos ~3k chars para não estourar TPM/tokens
function dividirTexto(texto, tamanhoMaximo = 3000) {
  const partes = [];
  for (let i = 0; i < texto.length; i += tamanhoMaximo) {
    partes.push(texto.slice(i, i + tamanhoMaximo));
  }
  return partes;
}

// Prompt curto e “mandão” para reduzir verborragia
function promptCompacto(parte) {
  return `
Você é um analista de políticas de privacidade.

Responda SOMENTE em JSON VÁLIDO (sem markdown, sem explicações), neste formato ENXUTO:

{
  "resumo": "máx. 1 frase clara",
  "riscos": ["máx. 3 tópicos curtos"],
  "repasse": ["máx. 2 tópicos curtos"],
  "percentual_uso_dados": "ex: 60% ou 'não informado'",
  "recomendacoes": ["máx. 3 tópicos curtos"]
}

Texto:
"""${parte}"""
`.trim();
}

// Extrai o primeiro JSON válido da resposta (remove ```json ... ``` etc.)
function extrairJSON(texto) {
  if (typeof texto !== "string") return null;
  // tira cercas de código
  const cercado = texto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (cercado) texto = cercado[1];
  // pega do primeiro { até o último }
  const ini = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (ini === -1 || fim === -1 || fim <= ini) return null;
  const bruto = texto.slice(ini, fim + 1);
  try {
    return JSON.parse(bruto);
  } catch {
    return null;
  }
}

// Normaliza e ENXUGA um resultado (cortes duros)
function clampStr(s, max = 160) {
  if (typeof s !== "string") return "";
  return s.length > max ? s.slice(0, max - 1).trim() + "…" : s.trim();
}
function clampArr(a, n = 3, itemMax = 80) {
  if (!Array.isArray(a)) a = [];
  // dedup + limpa
  const dedup = [...new Set(a.map(x => String(x || "").trim()).filter(Boolean))];
  return dedup.slice(0, n).map(x => clampStr(x, itemMax));
}
function normalizar(obj) {
  obj = obj || {};
  return {
    resumo: clampStr(obj.resumo || "", 160), // máx. 1 frase curta
    riscos: clampArr(obj.riscos, 3, 70),
    repasse: clampArr(obj.repasse, 2, 70),
    percentual_uso_dados: (obj.percentual_uso_dados && String(obj.percentual_uso_dados).trim()) || "não informado",
    recomendacoes: clampArr(obj.recomendacoes, 3, 70),
  };
}

// Agrega várias partes em um único resultado compacto
function agregarPartes(partesNorm) {
  const resumo = clampStr(
    partesNorm.map(p => p.resumo).filter(Boolean).slice(0, 1).join(" "), // só 1 frase
    160
  );
  const riscos = clampArr(partesNorm.flatMap(p => p.riscos), 3, 70);
  const repasse = clampArr(partesNorm.flatMap(p => p.repasse), 2, 70);
  const recomenda = clampArr(partesNorm.flatMap(p => p.recomendacoes), 3, 70);

  // pega a primeira % “não não-informado”
  const pct = (partesNorm.map(p => p.percentual_uso_dados).find(v => v && v !== "não informado")) || "não informado";

  return { resumo, riscos, repasse, percentual_uso_dados: pct, recomendacoes: recomenda };
}

/* --------- Rota --------- */

app.post("/analisar", async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto) return res.status(400).json({ erro: "Texto não recebido" });

    const partes = dividirTexto(texto, 3000);
    const resultados = [];

    for (const parte of partes) {
      const prompt = promptCompacto(parte);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          top_p: 0.3,
          max_tokens: 300,              // 👈 segura a verborragia
          stop: ["```", "\n\n\n"]       // 👈 evita cercas e textão
        })
      });

      const data = await response.json();

      if (data?.error) {
        console.warn("Groq error:", data.error);
        // não quebra, só registra o erro nesta parte
        resultados.push(normalizar({}));
      } else {
        const content = data?.choices?.[0]?.message?.content || "";
        const json = extrairJSON(content) || {};
        resultados.push(normalizar(json));
      }

      // pequena pausa para respeitar TPM (ajuste se necessário)
      await new Promise(r => setTimeout(r, 1200));
    }

    const final = agregarPartes(resultados);
    return res.json(final);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: "Erro na análise" });
  }
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
