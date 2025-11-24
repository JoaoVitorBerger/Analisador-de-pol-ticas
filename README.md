# 🛡️ Guardião de Termos & Privacidade (IA)

Extensão para navegador que **analisa automaticamente políticas de privacidade e termos de uso** das páginas que você acessa, destacando riscos e práticas de coleta/compartilhamento de dados pessoais.  
O projeto utiliza **IA Gemini 2.5-Flash** para interpretar o texto e gerar um resumo claro e estruturado.

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
- ✅ Uso do modelo **Gemini 2.5-Flash** para interpretação.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend (Extensão Chrome)**  
  - `manifest.json` (Manifest V3)  
  - Interface (`popup.html`, `popup.js`, `server.js`)  

- **Backend (Proxy/Servidor)**  
  - [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)  
  - [dotenv](https://www.npmjs.com/package/dotenv)  
  - [node-fetch](https://www.npmjs.com/package/node-fetch)  
  - [Gemini API KEY](https://aistudio.google.com/api-keys)  

---

## Clonando o Projeto

Clone o projeto diretamente na branch `develop`:

```bash
git clone -b develop --single-branch https://github.com/JoaoVitorBerger/Analisador-de-pol-ticas.git
cd Analisador-de-pol-ticas
```

---

## Instalação do Backend (Node.js)

1. Certifique-se de ter o **Node.js 18+** instalado.
2. Execute os comandos abaixo:

```bash
npm install
```

---

## Crie um arquivo .env dentro da pasta guardiao-proxy com o seguinte conteúdo:

- GEMINI_API_KEY=coloque_sua_chave_aqui
- GEMINI_MODEL=gemini-2.5-flash

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

## Carregando a Extensão no Navegador

1. Acesse `chrome://extensions/` (ou `edge://extensions/` no Edge).
2. Ative o **Modo do Desenvolvedor**.
3. Clique em **"Carregar sem compactação"**.
4. Selecione a pasta `extensao/` dentro do projeto clonado.
5. A extensão aparecerá na barra do navegador.

---

## Como Usar

### Análise Básica
1. Navegue até uma página com política de privacidade
2. Clique no ícone do Guardião no navegador
3. Pressione **"Analisar"**
4. Aguarde os resultados com taxa de intrusividade


---

## Como Funciona

- A extensão coleta o texto da página (`document.body.innerText`).
- Envia o conteúdo ao backend configurável.
- O backend analisa com a API da **Gemini** usando modelo Flash 2.5.
- A resposta é exibida no popup da extensão com seções amigáveis e organizadas.
-

---

## Estrutura do Projeto

```
Analisador-de-pol-ticas/
├── extensao/              # Arquivos da extensão Chrome
│   ├── manifest.json      # Permissões e configurações
│   ├── popup.html         # Interface principal
│   ├── popup.js           # Lógica da interface
│   └── style.css          # Estilos e tema escuro
├── server.js              # Backend Node.js + Express
├── package.json           # Dependências e scripts
├── .env.example           # Template de variáveis de ambiente
├── .gitignore             # Arquivos ignorados pelo Git
└── docs/                  # Documentação adicional
    └── Apresentacao-branch.md
```

---

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **IA**: Gemini 2.5-flash
- **Armazenamento**: Chrome Storage API (sync + local)
- **Estilização**: CSS Variables para temas

---

## Licença

Este projeto está licenciado sob a ISC License.
