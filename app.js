/*
 * Yara — site logic.
 *
 * You shouldn't need to edit this file for everyday changes:
 *   words ........ i18n.js
 *   recipes ...... data/recipes.js
 *   prices ....... data/prices.csv
 *   settings ..... config.js
 */
(function () {
  "use strict";

  const config = window.YARA_CONFIG || {};
  const TEXT = window.YARA_I18N || {};
  const RECIPES = Array.isArray(window.YARA_RECIPES) ? window.YARA_RECIPES : [];
  const WEEK = Array.isArray(window.YARA_WEEK) ? window.YARA_WEEK : [];
  const PRICES_BACKUP_URL = "data/prices.csv";
  const LANG_KEY = "yara-lang";
  const STALE_DAYS = Number(config.staleAfterDays) > 0 ? Number(config.staleAfterDays) : 60;
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Store names people might type in the price sheet, in either language.
  const STORE_ALIASES = {
    panda: "panda", "بنده": "panda", "باندا": "panda", "هايبر بنده": "panda",
    lulu: "lulu", "لولو": "lulu",
    carrefour: "carrefour", "كارفور": "carrefour",
    tamimi: "tamimi", "tamimi markets": "tamimi", "التميمي": "tamimi", "تميمي": "tamimi",
    othaim: "othaim", "al othaim": "othaim", "العثيم": "othaim",
    danube: "danube", "الدانوب": "danube",
    nesto: "nesto", "نستو": "nesto",
    farm: "farm", "farm superstores": "farm", "المزرعة": "farm", "أسواق المزرعة": "farm"
  };

  // unit typed in the sheet -> [base unit, multiplier to base, unit shown on the site]
  const UNITS = {
    g: ["g", 1, "g"], gm: ["g", 1, "g"], gr: ["g", 1, "g"], gram: ["g", 1, "g"], grams: ["g", 1, "g"],
    "جم": ["g", 1, "g"], "غ": ["g", 1, "g"], "جرام": ["g", 1, "g"], "غرام": ["g", 1, "g"],
    kg: ["g", 1000, "kg"], "كجم": ["g", 1000, "kg"], "كغ": ["g", 1000, "kg"], "كيلو": ["g", 1000, "kg"],
    ml: ["ml", 1, "ml"], "مل": ["ml", 1, "ml"],
    l: ["ml", 1000, "L"], ltr: ["ml", 1000, "L"], litre: ["ml", 1000, "L"], liter: ["ml", 1000, "L"], "لتر": ["ml", 1000, "L"],
    pcs: ["pcs", 1, "pcs"], pc: ["pcs", 1, "pcs"], piece: ["pcs", 1, "pcs"], pieces: ["pcs", 1, "pcs"], "حبة": ["pcs", 1, "pcs"]
  };

  const state = {
    lang: "en",
    products: [],
    priceStatus: "loading", // loading | ready | error
    selected: new Set(),
    meal: "all",
    sort: "value",
    search: "",
    openRecipe: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ---------- Text and translation ---------- */

  function lookup(lang, key) {
    return key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), TEXT[lang]);
  }

  const pluralRules = {};
  function pickPlural(forms, count) {
    const rules = pluralRules[state.lang] || (pluralRules[state.lang] = new Intl.PluralRules(state.lang));
    return forms[rules.select(count)] ?? forms.other;
  }

  function t(key, vars) {
    let value = lookup(state.lang, key);
    if (value === undefined) value = lookup("en", key);
    if (value === undefined) {
      console.warn(`[Yara] Missing text for "${key}" in i18n.js`);
      return key;
    }
    if (value && typeof value === "object" && vars && typeof vars.count === "number") {
      value = pickPlural(value, vars.count);
    }
    if (typeof value !== "string") return value;
    return vars ? value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match)) : value;
  }

  // Data fields can be a plain string or { en: "...", ar: "..." }.
  function loc(field) {
    if (field == null) return "";
    if (typeof field === "string") return field;
    return field[state.lang] || field.en || field.ar || "";
  }

  function locList(field) {
    if (Array.isArray(field)) return field;
    if (!field) return [];
    return field[state.lang] || field.en || field.ar || [];
  }

  /* ---------- Numbers, money and dates ---------- */

  const numberLocale = () => (state.lang === "ar" ? "ar-SA-u-nu-latn" : "en-US");

  function formatNumber(value, minDigits = 0, maxDigits = minDigits) {
    return new Intl.NumberFormat(numberLocale(), {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits
    }).format(value);
  }

  function formatSar(value) {
    return t("currency", { amount: formatNumber(value, 2, 2) });
  }

  function formatMonth(date) {
    const locale = state.lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB";
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  }

  function formatSize(row) {
    if (row.size == null || !row.unitKey) return "";
    return t("sizeFormat", { size: formatNumber(row.size, 0, 2), unit: t(`units.${row.unitKey}`) });
  }

  function formatPerUnit(row) {
    if (!row.baseAmount || row.base === "pcs") return "";
    return t("basket.perUnit", {
      price: formatSar((row.price / row.baseAmount) * 1000),
      unit: t(row.base === "ml" ? "units.L" : "units.kg")
    });
  }

  function formatMeals(recipe) {
    const names = (recipe.meal || []).map((meal) => t(`recipes.mealNames.${meal}`));
    try {
      return new Intl.ListFormat(state.lang, { style: "long", type: "disjunction" }).format(names);
    } catch (error) {
      return names.join(" / ");
    }
  }

  function formatList(items) {
    try {
      return new Intl.ListFormat(state.lang, { style: "long", type: "conjunction" }).format(items);
    } catch (error) {
      return items.join(", ");
    }
  }

  // Turns Arabic-Indic digits (٠-٩ and ۰-۹) and the Arabic decimal mark into plain digits.
  function normalizeDigits(value) {
    return String(value ?? "")
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/\u066B/g, ".")
      .replace(/\u066C/g, "");
  }

  // Accepts 6.75, "6,75", Arabic-Indic digits (٦٫٧٥) and stray text like "SAR 6.75".
  function toNumber(value) {
    if (value == null) return null;
    let text = normalizeDigits(value)
      .trim()
      .replace(/[^\d.,-]/g, "");
    if (!text) return null;
    text = text.includes(",") && !text.includes(".") ? text.replace(",", ".") : text.replace(/,/g, "");
    const number = parseFloat(text);
    return Number.isFinite(number) ? number : null;
  }

  function makeDate(year, month, day) {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return new Date(Date.UTC(year, month - 1, day));
  }

  // Best format: 2026-09-20 (or 2026-09 for a month). Also reads 2026/9/20 and 20/9/2026 (day first).
  function parseCheckedDate(value) {
    const text = normalizeDigits(value).trim();
    let match = text.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?/);
    if (match) return makeDate(Number(match[1]), Number(match[2]), match[3] ? Number(match[3]) : 1);
    match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (match) {
      let day = Number(match[1]);
      let month = Number(match[2]);
      if (month > 12 && day <= 12) [day, month] = [month, day];
      return makeDate(Number(match[3]), month, day);
    }
    return null;
  }

  const isStale = (date) => Boolean(date) && Date.now() - date.getTime() > STALE_DAYS * DAY_MS;

  const sameMonth = (a, b) => a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();

  /* ---------- Stores ---------- */

  function storeKey(raw) {
    return STORE_ALIASES[String(raw || "").trim().toLowerCase()] || null;
  }

  function storeName(raw) {
    const key = storeKey(raw);
    return key ? t(`stores.${key}`) : String(raw || "").trim();
  }

  /* ---------- Price sheet (data/prices.csv) ---------- */

  function parseCsv(text, delimiter) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === delimiter) {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
    if (field !== "" || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
  }

  function csvToObjects(rawText) {
    const text = rawText.replace(/^\uFEFF/, "");
    const firstLine = text.split(/\r?\n/, 1)[0] || "";
    // Excel in some regions saves CSV with semicolons instead of commas.
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
    const rows = parseCsv(text, delimiter);
    if (!rows.length) return [];
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    return rows.slice(1).map((cells, index) => {
      const record = { _line: index + 2 };
      headers.forEach((header, i) => {
        record[header] = (cells[i] ?? "").trim();
      });
      return record;
    });
  }

  function normalizeRow(raw) {
    const price = toNumber(raw.price_sar);
    const size = toNumber(raw.size);
    const unit = UNITS[String(raw.unit || "").trim().toLowerCase()] || null;
    const protein = toNumber(raw.protein_per_100);
    const baseAmount = size != null && unit ? size * unit[1] : null;
    const canRank = price > 0 && baseAmount > 0 && protein != null && unit && unit[0] !== "pcs";
    return {
      line: raw._line,
      id: (raw.id || "").trim(),
      name: { en: raw.name_en || "", ar: raw.name_ar || "" },
      store: raw.store || "",
      category: String(raw.category || "").trim().toLowerCase(),
      brand: raw.brand || "",
      size,
      rawUnit: raw.unit || "",
      unitKey: unit ? unit[2] : "",
      price,
      protein,
      proteinPerSar: canRank ? (baseAmount * protein) / 100 / price : null,
      base: unit ? unit[0] : "",
      baseAmount: baseAmount > 0 ? baseAmount : null,
      checked: parseCheckedDate(raw.checked),
      checkedRaw: raw.checked || "",
      url: /^https?:\/\//i.test(raw.url || "") ? raw.url.trim() : "",
      outOfStock: String(raw.availability || "").toLowerCase() === "out_of_stock"
    };
  }

  function groupProducts(rows) {
    const groups = new Map();
    const problems = [];
    rows.forEach((row) => {
      const key = row.id || (row.name.en || row.name.ar).trim().toLowerCase().replace(/\s+/g, "-");
      if (!key) {
        problems.push(`line ${row.line}: add an id or a name`);
        return;
      }
      if (!(row.price > 0)) {
        problems.push(`line ${row.line} (${key}): price_sar is missing or not a number`);
        return;
      }
      if (row.checkedRaw && !row.checked) problems.push(`line ${row.line} (${key}): date "${row.checkedRaw}" isn't readable (use 2026-09-20)`);
      if (row.size != null && !row.unitKey) problems.push(`line ${row.line} (${key}): unit "${row.rawUnit}" isn't recognised (use g, kg, ml, L or pcs)`);
      if (!groups.has(key)) groups.set(key, { id: key, name: { en: "", ar: "" }, rows: [] });
      const group = groups.get(key);
      if (!group.name.en && row.name.en) group.name.en = row.name.en;
      if (!group.name.ar && row.name.ar) group.name.ar = row.name.ar;
      group.rows.push(row);
    });

    const products = [...groups.values()].map((group) => {
      const inStock = group.rows.filter((row) => !row.outOfStock);
      const pool = inStock.length ? inStock : group.rows;
      const comparable = pool.every((row) => row.baseAmount && row.base !== "pcs" && row.base === pool[0].base);
      const cost = (row) => (comparable ? row.price / row.baseAmount : row.price);
      const cheapest = pool.reduce((best, row) => (cost(row) < cost(best) ? row : best));
      const rankable = pool.filter((row) => row.proteinPerSar != null);
      const bestValue = rankable.length
        ? rankable.reduce((best, row) => (row.proteinPerSar > best.proteinPerSar ? row : best))
        : null;
      const category = (group.rows.find((row) => row.category) || {}).category || "other";
      return { ...group, category, cheapest, bestValue };
    });
    return { products, problems };
  }

  async function fetchText(url, timeoutMs) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetch(url, { cache: "no-cache", signal: controller ? controller.signal : undefined });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // Tries the live Google Sheet first, then the copy saved in the repository.
  async function loadPrices() {
    state.priceStatus = "loading";
    const sheetUrl = String(config.pricesSheetUrl || "").trim();
    const sources = [];
    if (/^https:\/\//.test(sheetUrl)) sources.push({ url: sheetUrl, label: "the live Google Sheet", timeout: 6000 });
    sources.push({ url: PRICES_BACKUP_URL, label: PRICES_BACKUP_URL, timeout: 10000 });

    for (const source of sources) {
      try {
        const text = await fetchText(source.url, source.timeout);
        const header = (text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] || "").toLowerCase();
        if (!header.includes("price_sar")) throw new Error("the first row doesn't have the expected column names (price_sar is missing)");
        const { products, problems } = groupProducts(csvToObjects(text).map(normalizeRow));
        state.products = products;
        state.priceStatus = "ready";
        const ranked = products.filter((product) => product.bestValue).length;
        console.info(
          `[Yara] Loaded ${products.length} products from ${source.label}. ` +
            `${ranked} have size, unit and protein_per_100, so they appear in the protein ranking.`
        );
        if (problems.length) console.warn(`[Yara] Check these rows in the price sheet:\n${problems.join("\n")}`);
        break;
      } catch (error) {
        const reason = error && error.name === "AbortError" ? "it took too long to answer" : error;
        console.warn(`[Yara] Couldn't load prices from ${source.label}:`, reason);
      }
    }

    if (state.priceStatus !== "ready") {
      state.priceStatus = "error";
      console.warn(
        "[Yara] No price list could be loaded. If you opened index.html straight from your computer, " +
          "preview it through a local server instead (see README)."
      );
    }
    renderStats();
    renderRanking();
    renderBasket();
    renderRecipes();
    renderWeek();
    if (state.openRecipe) {
      const recipe = RECIPES.find((item) => item.id === state.openRecipe);
      if (recipe) renderRecipeModal(recipe);
    }
  }

  /* ---------- Static text ---------- */

  function applyStaticText() {
    $$("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    $$("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((part) => part.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });

    document.title = t("meta.title");
    const description = $('meta[name="description"]');
    if (description) description.setAttribute("content", t("meta.description"));

    const other = state.lang === "ar" ? "en" : "ar";
    const languageButton = $("#languageButton");
    languageButton.textContent = TEXT[other].languageName;
    languageButton.lang = other;
    languageButton.setAttribute("aria-label", t("switchLanguage"));

    const credits = loc(config.credits);
    $$("[data-credits]").forEach((el) => {
      el.textContent = credits;
    });

    const area = loc(config.priceArea);
    $$("[data-price-area]").forEach((el) => {
      el.textContent = area ? t("protein.area", { area }) : "";
    });

    const reportUrl = String(config.priceReportUrl || "").trim();
    $$("[data-report-price]").forEach((link) => {
      link.hidden = !/^https:\/\//.test(reportUrl);
      if (!link.hidden) link.href = reportUrl;
    });

    const githubLink = $("#githubLink");
    const githubUrl = String(config.githubUrl || "").trim();
    githubLink.hidden = !/^https:\/\//.test(githubUrl);
    if (!githubLink.hidden) githubLink.href = githubUrl;
  }

  /* ---------- Stats ---------- */

  function renderStats() {
    const stores = new Set();
    let latest = null;
    state.products.forEach((product) =>
      product.rows.forEach((row) => {
        if (row.store) stores.add(storeKey(row.store) || row.store.trim().toLowerCase());
        if (row.checked && (!latest || row.checked > latest)) latest = row.checked;
      })
    );

    const stats = [];
    if (state.products.length) stats.push({ value: formatNumber(state.products.length), label: t("stats.products") });
    if (stores.size) stats.push({ value: formatNumber(stores.size), label: t("stats.stores") });
    if (RECIPES.length) stats.push({ value: formatNumber(RECIPES.length), label: t("stats.recipes") });
    if (latest) stats.push({ value: formatMonth(latest), label: t("stats.checked"), isDate: true });

    $("#statsList").innerHTML = stats
      .map((stat) => `<div class="stat${stat.isDate ? " stat-date" : ""}"><dt>${esc(stat.label)}</dt><dd>${esc(stat.value)}</dd></div>`)
      .join("");
    $("#stats").hidden = !stats.length;
  }

  /* ---------- Protein per riyal ---------- */

  function metaItem(item) {
    if (item.href) {
      return `<a class="store-link" href="${esc(item.href)}" target="_blank" rel="noopener">${esc(item.text)}` +
        `<span class="sr-only"> (${esc(t("common.newTab"))})</span></a>`;
    }
    return `<span${item.stale ? ' class="is-stale"' : ""}>${esc(item.text)}</span>`;
  }

  function renderRanking() {
    const box = $("#proteinRanking");
    if (state.priceStatus !== "ready") {
      const key = state.priceStatus === "loading" ? "common.loading" : "protein.error";
      box.innerHTML = `<p class="ranking-empty">${esc(t(key))}</p>`;
      return;
    }

    const ranked = state.products
      .filter((product) => product.bestValue)
      .sort((a, b) => b.bestValue.proteinPerSar - a.bestValue.proteinPerSar)
      .slice(0, 10);

    if (!ranked.length) {
      box.innerHTML = `<p class="ranking-empty">${esc(t("protein.empty"))}</p>`;
      return;
    }

    const top = ranked[0].bestValue.proteinPerSar;
    box.innerHTML = `<ol class="ranking">${ranked
      .map((product, index) => {
        const row = product.bestValue;
        const width = Math.max(4, (row.proteinPerSar / top) * 100).toFixed(1);
        const stale = isStale(row.checked);
        const meta = [
          row.store ? { text: t("protein.bestAt", { store: storeName(row.store) }), href: row.url } : null,
          row.outOfStock ? { text: t("protein.outOfStock"), stale: true } : null,
          { text: t("protein.pack", { size: formatSize(row), price: formatSar(row.price) }) },
          row.checked
            ? { text: t(stale ? "protein.checkedStale" : "protein.checked", { date: formatMonth(row.checked) }), stale }
            : null
        ].filter(Boolean);
        return `
          <li class="rank-row${index === 0 ? " is-top" : ""}">
            <span class="rank-num" aria-hidden="true">${formatNumber(index + 1)}</span>
            <div class="rank-main">
              <p class="rank-name">${esc(loc(product.name))}${row.brand ? `<span class="rank-brand">${esc(row.brand)}</span>` : ""}</p>
              <div class="rank-bar" aria-hidden="true"><span style="width: ${width}%"></span></div>
              <p class="rank-meta">${meta.map(metaItem).join("")}</p>
            </div>
            <p class="rank-value"><strong>${esc(formatNumber(row.proteinPerSar, 1, 1))}</strong><span>${esc(t("protein.unit"))}</span></p>
          </li>`;
      })
      .join("")}</ol>`;
  }

  /* ---------- Recipes ---------- */

  // Makes Arabic search forgiving: ignores diacritics and treats أ إ آ ا, ى ي and ة ه as the same letter.
  function searchable(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه");
  }

  /* ---------- Recipe numbers: protein and cost per serving ---------- */

  function productById(id) {
    return state.products.find((product) => product.id === id) || null;
  }

  // Cost of one serving at today's best price per kg (or per bunch). null until prices load.
  function recipeCost(recipe) {
    if (state.priceStatus !== "ready" || !Array.isArray(recipe.uses)) return null;
    let total = 0;
    let counted = 0;
    recipe.uses.forEach((use) => {
      const product = productById(use.id);
      if (!product) return;
      const row = product.cheapest;
      if (row.base === "pcs" || !row.baseAmount) {
        const perPiece = row.price / (row.size || 1);
        if (use.count != null) {
          total += use.count * perPiece;
          counted += 1;
        }
        return;
      }
      total += (use.grams / row.baseAmount) * row.price;
      counted += 1;
    });
    if (!counted) return null;
    return total / (recipe.servings || 1);
  }

  function proteinPerRiyal(recipe) {
    const cost = recipeCost(recipe);
    return cost ? recipe.protein / cost : null;
  }

  function latestCheckDate() {
    let latest = null;
    state.products.forEach((product) => {
      const date = product.cheapest.checked;
      if (date && (!latest || date > latest)) latest = date;
    });
    return latest;
  }

  function mealMatches(recipe) {
    const meals = recipe.meal || [];
    if (state.meal === "all") return true;
    if (state.meal === "main") return meals.includes("lunch") || meals.includes("dinner");
    return meals.includes(state.meal);
  }

  function recipeMatches(recipe, query) {
    if (!query) return true;
    const haystack = ["en", "ar"]
      .flatMap((lang) => [
        recipe.name && recipe.name[lang],
        recipe.description && recipe.description[lang],
        ...((recipe.ingredients && recipe.ingredients[lang]) || [])
      ])
      .join(" ");
    return searchable(haystack).includes(query);
  }

  function recipeMeta(recipe) {
    const minutes = t("recipes.minutes", { count: recipe.time });
    return {
      minutes: recipe.timeNote ? `${minutes} ${loc(recipe.timeNote)}` : minutes,
      serves: t("recipes.serves", { count: recipe.servings })
    };
  }

  function proteinText(recipe) {
    const value = formatNumber(recipe.protein, 0, 1);
    return t(recipe.proteinSource === "usda" ? "recipes.proteinChip" : "recipes.proteinChipEstimate", { value });
  }

  function sortRecipes(list) {
    const key = {
      value: (recipe) => -(proteinPerRiyal(recipe) ?? recipe.protein / 100),
      protein: (recipe) => -recipe.protein,
      cost: (recipe) => recipeCost(recipe) ?? Infinity,
      time: (recipe) => recipe.time
    }[state.sort] || ((recipe) => 0);
    return [...list].sort((a, b) => key(a) - key(b) || RECIPES.indexOf(a) - RECIPES.indexOf(b));
  }

  function renderRecipes() {
    const grid = $("#recipeGrid");
    const query = searchable(state.search.trim());
    const visible = sortRecipes(RECIPES.filter((recipe) => recipeMatches(recipe, query) && mealMatches(recipe)));

    if (!visible.length) {
      grid.innerHTML = `<p class="empty-state">${esc(t("recipes.empty"))}</p>`;
      return;
    }

    grid.innerHTML = visible
      .map((recipe) => {
        const index = RECIPES.indexOf(recipe);
        const meta = recipeMeta(recipe);
        const name = loc(recipe.name);
        const cost = recipeCost(recipe);
        const meals = formatMeals(recipe);
        return `
          <article class="recipe-card">
            <div class="recipe-card-art art-${(index % 4) + 1}" aria-hidden="true">
              <span class="recipe-hero-word">${esc(loc(recipe.hero))}</span>
              ${recipe.source ? `<span class="recipe-badge">${esc(t("recipes.usdaBadge"))}</span>` : ""}
            </div>
            <div class="recipe-card-body">
              <p class="recipe-meta"><span class="recipe-meal">${esc(meals)}</span><span>${esc(meta.minutes)}</span><span>${esc(meta.serves)}</span></p>
              <h3>${esc(name)}</h3>
              <p>${esc(loc(recipe.description))}</p>
              <p class="recipe-numbers">
                <span class="chip chip-protein">${esc(proteinText(recipe))}</span>
                ${cost != null ? `<span class="chip chip-cost">${esc(t("recipes.costChip", { price: formatSar(cost) }))}</span>` : ""}
              </p>
              <button class="text-button" type="button" data-recipe="${esc(recipe.id)}" aria-label="${esc(t("recipes.viewFor", { name }))}">${esc(t("recipes.view"))}</button>
            </div>
          </article>`;
      })
      .join("");
  }

  function renderRecipeModal(recipe) {
    const meta = recipeMeta(recipe);
    const cost = recipeCost(recipe);
    const checked = latestCheckDate();
    const numbers = [
      `<div><strong>${esc(formatNumber(recipe.protein, 0, 1))}</strong><span>${esc(t("recipes.proteinChip", { value: "" }).trim())}</span></div>`,
      recipe.calories ? `<div><strong>${esc(formatNumber(recipe.calories))}</strong><span>${esc(t("recipes.calories", { value: "" }).trim())}</span></div>` : "",
      cost != null ? `<div><strong>${esc(formatSar(cost))}</strong><span>${esc(t("recipes.perServing"))}</span></div>` : ""
    ].join("");
    const proteinNote = [
      t(recipe.proteinSource === "usda" ? "recipes.proteinUsda" : "recipes.proteinEstimate"),
      recipe.nutritionNote === "filling" ? t("recipes.proteinFilling") : ""
    ].filter(Boolean).join(" ");
    const costNote = cost != null && checked ? t("recipes.costNote", { date: formatMonth(checked) }) : t("recipes.costUnavailable");
    const source = recipe.source
      ? `<div class="recipe-source">
           <h3>${esc(t("recipes.sourceTitle"))}</h3>
           <p>${esc(loc(recipe.source.credit))}</p>
           <a class="text-link" href="${esc(recipe.source.url)}" target="_blank" rel="noopener">${esc(t("recipes.sourceLink"))}: ${esc(recipe.source.title)}<span class="sr-only"> (${esc(t("common.newTab"))})</span></a>
         </div>`
      : `<p class="recipe-origin">${esc(t("recipes.yaraOriginal"))}</p>`;
    $("#recipeModalContent").innerHTML = `
      <p class="modal-meta"><span>${esc(formatMeals(recipe))}</span><span>${esc(meta.minutes)}</span><span>${esc(meta.serves)}</span></p>
      <h2 id="recipeModalTitle">${esc(loc(recipe.name))}</h2>
      <p class="modal-intro">${esc(loc(recipe.description))}</p>
      <div class="nutrition-strip" aria-label="${esc(t("recipes.perServing"))}">${numbers}</div>
      <p class="modal-fineprint">${esc(proteinNote)} ${esc(costNote)}</p>
      <div class="recipe-detail-grid">
        <div>
          <h3>${esc(t("recipes.ingredients"))}</h3>
          <ul>${locList(recipe.ingredients).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
        </div>
        <div>
          <h3>${esc(t("recipes.method"))}</h3>
          <ol>${locList(recipe.steps).map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
        </div>
      </div>
      ${recipe.swaps ? `<div class="recipe-swaps"><h3>${esc(t("recipes.swapsTitle"))}</h3><p>${esc(loc(recipe.swaps))}</p></div>` : ""}
      ${source}`;
  }

  function showRecipe(id) {
    const recipe = RECIPES.find((item) => item.id === id);
    if (!recipe) return;
    state.openRecipe = id;
    renderRecipeModal(recipe);
    const dialog = $("#recipeModal");
    if (!dialog.open) dialog.showModal();
  }

  /* ---------- A week with Yara ---------- */

  function renderWeek() {
    const grid = $("#weekGrid");
    const summary = $("#weekSummary");
    if (!grid || !WEEK.length) return;
    const byId = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));
    const days = WEEK.map((day) => {
      const meals = day.meals.map((meal) => ({ ...meal, recipe: byId.get(meal.recipe) })).filter((meal) => meal.recipe);
      const protein = meals.reduce((sum, meal) => sum + meal.recipe.protein, 0);
      const costs = meals.map((meal) => recipeCost(meal.recipe));
      const cost = costs.every((value) => value != null) ? costs.reduce((sum, value) => sum + value, 0) : null;
      return { day: day.day, meals, protein, cost };
    });

    const proteins = days.map((day) => day.protein);
    const avgProtein = proteins.reduce((a, b) => a + b, 0) / days.length;
    const costsKnown = days.every((day) => day.cost != null);
    const weekCost = costsKnown ? days.reduce((sum, day) => sum + day.cost, 0) : null;
    summary.innerHTML = [
      `<div class="week-stat"><dt>${esc(t("week.avgProtein"))}</dt><dd>${esc(formatNumber(avgProtein, 0, 0))} ${esc(t("units.g"))}</dd>
         <p>${esc(t("week.range", { min: formatNumber(Math.min(...proteins), 0, 0), max: formatNumber(Math.max(...proteins), 0, 0) }))}</p></div>`,
      weekCost != null ? `<div class="week-stat"><dt>${esc(t("week.avgCost"))}</dt><dd>${esc(formatSar(weekCost / days.length))}</dd></div>` : "",
      weekCost != null ? `<div class="week-stat"><dt>${esc(t("week.total"))}</dt><dd>${esc(formatSar(weekCost))}</dd></div>` : ""
    ].join("");

    grid.innerHTML = days
      .map((day) => `
        <li class="day-card">
          <div class="day-head">
            <h3>${esc(t("week.day", { n: formatNumber(day.day) }))}</h3>
            <p><span>${esc(t("week.dayProtein", { value: formatNumber(day.protein, 0, 0) }))}</span>${
              day.cost != null ? `<span>${esc(t("week.dayCost", { price: formatSar(day.cost) }))}</span>` : ""
            }</p>
          </div>
          <ul class="day-meals">
            ${day.meals
              .map((meal) => `
                <li>
                  <span class="day-slot">${esc(t(`recipes.mealNames.${meal.slot}`))}</span>
                  <button class="day-recipe" type="button" data-recipe="${esc(meal.recipe.id)}">${esc(loc(meal.recipe.name))}</button>
                  ${meal.leftover ? `<span class="day-leftover">${esc(t("week.leftover"))}</span>` : ""}
                </li>`)
              .join("")}
          </ul>
        </li>`)
      .join("");
  }

  function renderPrintGuide() {
    const site = String(config.siteUrl || "").trim();
    $("#printGuide").innerHTML = `
      <div class="print-head">
        <img src="assets/logo.svg" alt="" width="44" height="44" />
        <h1>${esc(t("print.title"))}</h1>
      </div>
      ${RECIPES.map((recipe) => {
        const meta = recipeMeta(recipe);
        return `
          <article class="print-recipe">
            <h2>${esc(loc(recipe.name))}</h2>
            <p class="print-meta">${esc(meta.minutes)} · ${esc(meta.serves)} · ${esc(proteinText(recipe))}</p>
            <p>${esc(loc(recipe.description))}</p>
            <div class="print-cols">
              <div><h3>${esc(t("recipes.ingredients"))}</h3><ul>${locList(recipe.ingredients).map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
              <div><h3>${esc(t("recipes.method"))}</h3><ol>${locList(recipe.steps).map((step) => `<li>${esc(step)}</li>`).join("")}</ol></div>
            </div>
          </article>`;
      }).join("")}
      ${site ? `<p class="print-foot">${esc(t("print.from", { site }))}</p>` : ""}`;
  }

  /* ---------- Basket ---------- */

  function renderBasket() {
    const list = $("#basketList");
    const checkedNote = $("#basketChecked");

    if (state.priceStatus !== "ready" || !state.products.length) {
      const key = state.priceStatus === "loading" ? "common.loading" : state.priceStatus === "error" ? "basket.error" : "basket.empty";
      list.innerHTML = `<p class="basket-message">${esc(t(key))}</p>`;
      checkedNote.textContent = "";
      updateBasketTotals();
      return;
    }

    const order = ["legumes", "grains", "soy", "nuts_seeds", "dairy_free", "bread", "produce", "other"];
    const rank = (product) => (order.includes(product.category) ? order.indexOf(product.category) : order.length);
    const products = [...state.products].sort(
      (a, b) => rank(a) - rank(b) || loc(a.name).localeCompare(loc(b.name), state.lang)
    );
    let lastCategory = null;
    list.innerHTML = products
      .map((product) => {
        const row = product.cheapest;
        const category = order.includes(product.category) ? product.category : "other";
        const heading = category !== lastCategory ? `<p class="basket-group">${esc(t(`categories.${category}`))}</p>` : "";
        lastCategory = category;
        const details = [
          formatSize(row) ? { text: formatSize(row) } : null,
          formatPerUnit(row) ? { text: formatPerUnit(row) } : null,
          row.store ? { text: t("basket.lowestAt", { store: storeName(row.store) }) } : null,
          isStale(row.checked) ? { text: t("basket.stale", { date: formatMonth(row.checked) }), stale: true } : null,
          row.outOfStock ? { text: t("protein.outOfStock"), stale: true } : null
        ].filter(Boolean);
        return `${heading}
          <label class="basket-row">
            <input type="checkbox" value="${esc(product.id)}"${state.selected.has(product.id) ? " checked" : ""} />
            <span class="basket-check" aria-hidden="true"></span>
            <span class="basket-info">
              <strong>${esc(loc(product.name))}</strong>
              ${details.length ? `<small>${details.map((item) => `<span${item.stale ? ' class="is-stale"' : ""}>${esc(item.text)}</span>`).join("")}</small>` : ""}
            </span>
            <span class="basket-price">${esc(formatSar(row.price))}</span>
          </label>`;
      })
      .join("");

    const dates = state.products.map((product) => product.cheapest.checked).filter(Boolean).sort((a, b) => a - b);
    if (!dates.length) {
      checkedNote.textContent = "";
    } else if (sameMonth(dates[0], dates[dates.length - 1])) {
      checkedNote.textContent = t("basket.checkedOne", { date: formatMonth(dates[0]) });
    } else {
      checkedNote.textContent = t("basket.checkedRange", { from: formatMonth(dates[0]), to: formatMonth(dates[dates.length - 1]) });
    }

    updateBasketTotals();
  }

  function chosenProducts() {
    return state.products.filter((product) => state.selected.has(product.id));
  }

  function currentBudget() {
    return Math.max(toNumber($("#budgetInput").value) || 0, 0);
  }

  function updateBasketTotals() {
    const chosen = chosenProducts();
    const total = chosen.reduce((sum, product) => sum + product.cheapest.price, 0);
    const budget = currentBudget();
    const over = budget > 0 && total > budget;

    $("#basketTotal").textContent = formatNumber(total, 2, 2);
    $("#basketCurrency").textContent = t("currencySymbol");
    $("#budgetCurrency").textContent = t("currencySymbol");
    $("#basketStatus").textContent = chosen.length
      ? t("basket.status", { items: t("basket.items", { count: chosen.length }) })
      : t("basket.statusEmpty");

    const meter = $("#budgetMeter");
    meter.style.width = `${budget > 0 ? Math.min((total / budget) * 100, 100) : 0}%`;
    meter.classList.toggle("over-budget", over);

    const budgetStatus = $("#budgetStatus");
    budgetStatus.classList.toggle("is-over", over);
    if (!chosen.length || budget <= 0) {
      budgetStatus.textContent = "";
    } else if (over) {
      budgetStatus.textContent = t("basket.over", { amount: formatSar(total - budget) });
    } else {
      budgetStatus.textContent = t("basket.left", { amount: formatSar(budget - total) });
    }
  }

  function basketSummary() {
    const chosen = chosenProducts();
    if (!chosen.length) return "";
    const total = chosen.reduce((sum, product) => sum + product.cheapest.price, 0);
    return t("basket.copyText", {
      items: formatList(chosen.map((product) => loc(product.name))),
      total: formatSar(total),
      budget: formatSar(currentBudget())
    });
  }

  /* ---------- Chat ---------- */

  function chatUrl() {
    const url = String(config.difyChatUrl || "").trim();
    if (url && !/^https:\/\//.test(url)) {
      console.warn("[Yara] difyChatUrl in config.js must start with https://");
      return "";
    }
    return url;
  }

  function renderChatFrame() {
    const frame = $("#chatFrame");
    const url = chatUrl();
    if (url) {
      if (frame.dataset.loaded !== url) {
        frame.innerHTML = `<iframe src="${esc(url)}" title="${esc(t("chat.frameTitle"))}" allow="microphone"></iframe>`;
        frame.dataset.loaded = url;
      } else {
        const iframe = $("iframe", frame);
        if (iframe) iframe.title = t("chat.frameTitle");
      }
      return;
    }
    frame.dataset.loaded = "";
    frame.innerHTML = `
      <div class="chat-offline">
        <img src="assets/logo.svg" alt="" width="54" height="54" />
        <h3>${esc(t("chat.offlineTitle"))}</h3>
        <p>${esc(t("chat.offlineText"))}</p>
        <a class="button button-primary" href="#protein" data-close-dialog>${esc(t("chat.offlineCta"))}</a>
      </div>`;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      /* fall through to the older method */
    }
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      return copied;
    } catch (error) {
      return false;
    }
  }

  // The chat lives in another site's frame, so we can't type into it.
  // Instead we copy the question and tell the visitor to paste it.
  async function openChat(textToCopy) {
    const notice = $("#chatNotice");
    notice.hidden = true;
    if (textToCopy && chatUrl()) {
      if (await copyText(textToCopy)) {
        notice.textContent = t("chat.copied");
        notice.hidden = false;
      }
    }
    renderChatFrame();
    const dialog = $("#chatModal");
    if (!dialog.open) dialog.showModal();
  }

  /* ---------- Language ---------- */

  function initialLanguage() {
    try {
      const fromUrl = new URLSearchParams(location.search).get("lang");
      if (fromUrl === "ar" || fromUrl === "en") return fromUrl;
    } catch (error) {
      /* ignore */
    }
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "ar" || saved === "en") return saved;
    } catch (error) {
      /* storage can be blocked; that's fine */
    }
    return (navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "en";
  }

  function setLanguage(lang, { remember = true } = {}) {
    state.lang = lang;
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";

    if (remember) {
      try {
        localStorage.setItem(LANG_KEY, lang);
      } catch (error) {
        /* ignore */
      }
      try {
        // Keeps the address shareable in the chosen language, e.g. ...?lang=ar
        const url = new URL(location.href);
        url.searchParams.set("lang", lang);
        history.replaceState(null, "", url);
      } catch (error) {
        /* ignore */
      }
    }

    applyStaticText();
    renderStats();
    renderRanking();
    renderRecipes();
    renderBasket();
    renderPrintGuide();
    renderWeek();
    if ($("#chatModal").open) renderChatFrame();
    if (state.openRecipe) {
      const recipe = RECIPES.find((item) => item.id === state.openRecipe);
      if (recipe) renderRecipeModal(recipe);
    }
    root.classList.remove("lang-pending");
  }

  /* ---------- Events ---------- */

  function bindEvents() {
    $("#languageButton").addEventListener("click", () => setLanguage(state.lang === "ar" ? "en" : "ar"));

    $$("[data-open-chat]").forEach((button) => button.addEventListener("click", () => openChat()));

    $$("[data-question]").forEach((button) =>
      button.addEventListener("click", () => openChat(t(`hero.questions.${button.dataset.question}`)))
    );

    $("#basketChatButton").addEventListener("click", () => openChat(basketSummary()));

    $("#recipeSearch").addEventListener("input", (event) => {
      state.search = event.target.value;
      renderRecipes();
    });

    $$(".filter-pill").forEach((pill) =>
      pill.addEventListener("click", () => {
        state.meal = pill.dataset.meal;
        $$(".filter-pill").forEach((other) => other.setAttribute("aria-pressed", String(other === pill)));
        renderRecipes();
      })
    );

    $("#recipeSort").addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderRecipes();
    });

    $("#weekGrid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-recipe]");
      if (button) showRecipe(button.dataset.recipe);
    });

    $("#recipeGrid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-recipe]");
      if (button) showRecipe(button.dataset.recipe);
    });

    $("#basketList").addEventListener("change", (event) => {
      const input = event.target;
      if (!input.matches('input[type="checkbox"]')) return;
      if (input.checked) state.selected.add(input.value);
      else state.selected.delete(input.value);
      updateBasketTotals();
    });

    $("#budgetInput").addEventListener("input", updateBasketTotals);

    $("#printGuideButton").addEventListener("click", () => {
      renderPrintGuide();
      window.print();
    });

    // Close buttons, and links inside dialogs that should close them first.
    document.addEventListener("click", (event) => {
      const closer = event.target.closest("[data-close-dialog]");
      if (!closer) return;
      const dialog = closer.closest("dialog");
      if (dialog && dialog.open) dialog.close();
    });

    // Clicking the dimmed area around a dialog closes it.
    $$("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const box = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
        if (!inside) dialog.close();
      });
    });

    $("#recipeModal").addEventListener("close", () => {
      state.openRecipe = null;
    });
  }

  function init() {
    if (!TEXT.en || !TEXT.ar) {
      console.error("[Yara] i18n.js is missing or has a typo, so the page can't load its text.");
      document.documentElement.classList.remove("lang-pending");
      return;
    }
    bindEvents();
    setLanguage(initialLanguage(), { remember: false });
    loadPrices();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
