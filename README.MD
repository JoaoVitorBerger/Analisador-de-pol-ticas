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
- ✅ Novo: **Histórico por domínio** (últimas 10 análises).  
- ✅ Novo: **Copiar JSON** e **Baixar JSON** do resultado.  
- ✅ Novo: **Tema escuro** com alternância e persistência.  
- ✅ Novo: **URL do backend configurável** no popup (persistido).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend (Extensão Chrome)**  
  - `manifest.json` (Manifest V3)  
  - Interface (`popup.html`, `popup.js`, `style.css`)  

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
- │ ├── 📄 popup.js
- │ └── 📄 style.css
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

## ⚙️ Configurações no popup

- **Backend URL**: defina o endereço do servidor (padrão: `http://127.0.0.1:3000`).  
  Valores são salvos em `chrome.storage.sync` e usados ao enviar a análise.
- **Tema**: alternância entre claro/escuro, com persistência.

---

## Inicie o servidor:

- node server.js

---

## ▶️ Como executar a extensão (passo a passo)

1. Pré-requisitos
   - Node 18+ instalado.
   - Navegador Chrome (ou Chromium) atualizado.

2. Configurar variáveis de ambiente
   - Crie um arquivo `.env` na raiz do projeto com:
     ```env
     GROQ_API_KEY=coloque_sua_chave_aqui
     GROQ_MODEL=llama-3.1-8b-instant
     ```

3. Instalar dependências e iniciar backend
   - Instale: `npm install`
   - Rode: `node server.js`
   - Verifique no console: "Servidor rodando em http://localhost:3000"

4. Carregar a extensão no Chrome
   - Abra `chrome://extensions`.
   - Ative o Modo de desenvolvedor.
   - Clique em "Carregar sem compactação".
   - Selecione a pasta `extensao/`.

5. Configurar o backend no popup
   - Abra o popup da extensão.
   - Clique em "Config".
   - Em "Backend URL", use `http://127.0.0.1:3000` (ou `http://localhost:3000`).
   - Clique em "Salvar".

6. Executar uma análise
   - Acesse uma página com Termos/Política de Privacidade.
   - Abra o popup e clique em "Analisar".
   - Após o resultado:
     - Use "Copiar" para copiar o JSON.
     - Use "Baixar" para salvar `analise.json`.
     - Veja o "Histórico" para resultados anteriores do mesmo domínio.

7. Dicas
   - Se a página for muito longa, pode haver truncamento controlado pelo servidor para respeitar limites de tokens.
   - Se o popup indicar erro de conexão, confirme se o backend está ativo e se a URL está correta no popup.

---

## O QUE VAI SER APRESENTADO

- 📄 Dados coletados
- 🔒 Dados sensíveis
- 📡 Rastreamento do usuário
- 🔁 Compartilhamento de dados
- ⚠️ Nível de intrusividade (nota e classificação)

---

⚠️ Ponto de Atenção

- O analisador possui uma limitação relacionada ao uso da API do GROG.
  - Atente-se aos seguintes pontos:

    - Limite de Tokens: Ao utilizar uma API Key gratuita, há um limite diário de tokens disponíveis. Caso esse limite seja ultrapassado, o terminal exibirá uma mensagem de erro, informando que o número máximo de tokens foi excedido.

    - Solução 1 — API Paga: Para ampliar o limite diário de tokens e permitir a análise de textos maiores sem interrupções, recomenda-se utilizar uma API Key paga.

    - Solução 2 — Ajuste de Código: Outra alternativa é reduzir o tamanho máximo de caracteres por bloco diretamente no código. Dessa forma, o consumo de tokens por requisição será menor, diminuindo as chances de atingir o limite diário.

---

## O que foi implementado recentemente

- Histórico por domínio (até 10 entradas por host) usando `chrome.storage.local`.
- Botões de **Copiar** (clipboard) e **Baixar** (arquivo `analise.json`).
- Tema escuro e persistência de preferências em `chrome.storage.sync`.
- Backend configurável diretamente no popup.

---

## Como funciona
- O content script coleta o texto da página.
- O texto é enviado ao servidor Node.js (`/analisar`).
- O servidor chama a API Groq para análise.
- O resultado (JSON estruturado) é exibido no popup da extensão.

---

## 🖼️ Capturas de tela (exemplos)

Coloque imagens na pasta `docs/` (crie se não existir) e referencie-as no README. Exemplos:

```md
![Popup claro](docs/popup-claro.png)
![Popup escuro](docs/popup-escuro.png)
![Configurações](docs/popup-config.png)
```

Para gravar um GIF curto, use qualquer gravador (ex.: ShareX) e salve em `docs/fluxo-analise.gif`:

```md
![Fluxo de análise](docs/fluxo-analise.gif)
```
