const apiBaseEl = document.getElementById('apiBase');
const statusEl = document.getElementById('status');

(async () => {
  const apiBase  = await chrome.storage.sync.get(['apiBase']);
  if (apiBase) apiBaseEl.value = apiBase;
})();

document.getElementById('save').onclick = async () => {
  await chrome.storage.sync.set({ apiBase: apiBaseEl.value.trim()});
  statusEl.textContent = 'Salvo!';
  setTimeout(()=> statusEl.textContent='', 1500);
};
