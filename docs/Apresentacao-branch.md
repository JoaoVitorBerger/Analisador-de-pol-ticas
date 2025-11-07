# Apresentação da Branch Modificada - Analisador de Políticas

## Contexto
Este documento apresenta as funcionalidades implementadas na branch modificada do projeto "Analisador de Políticas" como parte do trabalho da faculdade. A branch foi criada a partir do repositório principal e enriquecida com novas features que mantêm o escopo original de análise de privacidade, mas adicionam usabilidade e flexibilidade.

## Novas Funcionalidades Implementadas

### 1. Histórico por Domínio
- **Descrição**: Mantém um histórico das últimas 10 análises realizadas para cada domínio específico
- **Implementação**: Utiliza `chrome.storage.local` para persistir os dados no formato `hist:{domínio}`
- **Interface**: Seção "Histórico desta página" que aparece quando há análises anteriores
- **Funcionalidade**: Clique em qualquer item do histórico para visualizar novamente os resultados

### 2. Copiar e Baixar Resultados JSON
- **Descrição**: Permite exportar os resultados da análise em formato JSON
- **Copiar**: Botão "Copiar" que envia o JSON para a área de transferência
- **Baixar**: Botão "Baixar" que inicia o download do arquivo `analise.json`
- **Estado**: Botões ficam habilitados apenas após uma análise bem-sucedida

### 3. Tema Escuro
- **Descrição**: Alternância entre tema claro e escuro da interface
- **Implementação**: CSS variables com classe `body.dark` e persistência via `chrome.storage.sync`
- **Interface**: Botão "Tema" na toolbar que alterna visualmente o tema
- **Persistência**: Preferência do tema é salva e restaurada ao reabrir a extensão

### 4. Backend Configurável
- **Descrição**: Permite alterar a URL do backend via interface
- **Implementação**: Input de texto na seção "Configurações" com salvamento automático
- **Interface**: Botão "Config" abre/fecha a seção de configurações
- **Padrão**: `http://127.0.0.1:3000` (configurável)

## Alterações nos Arquivos

### `extensao/manifest.json`
- Adicionadas permissões: `"tabs"` e `"storage"`
- Adicionado host permission: `"http://127.0.0.1:3000/*"`

### `extensao/popup.html`
- Substituição do CSS inline por referência externa: `<link rel="stylesheet" href="style.css">`
- Nova toolbar com 5 botões: Analisar, Copiar, Baixar, Tema, Config
- Nova seção `<section id="historico">` para exibir histórico por domínio
- Nova seção `<section id="configuracoes">` com input para backend URL

### `extensao/style.css`
- Estilos para toolbar com layout flex e wrap
- Estilos para inputs e seção de configurações
- Implementação completa do tema escuro com CSS variables
- Classes utilitárias para cfg-row e melhorias visuais

### `extensao/popup.js`
- Novas constantes para todos os elementos da interface
- Funções de storage: `storageGet()`, `storageSet()`, `carregarPreferencias()`, `salvarPreferencias()`
- Sistema de histórico: `carregarHistorico()`, `salvarHistorico()`
- Funcionalidades de exportação: copiar para clipboard e download JSON
- Sistema de tema: alternância e persistência
- Backend configurável com validação e fallback
- Melhorias na UX com feedback visual e estado dos botões

### `server.js`
- Aumento de `MAX_OUTPUT_TOKENS` de 300 para 800 para evitar truncamento
- Remoção de `stop` tokens que podiam cortar o JSON prematuramente
- Validação de `GROQ_API_KEY` com erro 500 se ausente
- Logs de debug detalhados para chamadas à API Groq
- Novo endpoint `/health` para diagnóstico da configuração
- Melhor tratamento de erros HTTP da API Groq

### Arquivos de Configuração
- `.env.example`: Template com placeholders para variáveis de ambiente
- `.gitignore`: Incluído `/.env` para não commitar chaves de API
- `package.json`: Adicionado `"type": "module"` para suporte a ESM

## Decisões de Design

### Storage Strategy
- **Sync storage**: Para preferências globais (backend URL, tema)
- **Local storage**: Para histórico específico por domínio
- **Razão**: Sync sincroniza entre dispositivos, local é mais rápido e ilimitado

### Histórico Limitado
- Mantém apenas 10 análises por domínio para evitar sobrecarga
- Implementação com slice para manter os mais recentes
- Timestamp incluído para ordenação e contexto

### Tema com CSS Variables
- Facilita manutenção e adição de novos temas
- Transições suaves entre temas
- Persistência automática da preferência

### Backend Configurável
- Flexibilidade para diferentes ambientes (dev, prod, localhost)
- Validação de URL com fallback para valor padrão
- Feedback visual ao salvar configurações

### Robustez no Backend
- Validação de API key para erro claro antes de chamar Groq
- Logs detalhados para debugging de problemas
- Endpoint health para verificação rápida de configuração

## Arquitetura e Fluxo

### Fluxo de Análise
1. Usuário clica em "Analisar"
2. Captura texto da página ativa
3. Envia para backend configurável
4. Recebe JSON e renderiza resultados
5. Salva no histórico do domínio atual
6. Habilita botões de exportação

### Fluxo de Configuração
1. Usuário clica em "Config"
2. Interface de configurações aparece
3. Usuário altera backend URL
4. Clica em "Salvar"
5. Preferências salvas em sync storage
6. Feedback visual de sucesso

### Fluxo de Histórico
1. Ao carregar popup, busca histórico do domínio atual
2. Exibe lista com timestamp e nota de intrusividade
3. Clique em item restaura visualização da análise
4. Habilita exportação para aquela análise específica

## Como Executar

### Pré-requisitos
- Node.js LTS instalado
- Chave da API Groq (obter em https://console.groq.com/keys)

### Setup do Backend
1. Navegar até a pasta do projeto
2. Copiar `.env.example` para `.env`: `cp .env.example .env`
3. Editar `.env` e colocar sua chave: `GROQ_API_KEY=sua_chave_aqui`
4. Instalar dependências: `npm install`
5. Iniciar servidor: `npm start`

### Setup da Extensão
1. Abrir Chrome e navegar para `chrome://extensions/`
2. Ativar "Modo do desenvolvedor"
3. Clicar "Carregar sem compactação"
4. Selecionar a pasta `extensao/` do projeto
5. Extensão aparecerá no toolbar do Chrome

### Verificação
1. Acessar `http://localhost:3000/health` no navegador
2. Deve retornar JSON com status da configuração
3. Extensão deve analisar páginas e mostrar resultados

## Sugestões de Demonstração

### Cenário 1: Análise Básica
1. Acessar uma página com política de privacidade
2. Clicar no ícone da extensão
3. Clicar em "Analisar"
4. Observar resultados e taxa de intrusividade

### Cenário 2: Histórico
1. Fazer várias análises no mesmo site
2. Observar histórico preenchendo automaticamente
3. Clicar em itens do histórico para restaurar análises

### Cenário 3: Exportação
1. Após análise, clicar em "Copiar"
2. Colar em editor de texto para mostrar JSON
3. Clicar em "Baixar" e mostrar arquivo salvo

### Cenário 4: Configuração
1. Clicar em "Config"
2. Alterar backend URL
3. Salvar e observar persistência

### Cenário 5: Tema
1. Clicar em "Tema" para alternar
2. Observar mudança visual imediata
3. Fechar e reabrir extensão para mostrar persistência

## Limitações Conhecidas

### Técnicas
- Análise limitada a texto visível da página
- Dependência de qualidade da API Groq
- Limite de tokens pode truncar políticas muito longas

### Funcionais
- Histórico não sincroniza entre dispositivos
- Sem exportação em outros formatos além de JSON
- Configuração de backend requer conhecimento técnico

## Trabalhos Futuros

### Curto Prazo
- Exportação em formato CSV
- Indicador visual de progresso durante análise
- Validação de URL do backend com teste de conexão

### Longo Prazo
- Sincronização de histórico via nuvem
- Análise de termos de serviço
- Integração com múltiplas APIs de LLM
- Interface para edição manual de resultados

## Conclusão

Esta branch modificada mantém a funcionalidade核心 do projeto original enquanto adiciona significativamente a usabilidade e flexibilidade. As novas features foram implementadas com atenção à experiência do usuário, robustez técnica e manutenibilidade de código. O projeto está pronto para uso e demonstração, com todas as dependências configuradas e documentação completa.
