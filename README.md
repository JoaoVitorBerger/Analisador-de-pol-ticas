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

## Instalação do Backend (Node.js)

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

### Funcionalidades Avançadas
- **Histórico**: Após múltiplas análises, clique em itens do histórico para rever resultados anteriores
- **Exportação**: Use **"Copiar"** para colar JSON em documentos ou **"Baixar"** para salvar arquivo
- **Tema**: Clique em **"Tema"** para alternar entre claro e escuro
- **Configuração**: Clique em **"Config"** para alterar URL do backend se necessário

---

## Como Funciona

- A extensão coleta o texto da página (`document.body.innerText`).
- Envia o conteúdo ao backend configurável.
- O backend analisa com a API da **Groq** usando modelo Llama 3.1.
- A resposta é exibida no popup da extensão com seções amigáveis e organizadas.
- Resultados são salvos automaticamente no histórico por domínio.

---

## Verificação e Debug

### Verificar Backend
Acesse `http://localhost:3000/health` para confirmar configuração:

```json
{
  "ok": true,
  "groq_key_present": true,
  "groq_key_length": 48,
  "model": "llama-3.1-8b-instant"
}
```

### Problemas Comuns
- **Erro 401 da Groq**: Verifique se `GROQ_API_KEY` está correta no `.env`
- **Análises com 0%**: Reinicie o servidor após atualizar o `.env`
- **Extensão não responde**: Verifique se o backend está rodando e a URL configurada

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
- **IA**: Groq API (Llama 3.1 8B Instant)
- **Armazenamento**: Chrome Storage API (sync + local)
- **Estilização**: CSS Variables para temas

---

## Licença

Este projeto está licenciado sob a ISC License.
