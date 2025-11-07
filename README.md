# Guardião – Analisador de Políticas com IA (Extensão + Backend Groq)

Este projeto consiste em uma extensão para navegador (Chrome/Edge) que analisa automaticamente a política de privacidade da página atual, utilizando inteligência artificial (Groq API). Ele retorna, de forma simples e direta:

- Dados coletados
- Dados sensíveis
- Rastreamento do usuário
- Compartilhamento de dados
- Nível de intrusividade (nota e classificação)

## Novas Funcionalidades

- **Histórico por domínio**: Mantém as últimas 10 análises por site
- **Copiar resultados**: Exporte análises em JSON para área de transferência
- **Baixar JSON**: Salve análises completas como arquivo
- **Tema escuro**: Alternância entre tema claro e escuro
- **Backend configurável**: Altere a URL do servidor via interface
- **Endpoint /health**: Verifique rapidamente a configuração do backend

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

3. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com sua chave da API Groq:

```env
GROQ_API_KEY=sua_chave_da_api_groq
GROQ_MODEL=llama-3.1-8b-instant
```

> **Obter chave**: Acesse https://console.groq.com/keys para gerar sua API key

5. Inicie o servidor backend:

```bash
npm start
```

> O backend estará disponível em `http://localhost:3000`

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