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

  function trimTrailingEnglishNodes(nodes) {
    while (nodes.length > 0) {
      const last = nodes[nodes.length - 1];
      if (last.nodeType === Node.TEXT_NODE && !(last.textContent || "").trim()) {
        nodes.pop();
        continue;
      }
      if (last.nodeType === Node.ELEMENT_NODE && last.nodeName === "BR") {
        nodes.pop();
        continue;
      }
      break;
    }
  }

  function renderInlinePair(zhNode) {
    const container = zhNode.parentElement;
    if (!container || container.dataset.biReady === "1") return;

    const children = Array.from(container.childNodes);
    const zhIndex = children.indexOf(zhNode);
    if (zhIndex <= 0) return;

    const englishNodes = children.slice(0, zhIndex);
    trimTrailingEnglishNodes(englishNodes);
    if (!englishNodes.length) return;

    const inSidebar = !!container.closest(".sidebar, .sidebar-scrollbox, .menu-title");

    const zh = document.createElement("span");
    zh.className = inSidebar ? "bi-zh" : "bi-main-zh";
    while (zhNode.firstChild) {
      zh.appendChild(zhNode.firstChild);
    }

    const en = document.createElement("span");
    en.className = inSidebar ? "bi-en" : "bi-main-en";
    englishNodes.forEach((node) => en.appendChild(node));

    if (!en.querySelector("strong")) {
      container.classList.add("no-number");
    }

    container.replaceChildren(zh, en);
    container.dataset.biReady = "1";
  }

  function renderAnchor(anchor) {
    if (!anchor || anchor.dataset.biReady === "1") return;
    const split = splitBilingual(anchor.textContent || "");
    if (!split) return;

    const strong = anchor.querySelector("strong");
    const enStrong = strong ? strong.cloneNode(true) : null;
    const zhStrong = strong ? strong.cloneNode(true) : null;
    const enText = enStrong
      ? stripLeadingMarker(split.en, enStrong.textContent || "")
      : split.en;
    const zhText = zhStrong
      ? stripLeadingMarker(split.zh, zhStrong.textContent || "")
      : split.zh;

    anchor.textContent = "";

    const en = document.createElement("span");
    en.className = "bi-en";
    if (enStrong) {
      en.appendChild(enStrong);
    } else {
      anchor.classList.add("no-number");
    }
    en.append(document.createTextNode(enText));

    const zh = document.createElement("span");
    zh.className = "bi-zh";
    if (zhStrong) {
      zh.appendChild(zhStrong);
    }
    zh.append(document.createTextNode(zhText));

    anchor.appendChild(zh);
    anchor.appendChild(en);
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

    node.appendChild(zh);
    node.appendChild(en);
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

    title.appendChild(zhSpan);
    title.appendChild(enSpan);
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

    document.querySelectorAll(".zh-inline").forEach(renderInlinePair);

    renderMenuTitle();

    if (document.title.includes(TOKEN)) {
      document.title = document.title.replace(/\s*§§ZH§§\s*/g, " | ");
    }
  }

  function start() {
    applyBilingualSidebar();

    const root = document.body;
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
