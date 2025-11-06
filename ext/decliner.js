(function(){
    if (window.__guardiao_declineAll) return;
  
    const SELECTORS = [
      // Botões comuns (i18n)
      'button#onetrust-reject-all-handler',
      'button[aria-label*="Reject"]','button[aria-label*="Recusar"]','button[aria-label*="Rejeitar"]',
      'button:contains("Reject")','button:contains("Recusar")','button:contains("Rejeitar")',
      '[role="button"]:contains("Reject")','[role="button"]:contains("Recusar")','[role="button"]:contains("Rejeitar")',
      'button#truste-consent-button', // variações antigas
      // Preferências
      'button:contains("Opt out")','a:contains("Opt out")','a:contains("Do Not Sell")','button:contains("Do Not Sell")',
      'a[href*="donotsell"]','a[href*="do-not-sell"]','a[href*="optout"]'
    ];
  
    // :contains selector não existe nativo; vamos criar util “matchText”.
    function matchText(el, term){
      return (el.textContent||'').toLowerCase().includes(term.toLowerCase());
    }
  
    function findCandidates(){
      const allButtons = [...document.querySelectorAll('button, [role="button"], a')];
      const terms = ['reject','recusar','rejeitar','opt out','do not sell','não vender','não vender meus dados'];
      return allButtons.filter(b => terms.some(t => matchText(b, t)));
    }
  
    async function declineAll(){
      const details = [];
      let clicked = 0, tried = 0;
  
      // Tenta seletor direto
      for (const sel of SELECTORS) {
        tried++;
        const els = [...document.querySelectorAll(sel)].filter(Boolean);
        for (const el of els) {
          try { el.click(); clicked++; details.push(`Clique: ${describe(el)}`); } catch(e) { details.push(`Falhou: ${sel}`); }
        }
      }
  
      // Varredura textual
      const more = findCandidates();
      for (const el of more) {
        tried++;
        try { el.click(); clicked++; details.push(`Clique textual: ${describe(el)}`); } catch(e) {}
      }
  
      // Alguns banners têm camadas: abrir "Gerenciar Preferências" -> "Rejeitar tudo"
      const prefs = [...document.querySelectorAll('button, [role="button"], a')].filter(b => matchText(b, 'prefer') || matchText(b,'gerenciar') || matchText(b,'manage'));
      for (const el of prefs.slice(0,3)) {
        tried++;
        try { el.click(); details.push(`Abrir preferências: ${describe(el)}`); await sleep(300); } catch(e){}
        const rejects = findCandidates();
        for (const r of rejects.slice(0,3)) { tried++; try { r.click(); clicked++; details.push(`Rejeitar em prefs: ${describe(r)}`); } catch(e){} }
      }
  
      return { clicked, tried, details };
    }
  
    function describe(el){
      const txt = (el.textContent||'').trim().slice(0,60).replace(/\s+/g,' ');
      return `<${el.tagName.toLowerCase()}> "${txt}"`;
    }
  
    const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  
    window.__guardiao_declineAll = declineAll;
  })();
  