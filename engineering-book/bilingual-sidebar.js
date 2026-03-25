(() => {
  const TOKEN = "§§ZH§§";

  function splitBilingual(text) {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized.includes(TOKEN)) return null;
    const [en, zh] = normalized.split(TOKEN).map((part) => part.trim());
    if (!en || !zh) return null;
    return { en, zh };
  }

  function stripLeadingMarker(text, marker) {
    if (!marker) return text;
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`^${escaped}\\s*`), "").trimStart();
  }

  function renderAnchor(anchor) {
    if (!anchor || anchor.dataset.biReady === "1") return;
    const split = splitBilingual(anchor.textContent || "");
    if (!split) return;

    const strong = anchor.querySelector("strong");
    const strongClone = strong ? strong.cloneNode(true) : null;
    const enText = strongClone
      ? stripLeadingMarker(split.en, strongClone.textContent || "")
      : split.en;

    anchor.textContent = "";

    const en = document.createElement("span");
    en.className = "bi-en";
    if (strongClone) {
      en.appendChild(strongClone);
    } else {
      anchor.classList.add("no-number");
    }
    en.append(document.createTextNode(enText));

    const zh = document.createElement("span");
    zh.className = "bi-zh";
    zh.textContent = split.zh;

    anchor.appendChild(en);
    anchor.appendChild(zh);
    anchor.dataset.biReady = "1";
  }

  function renderPartTitle(node) {
    if (!node || node.dataset.biReady === "1") return;
    const split = splitBilingual(node.textContent || "");
    if (!split) return;

    node.textContent = "";

    const en = document.createElement("span");
    en.className = "bi-en";
    en.textContent = split.en;

    const zh = document.createElement("span");
    zh.className = "bi-zh";
    zh.textContent = split.zh;

    node.appendChild(en);
    node.appendChild(zh);
    node.dataset.biReady = "1";
  }

  function renderMenuTitle() {
    const title = document.querySelector(".menu-title");
    if (!title || title.dataset.biReady === "1") return;
    const raw = (title.textContent || "").trim();
    if (!raw.includes("|")) return;

    const [en, zh] = raw.split("|").map((part) => part.trim());
    if (!en || !zh) return;

    title.textContent = "";

    const enSpan = document.createElement("span");
    enSpan.className = "bi-en";
    enSpan.textContent = en;

    const zhSpan = document.createElement("span");
    zhSpan.className = "bi-zh";
    zhSpan.textContent = zh;

    title.appendChild(enSpan);
    title.appendChild(zhSpan);
    title.dataset.biReady = "1";
  }

  function applyBilingualSidebar() {
    document
      .querySelectorAll(
        ".sidebar .chapter .chapter-link-wrapper > a, .sidebar-scrollbox .chapter .chapter-link-wrapper > a"
      )
      .forEach(renderAnchor);

    document
      .querySelectorAll(".sidebar .chapter .part-title, .sidebar-scrollbox .chapter .part-title")
      .forEach(renderPartTitle);

    renderMenuTitle();

    if (document.title.includes(TOKEN)) {
      document.title = document.title.replace(/\s*§§ZH§§\s*/g, " | ");
    }
  }

  function start() {
    applyBilingualSidebar();

    const root = document.querySelector(".sidebar-scrollbox") || document.body;
    if (!root) return;

    const observer = new MutationObserver(() => applyBilingualSidebar());
    observer.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
