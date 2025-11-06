(function(){
    if (window.__guardiao_extractPolicies) return; // idempotente
  
    // Heurística: pegue texto da página se tiver sinais de termos/política;
    // se não, procure links que apontem para privacy/terms/cookies e tente buscar via background.
    async function extractPolicies() {
      const url = location.href;
      const pageTitle = document.title || '';
      const pageText = getReadableText(document.body);
  
      const looksLikePolicy = /privacy|pol(í|i)tica|termos|terms|cookies|consent|gdpr|lgpd/i.test(pageTitle + ' ' + pageText.slice(0, 2000));
  
      if (looksLikePolicy && (pageText?.length || 0) > 2000) {
        return { url, pageTitle, text: pageText };
      }
  
      // procurar links candidatos
      const candidateLinks = [...document.querySelectorAll('a[href]')]
        .map(a => ({ href: new URL(a.getAttribute('href'), location.href).href, text: (a.textContent||'').trim().toLowerCase() }))
        .filter(a => /(privacy|pol(í|i)tica|termos|terms|cookies|consent|opt.?out|do.?not.?sell)/i.test(a.href + ' ' + a.text))
        .slice(0, 5);
  
      // tenta fetch via mesma página (CORS pode bloquear). Se falhar, ainda assim devolve o texto atual.
      for (const link of candidateLinks) {
        try {
          const html = await (await fetch(link.href, { credentials: 'include' })).text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const text = getReadableText(doc.body);
          if ((text?.length||0) > 1500) {
            return { url: link.href, pageTitle: doc.title || pageTitle, text };
          }
        } catch {}
      }
  
      return { url, pageTitle, text: pageText || '' };
    }
  
    function getReadableText(root){
      if (!root) return '';
      // remove navegação/comuns
      for (const sel of ['nav','footer','header','script','style','noscript','svg','canvas','img','video','aside']) {
        root.querySelectorAll(sel).forEach(n => n.remove());
      }
      // prioriza <main> / <article>
      const main = root.querySelector('main, article') || root;
      // junta blocos longos
      const blocks = [...main.querySelectorAll('h1,h2,h3,h4,p,li,section,div')]
        .filter(el => (el.innerText||'').trim().length > 30)
        .map(el => el.innerText.trim());
      return blocks.join('\n\n');
    }
  
    window.__guardiao_extractPolicies = extractPolicies;
  })();
  