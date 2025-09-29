# 🛡️ Guardião de Termos & Privacidade (IA)

Extensão para navegador que **analisa automaticamente políticas de privacidade e termos de uso** das páginas que você acessa, destacando riscos e práticas de coleta/compartilhamento de dados pessoais.  
O projeto utiliza **IA (Groq LLM)** para interpretar o texto e gerar um resumo claro e estruturado.

---

## 🚀 Funcionalidades

- ✅ Detecta automaticamente páginas de **termos de uso e políticas de privacidade**.  
- ✅ Analisa o conteúdo usando IA e retorna:  
  - Resumo geral da política.  
  - Principais riscos para a privacidade.  
  - Locais onde pode haver **venda ou repasse de dados**.  
  - Percentual estimado de uso intensivo de dados pessoais.  
- ✅ Interface simples via **popup** da extensão.  
- ✅ API local em **Node.js + Express** para processar as análises.  
- ✅ Uso do modelo **LLaMA (Groq API)** para interpretação.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend (Extensão Chrome)**  
  - `manifest.json` (Manifest V3)  
  - Interface (`popup.html`, `popup.js`, `server.js`)  

- **Backend (Proxy/Servidor)**  
  - [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)  
  - [dotenv](https://www.npmjs.com/package/dotenv)  
  - [openai (SDK Groq compatível)](https://www.npmjs.com/package/openai)  
  - [node-fetch](https://www.npmjs.com/package/node-fetch)  

---

## 📂 Estrutura do Projeto

Analisador-de-pol-ticas/
- |
- ├── 📂 extensao/
- │ ├── 📄 manifest.json
- │ ├── 📄 popup.html
- │ └── 📄 popup.js
- │
- ├── 📂 node_modules/ 
- │
- ├── 📄 .env # Variáveis de ambiente
- ├── 📄 .gitignore 
- ├── 📄 package-lock.json 
- ├── 📄 package.json 
- ├── 📄 README.md 
- └── 📄 server.js 
- │

---

## Crie um arquivo .env dentro da pasta guardiao-proxy com o seguinte conteúdo:

- GROQ_API_KEY=coloque_sua_chave_aqui
- GROQ_MODEL=llama-3.3-70b-versatile

---

## 🚀 Como rodar o projeto

1. Instale as dependências:
   ```bash
   npm install

---

## 🌐 Instalar a extensão no Chrome
- Abra o navegador Chrome.
- Vá em chrome://extensions/.
- Ative o Modo de desenvolvedor.
- Clique em Carregar sem compactação.
- Selecione a pasta extensao/.
- A extensão estará pronta para uso.

---

## Inicie o servidor:

- node server.js

---

## 📡 Como funciona
- O content script coleta o texto da página.
- O texto é enviado ao servidor Node.js (/analyze).
- O servidor chama a API Groq para análise.
- O resultado (JSON estruturado) é exibido no popup da extensão.
