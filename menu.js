/* =========================================================
   Question MART & CAFE — menu.js
   Dynamically renders the menu images for the saved language,
   handles the loader, and lets the user switch language in place.
   ========================================================= */

(function () {
  "use strict";

  // ---- Configuration: where each language's images live ----
  // Add/remove entries here if the number of pages ever changes.
  const MENU_CONFIG = {
    en: {
      dir: "images/en/",
      count: 5,
      fileName: (n) => `EN.MENU.${n}.png`,
      dir_attr: "ltr",
      switchToLabel: "🇪🇬 العربية", // shown while viewing English
    },
    ar: {
      dir: "images/ar/",
      count: 5,
      fileName: (n) => `Menu-Page-${n}.jpeg`,
      dir_attr: "rtl",
      switchToLabel: "🇺🇸 English", // shown while viewing Arabic
    },
  };

  const STORAGE_KEY = "menuLang";
  const MIN_LOADER_MS = 500; // avoids a jarring flash if images load instantly
  const LOADER_TIMEOUT_MS = 4000; // safety net if an image never loads

  const loaderEl = document.getElementById("loader");
  const containerEl = document.getElementById("menuContainer");
  const switchBtn = document.getElementById("langSwitch");

  /**
   * Builds the <img> elements for a given language and waits for
   * them all to finish loading (or decoding) before resolving.
   */
  function buildImages(lang) {
    const config = MENU_CONFIG[lang];
    const loadPromises = [];

    containerEl.innerHTML = ""; // clear any previous language's images

    for (let i = 1; i <= config.count; i++) {
      const img = document.createElement("img");
      img.src = config.dir + config.fileName(i);
      img.alt = `Menu page ${i}`;
      img.className = "menu-page-img";
      img.loading = i === 1 ? "eager" : "lazy"; // first page shows immediately, rest lazy
      containerEl.appendChild(img);

      // Wait for each image to load (or fail) so the loader reflects reality
      loadPromises.push(
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true }); // don't hang forever on a broken file
          }
        })
      );
    }

    return Promise.all(loadPromises);
  }

  /**
   * Applies the language: sets dir/lang attributes for correct
   * text direction, updates the switch button, and renders images.
   */
  function applyLanguage(lang, options) {
    const config = MENU_CONFIG[lang];
    const showLoader = options && options.showLoader;

    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", config.dir_attr);
    switchBtn.textContent = config.switchToLabel;
    switchBtn.dataset.current = lang;

    if (showLoader) {
      loaderEl.style.display = "flex";
      loaderEl.style.opacity = "1";
      containerEl.classList.remove("is-visible");
    }

    const start = Date.now();

    buildImages(lang).then(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(MIN_LOADER_MS - elapsed, 0);

      setTimeout(() => {
        hideLoader();
        containerEl.classList.add("is-visible");
      }, remaining);
    });
  }

  function hideLoader() {
    loaderEl.style.opacity = "0";
    setTimeout(() => {
      loaderEl.style.display = "none";
    }, 400);
  }

  /**
   * Switches language on demand: saves the new choice and
   * re-renders the images in place (no full page reload).
   */
  function switchLanguage() {
    const current = switchBtn.dataset.current;
    const next = current === "en" ? "ar" : "en";
    localStorage.setItem(STORAGE_KEY, next);

    containerEl.classList.remove("is-visible");
    setTimeout(() => applyLanguage(next, { showLoader: false }), 200);
  }

  // ---- Init ----
  function init() {
    const savedLang = localStorage.getItem(STORAGE_KEY);

    // No language chosen yet (e.g. someone bookmarked menu.html directly)
    // — send them to the language screen instead of guessing.
    if (savedLang !== "en" && savedLang !== "ar") {
      window.location.href = "index.html";
      return;
    }

    applyLanguage(savedLang, { showLoader: true });

    // Safety net: never let the loader get stuck forever
    setTimeout(hideLoader, LOADER_TIMEOUT_MS);
  }

  switchBtn.addEventListener("click", switchLanguage);
  document.addEventListener("DOMContentLoaded", init);
})();