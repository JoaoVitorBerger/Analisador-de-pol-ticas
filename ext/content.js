// content.js
// Content script básico da extensão Guardião

(function() {
    console.log("[Guardião IA] content.js injetado na página:", window.location.href);
  
    // Exemplo: expor uma função global (se precisar no futuro)
    window.__guardiao_ping = () => {
      return "content.js ativo em " + window.location.hostname;
    };
  })();
  