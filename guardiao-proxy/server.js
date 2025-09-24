import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json({ limit: "2mb" }));

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const schema = {
    type: "object",
    properties: {
        summary: { type: "string" },
        sellsData: { type: "boolean" },
        sharesData: { type: "boolean" },
        sensitiveCategories: {
            type: "array",
            items: { type: "string" }
        },
        optOutPaths: {
            type: "array",
            items: { type: "string" }
        },
        risks: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    type: { type: "string" },
                    value: { type: "string" },
                    evidence: { type: "string" }
                },
                required: ["type", "value", "evidence"],
                additionalProperties: false
            }
        },
        confidence: { type: "number" }
    },
    required: ["summary", "sellsData", "sharesData", "confidence"],
    additionalProperties: false
};

async function callGroq(bodyPayload) {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
    });
    return resp;
}

app.post("/analyze", async (req, res) => {
    try {
        const { url, pageTitle, extractedText } = req.body;
        if (!url || !extractedText) {
            return res.status(400).json({ error: "Missing url or text" });
        }

        const prompt = `
Você é um analista especializado em políticas de privacidade.

Analise o texto abaixo e escreva sua resposta em português, de forma clara e organizada, abordando obrigatoriamente os seguintes pontos:

1. **Resumo geral da política**  
   Explique em poucas frases o que o documento descreve.

2. **Principais riscos para a privacidade do usuário**  
   Liste os trechos ou práticas que possam infringir a privacidade do usuário (ex.: coleta excessiva, compartilhamento com terceiros, falta de transparência, armazenamento inseguro).

3. **Possíveis locais onde pode ocorrer venda ou repasse de informações**  
   Destaque trechos que indiquem a comercialização ou repasse de dados.

4. **Percentual estimado de uso de dados pessoais pelo site**  
   Dê uma estimativa em porcentagem (0 a 100%) de quão intensivo é o uso dos dados do usuário segundo o texto.

Texto a ser analisado (máx. 6000 caracteres):
"""${extractedText.slice(0,6000)}"""
`;

        // Primeiro tenta structured output se modelo suportar
        let responseBody = {
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: "Responda apenas JSON válido, no formato especificado." },
                { role: "user", content: prompt }
            ],
            temperature: 0,
            max_tokens: 6000
        };

        let groqResp = await callGroq(responseBody);

        if (groqResp.status === 422 || groqResp.status === 400) {
            // erro de schema, tenta fallback
            console.warn("Schema não suportado ou inválido, tentando json_object fallback");
            responseBody = {
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: "Responda APENAS JSON no formato especificado." },
                    { role: "user", content: prompt }
                ],
                temperature: 0,
                response_format: {
                    type: "json_object"
                }
            };
            groqResp = await callGroq(responseBody);
        }

        if (!groqResp.ok) {
            const text = await groqResp.text();
            return res.status(groqResp.status).json({ error: text });
        }

        const data = await groqResp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            return res.status(500).json({ error: "No content in response", raw: data });
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (err) {
            return res.status(500).json({ error: "Parse error", raw: content });
        }
        console.log(JSON.stringify(parsed, null, 2));
        res.json(parsed);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: String(err) });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy Groq rodando em http://localhost:${port}/analyze`));
