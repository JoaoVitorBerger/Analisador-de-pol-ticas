const btn = document.getElementById("analisar");
const statusEl = document.getElementById("status");
const out = document.getElementById("resultado");

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

btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    statusEl.textContent = "Capturando texto da página…";

    // captura o texto bruto da aba ativa
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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
        // chame o backend (ajuste se usa localhost em vez de 127.0.0.1)
        const resp = await fetch("http://127.0.0.1:3000/analisar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto })
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();

        // espera um objeto no formato:
        // { dados_coletados:[], dados_sensiveis:[], rastreamento:[], compartilhamento:[], intrusividade:{nota,nivel}}
        renderAnalisePII(data);

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
