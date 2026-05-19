(function () {
  "use strict";

  const selectors = {
    appShell: ".app-shell",
    toolbar: ".toolbar",
    panels: ".panel",
    stats: ".stat",
    articleTitle: "#articleTitle",
    englishText: "#englishText",
    translationInput: "#translationInput",
    savedStatus: "#savedStatus",
    feedback: "#feedback",
    history: ".history",
    submitBtn: "#submitBtn",
    saveBtn: "#saveBtn",
    randomBtn: "#randomBtn",
    resetBtn: "#resetBtn",
    toggleReferenceBtn: "#toggleReferenceBtn",
    diseaseFilter: "#diseaseFilter",
    articleSelect: "#articleSelect",
    searchInput: "#searchInput",
    wordCount: "#wordCount",
    completedCount: "#completedCount",
    totalCount: "#totalCount"
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  ready(() => {
    const app = qs(selectors.appShell);
    const englishText = qs(selectors.englishText);
    const translationInput = qs(selectors.translationInput);

    if (!app || !englishText || !translationInput) {
      return;
    }

    injectStyles();
    document.documentElement.classList.add("js-polished");

    const ui = buildEnhancements(app);
    wireDynamicDateSubtitle();
    wirePanelReveal();
    wireProgress(ui.readingBar);
    wireWritingMeter(ui);
    wireSentenceFocus();
    wireButtonFeedback();
    wireSelectGlow();
    wireKeyboardShortcuts();
    wireFeedbackObserver(ui);
    polishInitialState(ui);
  });

  function injectStyles() {
    if (qs("#dynamic-polish-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "dynamic-polish-styles";
    style.textContent = `
      :root {
        --polish-surface: rgba(255, 255, 255, 0.82);
        --polish-ink: #162033;
        --polish-teal: #0d6f6a;
        --polish-teal-2: #109083;
        --polish-gold: #b97822;
        --polish-blue: #315d92;
        --polish-ring: 0 0 0 4px rgba(16, 144, 131, 0.14);
        --polish-shadow: 0 22px 55px rgba(22, 32, 51, 0.12);
      }

      .js-polished {
        scroll-behavior: smooth;
      }

      .js-polished body {
        background:
          linear-gradient(135deg, rgba(230, 242, 240, 0.92) 0%, rgba(247, 248, 251, 0.9) 42%, rgba(250, 244, 235, 0.84) 100%),
          var(--wash);
      }

      .js-polished body::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(22, 107, 104, 0.055) 1px, transparent 1px),
          linear-gradient(90deg, rgba(22, 107, 104, 0.045) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent 72%);
      }

      .reading-progress {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 80;
        width: 100%;
        height: 4px;
        background: rgba(24, 33, 47, 0.08);
      }

      .reading-progress__bar {
        width: 0;
        height: 100%;
        background: linear-gradient(90deg, var(--polish-teal), var(--polish-gold), var(--polish-blue));
        box-shadow: 0 0 18px rgba(16, 144, 131, 0.32);
        transition: width 0.12s ease-out;
      }

      .js-polished .topbar {
        align-items: center;
      }

      .js-polished .topbar h1 {
        color: var(--polish-ink);
        text-wrap: balance;
      }

      .js-polished .subtitle {
        color: #526174;
      }

      .js-polished .toolbar {
        position: sticky;
        top: 12px;
        z-index: 20;
        backdrop-filter: blur(18px);
        background: var(--polish-surface);
        border-color: rgba(13, 111, 106, 0.16);
      }

      .js-polished .toolbar.is-active {
        box-shadow: 0 18px 48px rgba(22, 32, 51, 0.16);
      }

      .js-polished .panel,
      .js-polished .stat {
        border-color: rgba(13, 111, 106, 0.14);
        transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
      }

      .js-polished .panel {
        overflow: hidden;
      }

      .js-polished .panel:hover,
      .js-polished .stat:hover {
        border-color: rgba(13, 111, 106, 0.28);
        box-shadow: var(--polish-shadow);
      }

      .js-polished .panel.is-revealed,
      .js-polished .stat.is-revealed {
        animation: polishRise 0.48s ease both;
      }

      .js-polished .stat strong {
        color: var(--polish-teal);
      }

      .js-polished button {
        position: relative;
        overflow: hidden;
      }

      .js-polished button::after {
        content: "";
        position: absolute;
        inset: 50% auto auto 50%;
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.46);
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
        pointer-events: none;
      }

      .js-polished button.is-tapped::after {
        animation: polishRipple 0.42s ease-out;
      }

      .js-polished input:focus,
      .js-polished select:focus,
      .js-polished textarea:focus {
        border-color: var(--polish-teal);
        box-shadow: var(--polish-ring);
        outline: none;
      }

      .js-polished .article-body {
        background:
          linear-gradient(90deg, rgba(13, 111, 106, 0.08), transparent 28%),
          #fbfcfe;
      }

      .js-polished .english-text {
        font-size: 17px;
      }

      .sentence-chip {
        border-radius: 6px;
        padding: 1px 2px;
        transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
      }

      .sentence-chip:hover,
      .sentence-chip.is-current {
        background: rgba(245, 177, 66, 0.2);
        box-shadow: 0 0 0 2px rgba(245, 177, 66, 0.11);
      }

      .writing-console {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        align-items: center;
        margin-top: 10px;
        color: #59667a;
        font-size: 13px;
      }

      .writing-meter {
        position: relative;
        height: 8px;
        border-radius: 999px;
        background: rgba(24, 33, 47, 0.09);
        overflow: hidden;
      }

      .writing-meter span {
        display: block;
        width: 0;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--polish-teal), var(--polish-gold));
        transition: width 0.24s ease;
      }

      .writing-stats {
        white-space: nowrap;
      }

      .mini-navigator {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 70;
        display: grid;
        gap: 8px;
      }

      .mini-navigator button {
        width: 44px;
        height: 44px;
        min-height: 44px;
        padding: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 14px 32px rgba(22, 32, 51, 0.16);
        color: var(--polish-teal);
        font-weight: 800;
        backdrop-filter: blur(12px);
      }

      .mini-navigator button:hover,
      .mini-navigator button:focus-visible {
        background: var(--polish-teal);
        color: #fff;
      }

      .focus-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        color: #59667a;
        font-size: 13px;
      }

      .focus-badge::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--polish-teal-2);
        box-shadow: 0 0 0 5px rgba(16, 144, 131, 0.12);
      }

      .is-gently-lit {
        animation: polishGlow 0.8s ease both;
      }

      .feedback.visible {
        animation: polishOpen 0.32s ease both;
      }

      .polish-dark {
        color-scheme: dark;
      }

      .polish-dark body {
        --ink: #f2f7f7;
        --muted: #c7d2df;
        --line: rgba(206, 225, 235, 0.24);
        --panel: #172433;
        --wash: #0f1722;
        --accent: #38c9b9;
        --accent-strong: #91f1e5;
        --accent-soft: rgba(56, 201, 185, 0.18);
        background: linear-gradient(135deg, #0e1722 0%, #152537 56%, #1b1b24 100%);
        color: var(--ink);
      }

      .polish-dark body::before {
        background-image:
          linear-gradient(rgba(117, 231, 218, 0.075) 1px, transparent 1px),
          linear-gradient(90deg, rgba(117, 231, 218, 0.055) 1px, transparent 1px);
      }

      .polish-dark .toolbar,
      .polish-dark .panel,
      .polish-dark .stat,
      .polish-dark .success-toast,
      .polish-dark input,
      .polish-dark select,
      .polish-dark textarea,
      .polish-dark button,
      .polish-dark .term,
      .polish-dark .search-results,
      .polish-dark .search-result,
      .polish-dark .history-item {
        background: rgba(23, 36, 51, 0.96);
        color: var(--ink);
        border-color: rgba(206, 225, 235, 0.22);
      }

      .polish-dark .toolbar {
        background: rgba(17, 30, 43, 0.94);
      }

      .polish-dark .panel-header {
        background: rgba(20, 34, 48, 0.98);
      }

      .polish-dark .feedback,
      .polish-dark .article-body {
        background:
          linear-gradient(90deg, rgba(56, 201, 185, 0.12), transparent 30%),
          rgba(14, 25, 38, 0.96);
      }

      .polish-dark .topbar h1,
      .polish-dark h1,
      .polish-dark .section-title,
      .polish-dark .translation,
      .polish-dark .english-text,
      .polish-dark .panel-title,
      .polish-dark .history-item strong {
        color: var(--ink);
      }

      .polish-dark .subtitle,
      .polish-dark .field-label,
      .polish-dark .term span,
      .polish-dark .notes,
      .polish-dark .empty-state,
      .polish-dark .search-result span,
      .polish-dark .writing-console,
      .polish-dark .focus-badge,
      .polish-dark .success-toast span {
        color: var(--muted);
      }

      .polish-dark .english-text,
      .polish-dark .translation {
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.28);
      }

      .polish-dark input::placeholder,
      .polish-dark textarea::placeholder {
        color: #91a2b5;
        opacity: 1;
      }

      .polish-dark .chip {
        background: rgba(206, 225, 235, 0.14);
        color: #e5edf3;
      }

      .polish-dark .chip.accent,
      .polish-dark .self-rate button.selected,
      .polish-dark .search-result:hover,
      .polish-dark .search-result:focus-visible {
        background: rgba(56, 201, 185, 0.2);
        color: #bdfaf2;
      }

      .polish-dark .stat strong,
      .polish-dark .term strong {
        color: #91f1e5;
      }

      .polish-dark .mini-navigator button {
        background: rgba(23, 36, 51, 0.94);
        color: #dffdfa;
        border-color: rgba(206, 225, 235, 0.24);
      }

      .polish-dark .mini-navigator button:hover,
      .polish-dark .mini-navigator button:focus-visible {
        background: #38c9b9;
        color: #082026;
      }

      @keyframes polishRise {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes polishRipple {
        0% {
          opacity: 0.42;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(22);
        }
      }

      @keyframes polishGlow {
        0%, 100% {
          box-shadow: none;
        }
        40% {
          box-shadow: 0 0 0 5px rgba(16, 144, 131, 0.16);
        }
      }

      @keyframes polishOpen {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .js-polished *,
        .js-polished *::before,
        .js-polished *::after {
          animation-duration: 0.001ms !important;
          scroll-behavior: auto !important;
          transition-duration: 0.001ms !important;
        }
      }

      @media (max-width: 760px) {
        .js-polished .toolbar {
          top: 8px;
        }

        .writing-console {
          grid-template-columns: 1fr;
        }

        .mini-navigator {
          right: 12px;
          bottom: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildEnhancements(app) {
    const readingProgress = document.createElement("div");
    readingProgress.className = "reading-progress";
    readingProgress.setAttribute("aria-hidden", "true");
    readingProgress.innerHTML = '<div class="reading-progress__bar"></div>';
    document.body.prepend(readingProgress);

    const titleBlock = qs(".topbar > div", app);
    if (titleBlock && !qs(".focus-badge", titleBlock)) {
      const badge = document.createElement("div");
      badge.className = "focus-badge";
      badge.textContent = "沉浸式医学文献翻译练习";
      titleBlock.appendChild(badge);
    }

    const writingConsole = document.createElement("div");
    writingConsole.className = "writing-console";
    writingConsole.innerHTML = `
      <div class="writing-meter" aria-hidden="true"><span></span></div>
      <div class="writing-stats" aria-live="polite">已输入 0 字</div>
    `;
    qs(selectors.translationInput).insertAdjacentElement("afterend", writingConsole);

    const nav = document.createElement("div");
    nav.className = "mini-navigator";
    nav.innerHTML = `
      <button type="button" data-action="top" title="回到顶部" aria-label="回到顶部">↑</button>
      <button type="button" data-action="article" title="定位原文" aria-label="定位原文">文</button>
      <button type="button" data-action="theme" title="切换深色模式" aria-label="切换深色模式">◐</button>
    `;
    document.body.appendChild(nav);

    nav.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }

      if (button.dataset.action === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (button.dataset.action === "article") {
        qs(selectors.englishText)?.scrollIntoView({ behavior: "smooth", block: "center" });
        flash(qs(".article-body"));
      }

      if (button.dataset.action === "theme") {
        document.documentElement.classList.toggle("polish-dark");
        try {
          localStorage.setItem("medical-polish-theme", document.documentElement.classList.contains("polish-dark") ? "dark" : "light");
        } catch (error) {
          // Local storage can be unavailable in strict browser modes.
        }
      }
    });

    try {
      if (localStorage.getItem("medical-polish-theme") === "dark") {
        document.documentElement.classList.add("polish-dark");
      }
    } catch (error) {
      // Keep enhancement optional if storage is blocked.
    }

    return {
      readingBar: qs(".reading-progress__bar", readingProgress),
      writingBar: qs(".writing-meter span", writingConsole),
      writingStats: qs(".writing-stats", writingConsole),
      nav
    };
  }

  function wirePanelReveal() {
    const targets = qsa(`${selectors.panels}, ${selectors.stats}`);
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });

    targets.forEach((target) => observer.observe(target));
  }

  function wireDynamicDateSubtitle() {
    const subtitle = qs(".subtitle");
    if (!subtitle) {
      return;
    }

    const formatter = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    });

    const update = () => {
      subtitle.textContent = formatter.format(new Date());
    };

    update();
    window.setInterval(update, 60 * 1000);
  }

  function wireProgress(bar) {
    if (!bar) {
      return;
    }

    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable <= 0 ? 0 : Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
      bar.style.width = `${percent}%`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function wireWritingMeter(ui) {
    const input = qs(selectors.translationInput);
    const wordCount = qs(selectors.wordCount);
    if (!input || !ui.writingBar || !ui.writingStats) {
      return;
    }

    const update = () => {
      const chars = input.value.trim().length;
      const sourceWords = Number(wordCount?.textContent || 0);
      const target = Math.max(80, Math.round(sourceWords * 1.7));
      const percent = Math.min(100, Math.round((chars / target) * 100));
      ui.writingBar.style.width = `${percent}%`;
      ui.writingStats.textContent = `已输入 ${chars} 字`;
    };

    update();
    input.addEventListener("input", update);

    const observer = new MutationObserver(update);
    if (wordCount) {
      observer.observe(wordCount, { childList: true, characterData: true, subtree: true });
    }
  }

  function wireSentenceFocus() {
    const englishText = qs(selectors.englishText);
    if (!englishText) {
      return;
    }

    let wrapping = false;
    const wrap = () => {
      if (wrapping) {
        return;
      }

      const raw = englishText.textContent.trim();
      if (!raw) {
        return;
      }

      wrapping = true;
      const sentences = raw.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [raw];
      englishText.innerHTML = sentences.map((sentence) => {
        const clean = escapeHtml(sentence.trim());
        return clean ? `<span class="sentence-chip" tabindex="0">${clean}</span> ` : "";
      }).join("").trim();
      wrapping = false;
    };

    englishText.addEventListener("mouseover", markSentence);
    englishText.addEventListener("focusin", markSentence);
    englishText.addEventListener("mouseout", clearSentence);
    englishText.addEventListener("focusout", clearSentence);

    const observer = new MutationObserver(() => {
      if (!wrapping) {
        window.requestAnimationFrame(wrap);
      }
    });
    observer.observe(englishText, { childList: true, characterData: true, subtree: true });
    wrap();
  }

  function markSentence(event) {
    const chip = event.target.closest?.(".sentence-chip");
    if (!chip) {
      return;
    }
    qsa(".sentence-chip.is-current").forEach((item) => item.classList.remove("is-current"));
    chip.classList.add("is-current");
  }

  function clearSentence() {
    qsa(".sentence-chip.is-current").forEach((item) => item.classList.remove("is-current"));
  }

  function wireButtonFeedback() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }
      button.classList.remove("is-tapped");
      void button.offsetWidth;
      button.classList.add("is-tapped");
      window.setTimeout(() => button.classList.remove("is-tapped"), 460);
    });
  }

  function wireSelectGlow() {
    const toolbar = qs(selectors.toolbar);
    if (!toolbar) {
      return;
    }

    toolbar.addEventListener("focusin", () => toolbar.classList.add("is-active"));
    toolbar.addEventListener("focusout", () => toolbar.classList.remove("is-active"));

    [selectors.diseaseFilter, selectors.articleSelect, selectors.searchInput].forEach((selector) => {
      const control = qs(selector);
      control?.addEventListener("change", () => flash(toolbar));
      control?.addEventListener("input", () => flash(toolbar));
    });
  }

  function wireKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        qs(selectors.saveBtn)?.click();
        flash(qs(selectors.savedStatus));
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        qs(selectors.submitBtn)?.click();
      }

      if (event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        qs(selectors.randomBtn)?.click();
      }
    });
  }

  function wireFeedbackObserver(ui) {
    const feedback = qs(selectors.feedback);
    if (!feedback) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (feedback.classList.contains("visible")) {
        window.setTimeout(() => flash(feedback), 40);
      }
      updateNavVisibility(ui.nav);
    });
    observer.observe(feedback, { attributes: true, attributeFilter: ["class"] });
    updateNavVisibility(ui.nav);
  }

  function polishInitialState(ui) {
    updateNavVisibility(ui.nav);
    wireTitlePulse();
    qsa("button").forEach((button) => {
      if (!button.title && button.textContent.trim()) {
        button.title = button.textContent.trim();
      }
    });
  }

  function wireTitlePulse() {
    const articleTitle = qs(selectors.articleTitle);
    if (!articleTitle) {
      return;
    }
    const observer = new MutationObserver(() => flash(articleTitle));
    observer.observe(articleTitle, { childList: true, characterData: true, subtree: true });
  }

  function updateNavVisibility(nav) {
    if (!nav) {
      return;
    }
    const feedbackVisible = qs(selectors.feedback)?.classList.contains("visible");
    nav.style.opacity = feedbackVisible || window.scrollY > 120 ? "1" : "0.88";
  }

  function flash(element) {
    if (!element) {
      return;
    }
    element.classList.remove("is-gently-lit");
    void element.offsetWidth;
    element.classList.add("is-gently-lit");
    window.setTimeout(() => element.classList.remove("is-gently-lit"), 850);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
