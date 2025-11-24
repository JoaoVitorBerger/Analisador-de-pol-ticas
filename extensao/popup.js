const btn = document.getElementById("analisar");
const statusEl = document.getElementById("status");
const out = document.getElementById("resultado");
const btnCopiar = document.getElementById("copiar");
const btnBaixar = document.getElementById("baixar");
const btnTema = document.getElementById("tema");
const btnAbrirConfig = document.getElementById("abrir-config");
const secConfig = document.getElementById("configuracoes");
const secHistorico = document.getElementById("historico");
const histList = document.getElementById("hist-list");
const histCount = document.getElementById("hist-count");
const inputBackend = document.getElementById("backend-url");
const btnSalvarConfig = document.getElementById("salvar-config");
const btnFecharConfig = document.getElementById("fechar-config");

let ultimoResultado = null;
let backendUrl = "http://127.0.0.1:3000";
let temaAtual = "light";

// Utilitário para evitar injetar HTML acidentalmente
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Renderiza uma seção (card) com título e lista
function renderSection(title, items, icon) {
  const hasItems = Array.isArray(items) && items.length > 0;
  const list = hasItems
    ? items.map(i => `<li>${icon} ${esc(i)}</li>`).join("")
    : `<li class="muted">nenhum encontrado</li>`;
  return `
    <section class="card">
      <div class="row">
        <h4>${esc(title)}</h4>
        <span class="pill">${hasItems ? `${items.length} item(ns)` : "vazio"}</span>
      </div>
      <ul>${list}</ul>
    </section>
  `;
}

// Renderiza a barra e selo de intrusividade
function renderIntrusividade(intr) {
  const nota = Number(intr?.nota ?? 0);
  const nivel = (intr?.nivel || "baixo").toLowerCase();
  const lvlClass =
    nivel === "alto" ? "lvl-alto" : nivel === "medio" ? "lvl-medio" : "lvl-baixo";

  return `
    <section class="card">
      <div class="row">
        <h4>Taxa de intrusão</h4>
        <span class="pill">${esc(nivel)} • ${isNaN(nota) ? 0 : nota}%</span>
      </div>
      <div class="meter" aria-label="nível de intrusividade">
        <div class="fill ${lvlClass}" style="width:${isNaN(nota) ? 0 : nota}%"></div>
      </div>
    </section>
  `;
}

// Render final com os tópicos solicitados
function renderAnalisePII(data) {
  const html = [
    renderIntrusividade(data.intrusividade),
    renderSection("Dados coletados", data.dados_coletados, "📄"),
    renderSection("Dados sensíveis", data.dados_sensiveis, "🔒"),
    renderSection("Rastreamento", data.rastreamento, "📡"),
    renderSection("Compartilhamento", data.compartilhamento, "🔁")
  ].join("");

  out.innerHTML = html;
}

async function getAbaAtiva() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs[0] ? tabs[0] : null;
}

function getHost(url) {
  try { return new URL(url).host; } catch { return ""; }
}

function storageGet(area, keys) {
  return new Promise((resolve) => area.get(keys, (res) => resolve(res || {})));
}

function storageSet(area, obj) {
  return new Promise((resolve) => area.set(obj, () => resolve()));
}

async function carregarPreferencias() {
  const { backendUrl: bu, theme } = await storageGet(chrome.storage.sync, ["backendUrl", "theme"]);
  if (typeof bu === "string" && bu.trim()) backendUrl = bu.trim();
  if (typeof theme === "string") temaAtual = theme;
  if (inputBackend) inputBackend.value = backendUrl;
  document.body.classList.toggle("dark", temaAtual === "dark");
}

async function salvarPreferencias() {
  backendUrl = (inputBackend?.value || backendUrl).trim();
  await storageSet(chrome.storage.sync, { backendUrl, theme: temaAtual });
}

async function carregarHistorico(host) {
  const key = `hist:${host}`;
  const obj = await storageGet(chrome.storage.local, [key]);
  const lista = Array.isArray(obj[key]) ? obj[key] : [];
  histList.innerHTML = "";
  if (lista.length === 0) {
    secHistorico.hidden = true;
    histCount.textContent = "0";
    return;
  }
  secHistorico.hidden = false;
  histCount.textContent = String(lista.length);
  for (const item of lista.slice().reverse()) {
    const li = document.createElement("li");
    const ts = new Date(item.ts || Date.now());
    const label = `${ts.toLocaleDateString()} ${ts.toLocaleTimeString()} — nota ${item?.intrusividade?.nota ?? 0}`;
    li.textContent = label;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      ultimoResultado = item;
      renderAnalisePII(item);
      btnCopiar.disabled = false;
      btnBaixar.disabled = false;
    });
    histList.appendChild(li);
  }
}

async function salvarHistorico(host, data) {
  const key = `hist:${host}`;
  const obj = await storageGet(chrome.storage.local, [key]);
  const lista = Array.isArray(obj[key]) ? obj[key] : [];
  lista.push({ ...data, ts: Date.now() });
  const max = 10;
  const novo = lista.slice(-max);
  await storageSet(chrome.storage.local, { [key]: novo });
}

function habilitarAcao(tem) {
  btnCopiar.disabled = !tem;
  btnBaixar.disabled = !tem;
}

btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    statusEl.textContent = "Capturando texto da página…";

    const tab = await getAbaAtiva();

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    }, async (results) => {
      if (!results || !results[0] || !results[0].result) {
        statusEl.textContent = "Erro: não foi possível capturar o texto da página.";
        btn.disabled = false;
        return;
      }

      const texto = results[0].result;
      statusEl.textContent = "Analisando…";

      try {
        const base = backendUrl.replace(/\/$/, "");
        const resp = await fetch(`${base}/analisar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto })
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();

        renderAnalisePII(data);
        ultimoResultado = data;
        habilitarAcao(true);
        const host = getHost(tab?.url || "");
        if (host) await salvarHistorico(host, data);
        if (host) await carregarHistorico(host);

        statusEl.textContent = "Pronto.";
      } catch (err) {
        console.error("Erro no fetch:", err);
        statusEl.textContent = "Erro ao conectar com backend.";
        out.innerHTML = `
          <section class="card">
            <h4>Falha na análise</h4>
            <p class="muted">Verifique se o servidor está rodando em <code>http://127.0.0.1:3000</code> e as permissões no manifest.</p>
          </section>
        `;
      } finally {
        btn.disabled = false;
      }
    });
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Erro inesperado.";
    btn.disabled = false;
  }
});

btnCopiar?.addEventListener("click", async () => {
  if (!ultimoResultado) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(ultimoResultado, null, 2));
    statusEl.textContent = "JSON copiado.";
  } catch {
    statusEl.textContent = "Falha ao copiar.";
  }
});

btnBaixar?.addEventListener("click", () => {
  if (!ultimoResultado) return;
  const blob = new Blob([JSON.stringify(ultimoResultado, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "analise.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

btnTema?.addEventListener("click", async () => {
  temaAtual = temaAtual === "dark" ? "light" : "dark";
  document.body.classList.toggle("dark", temaAtual === "dark");
  await salvarPreferencias();
});

btnAbrirConfig?.addEventListener("click", () => {
  secConfig.hidden = !secConfig.hidden;
});

btnFecharConfig?.addEventListener("click", () => {
  secConfig.hidden = true;
});

btnSalvarConfig?.addEventListener("click", async () => {
  await salvarPreferencias();
  statusEl.textContent = "Configuração salva.";
});

(async () => {
  habilitarAcao(false);
  await carregarPreferencias();
  const tab = await getAbaAtiva();
  const host = getHost(tab?.url || "");
  if (host) await carregarHistorico(host);
})();
