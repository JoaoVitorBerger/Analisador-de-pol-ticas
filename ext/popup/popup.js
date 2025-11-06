const apiBaseEl = document.getElementById('apiBase');
const apiKeyEl  = document.getElementById('apiKey');
const saveBtn   = document.getElementById('save');
const saveStatus= document.getElementById('saveStatus');
const scanBtn   = document.getElementById('scan');
const declineBtn= document.getElementById('decline');
const resultEl  = document.getElementById('result');

(async () => {
  const { apiBase, apiKey } = await chrome.storage.sync.get(['apiBase','apiKey']);
  if (apiBase) apiBaseEl.value = apiBase;
  if (apiKey)  apiKeyEl.value = apiKey;
})();

saveBtn.onclick = async () => {
  await chrome.storage.sync.set({
    apiBase: apiBaseEl.value.trim(),
    apiKey: apiKeyEl.value.trim()
  });
  saveStatus.textContent = 'Salvo!';
  setTimeout(()=> saveStatus.textContent='', 1500);
};

scanBtn.onclick = async () => {
  resultEl.textContent = 'Lendo e extraindo termos/política...';

  // pede permissão da aba ativa implicitamente (activeTab) e injeta:
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  await chrome.scripting.executeScript({ target:{tabId: tab.id}, files: ['extractor.js'] });

  const [{ result, error }] = await chrome.scripting.executeScript({
    target:{tabId: tab.id},
    func: async () => await window.__guardiao_extractPolicies?.()
  });

  if (error || !result?.text) {
    resultEl.textContent = `Falha ao extrair texto: ${error || 'vazio'}`;
    return;
  }

  const {apiBase} = await chrome.storage.sync.get(['apiBase']);
if (!apiBase) {
  resultEl.textContent = 'Configure a API Base URL nas opções.';
  return;
}


function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")   // **negrito**
    .replace(/- (.*)/g, "• $1");              // lista com bullets
}
  resultEl.textContent = 'Enviando para IA...';

  try {
    console.log(apiBase)
    const res = await fetch(apiBase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: result.url,
        pageTitle: result.pageTitle,
        extractedText: result.text.slice(0, 200_000)
      })
    });
    const data = await res.json();
  
    // 👉 Agora mostra o JSON inteiro da resposta, formatado
    resultEl.innerHTML = `
  <h3>Resposta da IA:</h3>
  <div style="white-space: pre-wrap; font-family: sans-serif;">
    ${formatMarkdown(data.raw || data)}
  </div>
`;
  
  } catch (e) {
    resultEl.textContent = 'Erro ao chamar IA: ' + (e?.message || e);
  }

  }

declineBtn.onclick = async () => {
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  await chrome.scripting.executeScript({ target:{tabId: tab.id}, files: ['decliner.js'] });
  const [{ result }] = await chrome.scripting.executeScript({
    target:{tabId: tab.id},
    func: async () => await window.__guardiao_declineAll?.()
  });
  const { clicked, tried, details } = result || {};
  const msg = `Tentativa de recusa: ${clicked} botões clicados / ${tried} tentativas.\n` +
              (details?.length ? ('\n' + details.map(d=>`- ${d}`).join('\n')) : '');
  alert(msg);
};

function flag(v){
  if (v === true)  return 'SIM ✅';
  if (v === false) return 'NÃO ✅';
  return 'DESCONHECIDO ⚠️';
}
