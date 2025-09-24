document.getElementById("analisar").addEventListener("click", async () => {
  alert("Botão clicado!"); // debug
  console.log("Botão clicado");

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("Aba ativa:", tab);

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  }, async (results) => {
    console.log("Texto capturado:", results);

    if (!results || !results[0] || !results[0].result) {
      document.getElementById("resultado").textContent =
        "Erro: não foi possível capturar o texto da página";
      return;
    }

    // texto da página
    const texto = results[0].result;

    // corta para não estourar tokens (~10k chars ~ 3.5k tokens)
    const textoLimitado = texto.substring(0, 10000);
    console.log("Texto limitado:", textoLimitado.length);

    try {
      const resp = await fetch("http://127.0.0.1:3000/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: textoLimitado }) // 🔥 nome da chave correto
      });

      const data = await resp.json();
      console.log("Resposta backend:", data);

      document.getElementById("resultado").textContent =
        JSON.stringify(data, null, 2);
    } catch (err) {
      console.error("Erro no fetch:", err);
      document.getElementById("resultado").textContent =
        "Erro ao conectar com backend";
    }
  });
});
