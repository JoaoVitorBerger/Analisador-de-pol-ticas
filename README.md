
# Guardião – Analisador de Políticas com IA (Extensão + Backend Groq)

Este projeto consiste em uma extensão para navegador (Chrome/Edge) que analisa automaticamente a política de privacidade da página atual, utilizando inteligência artificial (Groq API). Ele retorna, de forma simples e direta:

- 📄 Dados coletados
- 🔒 Dados sensíveis
- 📡 Rastreamento do usuário
- 🔁 Compartilhamento de dados
- ⚠️ Nível de intrusividade (nota e classificação)

---

## 📦 Clonando o Projeto

Clone o projeto diretamente na branch `develop`:

```bash
git clone -b develop --single-branch https://github.com/JoaoVitorBerger/Analisador-de-pol-ticas.git
cd Analisador-de-pol-ticas
```

---

## ⚙️ Instalação do Backend (Node.js)

1. Certifique-se de ter o **Node.js 18+** instalado.
2. Execute os comandos abaixo:

```bash
npm install
```

4. Crie um arquivo `.env` com o seguinte conteúdo:

```env
GROQ_API_KEY=sua_chave_da_api_groq
GROQ_MODEL=llama-3.1-8b-instant

```

5. Inicie o servidor backend:

```bash
npm start
```

> O backend estará disponível em `http://localhost:3000`

---

## 🧩 Carregando a Extensão no Navegador

1. Acesse `chrome://extensions/` (ou `edge://extensions/` no Edge).
2. Ative o **Modo do Desenvolvedor**.
3. Clique em **"Carregar sem compactação"**.
4. Selecione a pasta `extensao/` dentro do projeto clonado.
5. A extensão aparecerá na barra do navegador. Clique nela e pressione **"Analisar"**.

---

## 🧠 Como Funciona

- A extensão coleta o texto da página (`document.body.innerText`).
- Envia o conteúdo ao backend local.
- O backend analisa com a API da **Groq**.
- A resposta é exibida no popup da extensão com seções amigáveis e organizadas.