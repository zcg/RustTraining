(() => {
  const TOKEN = "§§ZH§§";
  let imageModal = null;

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

  function analyzeText(text) {
    const normalized = (text || "").replace(/\s+/g, " ").trim();
    return {
      text: normalized,
      han: (normalized.match(/[\u3400-\u9fff]/g) || []).length,
      latin: (normalized.match(/[A-Za-z]/g) || []).length,
    };
  }

  function analyzeNodes(nodes) {
    return analyzeText(nodes.map((node) => node.textContent || "").join(" "));
  }

  function detectLanguage(stats) {
    if (!stats.text) return "unknown";
    if (stats.han > 0) return "zh";
    if (stats.latin >= 3) return "en";
    return "mixed";
  }

  function appendNodeList(target, nodes) {
    nodes.forEach((node) => target.appendChild(node));
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
    const englishStats = analyzeNodes(englishNodes);
    const zhStats = analyzeText(zhNode.textContent || "");
    const englishLang = detectLanguage(englishStats);
    const zhLang = detectLanguage(zhStats);
    const shouldSwap = englishLang !== "en" && englishStats.han > 0 && zhLang === "en";
    const shouldUseZhStyleForLower = !shouldSwap && englishLang !== "en" && englishStats.han > 0;

    const upper = document.createElement("span");
    const lower = document.createElement("span");

    if (shouldSwap) {
      upper.className = inSidebar ? "bi-zh" : "bi-main-zh";
      lower.className = inSidebar ? "bi-en" : "bi-main-en";
      appendNodeList(upper, englishNodes);
      while (zhNode.firstChild) {
        lower.appendChild(zhNode.firstChild);
      }
    } else {
      upper.className = zhLang === "en" ? (inSidebar ? "bi-en" : "bi-main-en") : (inSidebar ? "bi-zh" : "bi-main-zh");
      lower.className = shouldUseZhStyleForLower
        ? inSidebar
          ? "bi-zh bi-zh-alt"
          : "bi-main-zh bi-main-zh-alt"
        : inSidebar
          ? "bi-en"
          : "bi-main-en";

      while (zhNode.firstChild) {
        upper.appendChild(zhNode.firstChild);
      }
      appendNodeList(lower, englishNodes);
    }

    if (!lower.querySelector("strong")) {
      container.classList.add("no-number");
    }

    container.replaceChildren(upper, lower);
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

  function ensureImageModal() {
    if (imageModal) return imageModal;

    const root = document.createElement("div");
    root.className = "bi-image-modal";
    root.hidden = true;
    root.innerHTML = `
      <div class="bi-image-modal-backdrop" data-close="1"></div>
      <div class="bi-image-modal-dialog" role="dialog" aria-modal="true" aria-label="图片预览">
        <button type="button" class="bi-image-modal-close" aria-label="关闭预览" title="关闭预览">×</button>
        <img class="bi-image-modal-content" alt="" />
        <div class="bi-image-modal-caption"></div>
      </div>
    `;

    const img = root.querySelector(".bi-image-modal-content");
    const caption = root.querySelector(".bi-image-modal-caption");
    const close = () => {
      root.hidden = true;
      document.body.classList.remove("bi-image-modal-open");
      img.removeAttribute("src");
      img.alt = "";
      caption.textContent = "";
    };

    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-close='1'], .bi-image-modal-close")) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.hidden) {
        close();
      }
    });

    document.body.appendChild(root);
    imageModal = { root, img, caption, close };
    return imageModal;
  }

  function openImageModal(image) {
    const src = image.currentSrc || image.getAttribute("src");
    if (!src) return;

    const modal = ensureImageModal();
    modal.img.src = src;
    modal.img.alt = image.alt || "";
    modal.caption.textContent = image.alt || image.getAttribute("title") || "";
    modal.root.hidden = false;
    document.body.classList.add("bi-image-modal-open");
  }

  function decorateImages() {
    document.querySelectorAll("main img").forEach((image) => {
      if (image.dataset.biZoomReady === "1") return;
      if (image.closest(".bi-image-shell, .bi-image-modal")) return;

      const wrapper = document.createElement("span");
      wrapper.className = "bi-image-shell";
      image.parentNode.insertBefore(wrapper, image);
      wrapper.appendChild(image);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "bi-image-zoom-button";
      button.setAttribute("aria-label", "放大查看图片");
      button.setAttribute("title", "放大查看");
      button.textContent = "⤢";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openImageModal(image);
      });

      wrapper.appendChild(button);
      image.dataset.biZoomReady = "1";
    });
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
    decorateImages();

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
