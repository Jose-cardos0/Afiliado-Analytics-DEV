"use strict";

function encodeSessionToken(input) {
  return btoa(unescape(encodeURIComponent(input)));
}

function fetchCookie(siteUrl, cookieName) {
  return new Promise((resolve) => {
    chrome.cookies.get({ url: siteUrl, name: cookieName }, (result) => {
      resolve(result ?? null);
    });
  });
}

async function fetchMultipleCookies(siteUrl, names) {
  const entries = await Promise.all(
    names.map(async (name) => {
      const cookie = await fetchCookie(siteUrl, name);
      return [name, cookie?.value ?? null];
    })
  );
  return Object.fromEntries(entries.filter(([, v]) => v !== null));
}

const ui = {
  status:   document.getElementById("statusMsg"),
  domain:   document.getElementById("domainText"),
  dot:      document.getElementById("domainDot"),
  output:   document.getElementById("tokenOutput"),
  copyBtn:  document.getElementById("btnCopyToken"),
  navLinks: document.getElementById("navLinks"),
};

// Helpers para controlar a bolinha
function setDotGreen() {
  ui.dot.classList.remove("dot-error");
}

function setDotRed() {
  ui.dot.classList.add("dot-error");
}

ui.copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(ui.output.value);
    ui.status.textContent = "✓ Token copiado para a área de transferência.";
  } catch {
    ui.status.textContent = "✗ Não foi possível copiar o token.";
  }
});

async function init() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab?.url) {
    setDotRed();
    ui.status.textContent = "Não foi possível identificar a aba ativa.";
    return;
  }

  const currentUrl = activeTab.url;

  // ── Mercado Livre ──────────────────────────────────────────────────
  if (currentUrl.includes("mercadolivre.com.br")) {
    setDotGreen();
    ui.domain.textContent = "Mercado Livre detectado";
    ui.status.textContent = "Buscando sessão...";
    ui.navLinks.style.display = "none";

    const sessionCookie = await fetchCookie("https://www.mercadolivre.com.br/", "ssid");

    if (!sessionCookie?.value) {
      setDotRed();
      ui.status.textContent = "Sessão não encontrada. Você está logado?";
      ui.output.value = "";
      ui.copyBtn.disabled = true;
      return;
    }

    const rawSession = `ssid=${sessionCookie.value}`;
    ui.output.value  = encodeSessionToken(rawSession);
    ui.copyBtn.disabled = false;
    ui.status.textContent = "✓ Token gerado com sucesso.";
    return;
  }

  // ── Amazon ─────────────────────────────────────────────────────────
  if (currentUrl.includes("amazon.com.br")) {
    setDotGreen();
    ui.domain.textContent = "Amazon detectada";
    ui.status.textContent = "Buscando sessão...";
    ui.navLinks.style.display = "none";

    const TARGET_COOKIES = ["ubid-acbbr", "x-acbbr", "at-acbbr"];
    const found = await fetchMultipleCookies("https://www.amazon.com.br/", TARGET_COOKIES);

    if (!found["ubid-acbbr"] && !found["at-acbbr"]) {
      setDotRed();
      ui.status.textContent = "Sessão não encontrada. Você está logado na Amazon?";
      ui.output.value = "";
      ui.copyBtn.disabled = true;
      return;
    }

    const parts = [];
    if (found["ubid-acbbr"]) parts.push(`ubid-acbbr=${found["ubid-acbbr"]}`);
    if (found["x-acbbr"])    parts.push(`x-acbbr="${found["x-acbbr"]}"`);
    if (found["at-acbbr"])   parts.push(`at-acbbr=${found["at-acbbr"]}`);

    ui.output.value     = encodeSessionToken(parts.join("; "));
    ui.copyBtn.disabled = false;
    ui.status.textContent = "✓ Token da Amazon gerado.";
    return;
  }

  // ── Site não suportado ─────────────────────────────────────────────
  setDotRed();
  ui.domain.textContent   = "Site não suportado";
  ui.status.textContent   = "Para capturar seu token, acesse o Mercado Livre ou a Amazon.";
  ui.output.value         = "";
  ui.copyBtn.disabled     = true;
  ui.navLinks.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", init);