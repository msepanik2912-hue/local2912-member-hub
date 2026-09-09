(() => {
  "use strict";

  const config = window.LOCAL2912_CONFIG || {};
  const status = document.getElementById("app-status");
  const pages = [...document.querySelectorAll(".page")];
  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const stewardBar = document.getElementById("steward-bar");
  const routesWithStewardBar = new Set(["ask", "contract", "reader", "weingarten", "workplace"]);
  let deferredInstallPrompt = null;
  let corpora = null;

  function announce(message) {
    status.textContent = "";
    window.setTimeout(() => { status.textContent = message; }, 20);
  }

  function getRoute() {
    const route = (location.hash || "#home").slice(1).split("?")[0];
    return pages.some(p => p.dataset.route === route) ? route : "home";
  }

  function hashParams() {
    const raw = (location.hash || "").split("?")[1] || "";
    return new URLSearchParams(raw);
  }

  function navRoute(route) {
    if (["reader"].includes(route)) return "contract";
    if (["weingarten", "workplace", "steward", "board", "resources", "accessibility", "sources"].includes(route)) return "more";
    return route;
  }

  function showRoute(route, focusHeading = true) {
    pages.forEach(page => { page.hidden = page.dataset.route !== route; });
    navLinks.forEach(link => {
      if (link.dataset.nav === navRoute(route)) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    stewardBar.hidden = !routesWithStewardBar.has(route);
    const active = pages.find(p => p.dataset.route === route);
    const heading = active?.querySelector("h1");
    document.title = `${heading?.textContent || "Member Hub"} | Local 2912`;
    if (focusHeading && heading) requestAnimationFrame(() => heading.focus({preventScroll:false}));
    window.scrollTo({top:0, behavior:"auto"});
    if (route === "reader") loadReaderFromHash();
  }

  window.addEventListener("hashchange", () => showRoute(getRoute(), true));

  // Offline state
  const offlineBanner = document.getElementById("offline-banner");
  function updateConnection() {
    const offline = !navigator.onLine;
    offlineBanner.hidden = !offline;
    if (offline) announce("You are offline. Core rights information and the searchable text index remain available.");
  }
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  updateConnection();

  // PWA registration
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  // Install prompt where browser supports it.
  const installButton = document.getElementById("install-button");
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    announce(result.outcome === "accepted" ? "Install request accepted." : "Install canceled.");
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    installButton.hidden = true;
    announce("Local 2912 Member Hub installed.");
  });

  async function loadJson(url, fallback) {
    try {
      const response = await fetch(url, {cache:"no-store"});
      if (!response.ok) throw new Error("Request failed");
      return await response.json();
    } catch {
      return fallback;
    }
  }

  function documentFeedUrl(feedName) {
    const base = config.integrations?.documentDataBaseUrl || "";
    if (!base) return "";
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}feed=${encodeURIComponent(feedName)}`;
  }

  async function loadDocumentSource(feedName, fallbackUrl, fallback) {
    const liveUrl = documentFeedUrl(feedName);
    if (liveUrl) {
      try {
        const response = await window.LOCAL2912_FEEDS.request(liveUrl, config.feedTimeoutMs);
        if (!response.ok) throw new Error("Document feed request failed");
        const payload = await response.json();
        if (window.LOCAL2912_FEEDS.validDocument(feedName, payload)) return {data:payload, source:"live"};
      } catch (_) {}
    }
    return {data: await loadJson(fallbackUrl, fallback), source:"bundled"};
  }

  async function loadCorpora() {
    if (corpora) return corpora;
    let [cbaResult, personnelResult, manifestResult, supplementsResult, archiveResult, retrievalHints] = await Promise.all([
      loadDocumentSource("cbaCorpus", config.data?.cbaCorpus || "data/cba_corpus.json", null),
      loadDocumentSource("personnelCorpus", config.data?.personnelCorpus || "data/personnel_corpus.json", null),
      loadDocumentSource("sourceManifest", config.data?.sourceManifest || "data/source_manifest.json", null),
      loadDocumentSource("supplementsCorpus", config.data?.supplementsCorpus || "data/supplements_corpus.json", {metadata:{},records:[]}),
      loadDocumentSource("sourceArchive", config.data?.sourceArchive || "data/source_archive.json", {items:[]}),
      loadJson(config.data?.retrievalHints || "data/retrieval_hints.json", {rules:[], complex_layout_penalty:0})
    ]);
    const sourceResults = [cbaResult, personnelResult, manifestResult, supplementsResult, archiveResult];
    if (sourceResults.some(r => r.source !== "live") && sourceResults.some(r => r.source === "live")) {
      const keys = ["cbaCorpus", "personnelCorpus", "sourceManifest", "supplementsCorpus", "sourceArchive"];
      const paths = ["cba_corpus", "personnel_corpus", "source_manifest", "supplements_corpus", "source_archive"];
      [cbaResult, personnelResult, manifestResult, supplementsResult, archiveResult] = await Promise.all(
        keys.map(async (key, i) => ({data:await loadJson(config.data?.[key] || `data/${paths[i]}.json`, null), source:"bundled"}))
      );
    }
    const cba = cbaResult.data;
    const personnel = personnelResult.data;
    if (!cba || !personnel) throw new Error("Source corpus unavailable");
    corpora = {
      cba, personnel, manifest:manifestResult.data, supplements:supplementsResult.data || {metadata:{},records:[]},
      archive:archiveResult.data || {items:[]}, retrievalHints,
      sourceMode: (cbaResult.source === "live" && personnelResult.source === "live") ? "live" : "bundled"
    };
    return corpora;
  }

  const corpusPromise = loadCorpora();
  showRoute(getRoute(), false);
  const contractLoadStatus = document.getElementById("contract-load-status");
  corpusPromise.then(({cba, personnel, supplements, sourceMode}) => {
    const supplementCount = (supplements?.records || []).length;
    contractLoadStatus.textContent = `Source index ready (${sourceMode === "live" ? "live current versions" : "bundled fallback"}): ${cba.records.length} CBA records, ${supplementCount} active supplemental records, and ${personnel.records.length} Personnel Rules records.`;
    buildArticleList(cba);
    renderSourceVersionInfo();
    const article20 = cba.records.find(r => r.kind === "article" && r.article === "20");
    const article20Link = document.getElementById("article20-link");
    if (article20 && article20Link) article20Link.href = readerHref("cba", article20.id);
  }).catch(() => {
    contractLoadStatus.textContent = "The source index could not be loaded. Use the official PDF links below.";
  });

  function normalize(value) {
    return (value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/[^a-z0-9'\-\s.]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const SEARCH_STOPWORDS = new Set([
    "a","an","and","are","as","at","be","been","being","but","by","can","could","did","do","does","for","from",
    "had","has","have","how","i","if","in","is","it","me","my","of","on","or","our","so","that","the","their",
    "them","then","there","this","to","was","we","were","what","when","where","which","who","why","will","with",
    "would","you","your","received","want","know","tell","please","about"
  ]);

  const SEARCH_ALIASES = {
    "grieve":["grievance"], "grieved":["grievance"], "grieving":["grievance"],
    "warning":["discipline"], "reprimand":["discipline"], "writeup":["discipline"],
    "fired":["discharge","discipline"], "fire":["discharge","discipline"], "terminated":["discharge","discipline"], "termination":["discharge","discipline"],
    "investigated":["investigation"], "questioned":["interrogation","investigation"],
    "underpaid":["wages","pay"], "paycheck":["wages","pay"],
    "shift":["schedule"], "schedulechange":["schedule"],
    "accommodate":["accommodation"], "disabled":["accommodation","disability"],
    "call":["called"], "comp":["compensatory"]
  };

  function queryTerms(query) {
    const raw = normalize(query).split(" ").filter(t => t.length > 1 && !SEARCH_STOPWORDS.has(t));
    const expanded = [];
    raw.forEach(term => {
      expanded.push(term);
      (SEARCH_ALIASES[term] || []).forEach(alias => expanded.push(alias));
    });
    return [...new Set(expanded)];
  }

  function ruleMatches(rule, normalizedQuery) {
    const words = new Set(normalizedQuery.split(" ").filter(Boolean));
    const allTerms = rule.all_terms || [];
    const anyTerms = rule.any_terms || [];
    const anyPhrases = rule.any_phrases || [];

    if (allTerms.length && !allTerms.every(term => words.has(normalize(term)))) return false;

    const termMatched = anyTerms.length ? anyTerms.some(term => words.has(normalize(term))) : false;
    const phraseMatched = anyPhrases.length ? anyPhrases.some(phrase => normalizedQuery.includes(normalize(phrase))) : false;

    if (anyTerms.length && !termMatched && !anyPhrases.length) return false;
    if (anyPhrases.length && !phraseMatched && !termMatched) return false;
    return true;
  }

  function scoreRecord(record, query, source) {
    const phrase = normalize(query);
    const terms = queryTerms(query);
    if (!terms.length) return 0;
    const heading = normalize([record.heading, record.article_title, record.section_title, record.rule_title].filter(Boolean).join(" "));
    const text = normalize(record.text);
    let score = source === "supplement" ? 25 : (source === "cba" ? 20 : 0);
    if (heading.includes(phrase)) score += 50;
    if (text.includes(phrase)) score += 25;
    let all = true;
    for (const term of terms) {
      const h = heading.includes(term);
      const t = text.includes(term);
      if (h) score += 14;
      if (t) {
        score += 4;
        const occurrences = Math.min(4, text.split(term).length - 1);
        score += occurrences;
      }
      if (!h && !t) all = false;
    }
    if (all) score += 15;

    const hints = corpora?.retrievalHints || {rules:[], complex_layout_penalty:0};
    if (record.complex_layout) score -= Number(hints.complex_layout_penalty || 0);
    for (const rule of (hints.rules || [])) {
      if (rule.record_id === record.id && (rule.source || source) === source && ruleMatches(rule, phrase)) {
        score += Number(rule.boost || 0);
      }
    }
    return score;
  }

  function searchSources(query, includePersonnel = false, limit = 20) {
    if (!corpora) return [];
    const hits = [];
    corpora.cba.records.forEach(record => {
      const score = scoreRecord(record, query, "cba");
      if (score > 8) hits.push({record, source:"cba", score});
    });
    (corpora.supplements?.records || []).forEach(record => {
      const score = scoreRecord(record, query, "supplement");
      if (score > 8) hits.push({record, source:"supplement", score});
    });
    if (includePersonnel) {
      corpora.personnel.records.forEach(record => {
        const score = scoreRecord(record, query, "personnel");
        if (score > 8) hits.push({record, source:"personnel", score});
      });
    }
    hits.sort((a,b) => b.score - a.score || a.record.pdf_page_start - b.record.pdf_page_start);
    return hits.slice(0, limit);
  }

  function excerptFor(record, query, max = 360) {
    const text = (record.text || "").replace(/\s+/g, " ").trim();
    if (!text) return "Open this source to browse its sections.";
    const lower = text.toLowerCase();
    const terms = queryTerms(query);
    let pos = -1;
    for (const term of terms) {
      const p = lower.indexOf(term.toLowerCase());
      if (p >= 0 && (pos < 0 || p < pos)) pos = p;
    }
    if (pos < 0) pos = 0;
    const start = Math.max(0, pos - 110);
    const end = Math.min(text.length, start + max);
    return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
  }

  function sourceMeta(source, record = null) {
    if (!corpora) return null;
    if (source === "cba") return corpora.cba.metadata;
    if (source === "personnel") return corpora.personnel.metadata;
    if (source === "supplement") return record?.supplement_meta || corpora.supplements?.metadata || {};
    return {};
  }

  function readerHref(source, id) {
    return `#reader?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`;
  }

  function createSourceResult(hit, query) {
    const {record, source} = hit;
    const meta = sourceMeta(source, record);
    const article = document.createElement("article");
    article.className = "search-result";

    const badge = document.createElement("p");
    badge.className = `source-badge ${source === "cba" ? "source-primary" : "source-supplemental"}`;
    badge.textContent = source === "cba" ? "CBA — primary source" : (source === "supplement" ? "Active supplemental agreement — conditional source" : "Personnel Rules — supplemental source");

    const h = document.createElement("h3");
    const link = document.createElement("a");
    link.href = readerHref(source, record.id);
    link.textContent = record.heading || meta.short_title;
    h.appendChild(link);

    const context = document.createElement("p");
    context.className = "result-context";
    const parts = [];
    if (source === "cba" && record.article) parts.push(`Article ${record.article}${record.article_title ? ` — ${record.article_title}` : ""}`);
    if (source === "personnel" && record.rule) parts.push(`Rule ${record.rule}${record.rule_title ? ` — ${record.rule_title}` : ""}`);
    if (source === "supplement") parts.push(meta.short_title || meta.title || "Supplemental agreement");
    const pg = record.pdf_page_start === record.pdf_page_end ? `PDF page ${record.pdf_page_start}` : `PDF pages ${record.pdf_page_start}–${record.pdf_page_end}`;
    parts.push(pg);
    context.textContent = parts.join(" · ");

    const excerpt = document.createElement("p");
    excerpt.textContent = excerptFor(record, query);

    article.append(badge, h, context, excerpt);

    if (source === "personnel") {
      let warningText = "";
      if (record.rule === "XVI" || normalize(record.rule_title).includes("grievance")) {
        warningText = "Personnel Rule XVI states that employees covered by a grievance procedure negotiated through collective bargaining are not eligible to use that Rule's grievance procedure. Check CBA Article 21 and contact a steward.";
      } else if (["XVIII", "XVIIIA"].includes(record.rule) || normalize(record.rule_title).includes("disciplinary")) {
        warningText = "For covered AFSCME employees, CBA Article 20 states that disciplinary actions are reviewed through the contractual grievance/arbitration procedures in Article 21. Do not substitute a general Personnel Rules discipline appeal path for the CBA procedure.";
      } else if (record.rule === "IX") {
        warningText = "The general Personnel Rules describe a six-month probationary period, but CBA Section 12.10 provides a twelve-month probationary period for covered new employees. Check the CBA first.";
      }
      if (warningText) {
        const warning = document.createElement("div");
        warning.className = "notice notice-warning compact-notice";
        const strong = document.createElement("strong");
        strong.textContent = "Represented employee caution: ";
        warning.append(strong, document.createTextNode(warningText));
        article.appendChild(warning);
      }
    }

    const actions = document.createElement("div");
    actions.className = "result-actions";
    const read = document.createElement("a");
    read.className = "button button-secondary";
    read.href = readerHref(source, record.id);
    read.textContent = "Read accessible text";
    const pdf = document.createElement("a");
    pdf.className = "button button-secondary";
    pdf.href = meta.pdf ? `${meta.pdf}${String(meta.pdf).includes("drive.google.com") ? "" : `#page=${record.pdf_page_start}`}` : "#";
    pdf.target = "_blank";
    pdf.rel = "noopener";
    pdf.textContent = `Open PDF page ${record.pdf_page_start}`;
    actions.append(read, pdf);
    article.appendChild(actions);
    return article;
  }

  function renderSearchResults(target, query, hits, title = null) {
    target.innerHTML = "";
    const h2 = document.createElement("h2");
    h2.tabIndex = -1;
    h2.textContent = title || `Search results for “${query}”`;
    target.appendChild(h2);
    if (!hits.length) {
      const p = document.createElement("p");
      p.textContent = "No matching source text was found. Try a shorter keyword or browse by Article.";
      target.appendChild(p);
      return h2;
    }
    const summary = document.createElement("p");
    summary.textContent = `${hits.length} result${hits.length === 1 ? "" : "s"} shown. Active supplemental agreements are shown when relevant; the current CBA remains the primary full agreement and Personnel Rules remain supplemental.`;
    target.appendChild(summary);
    const list = document.createElement("div");
    list.className = "search-results-list";
    hits.forEach(hit => list.appendChild(createSourceResult(hit, query)));
    target.appendChild(list);
    return h2;
  }

  // Contract search
  const contractForm = document.getElementById("contract-search-form");
  const contractResults = document.getElementById("contract-search-results");
  async function runContractSearch(query, includePersonnel = document.getElementById("include-personnel").checked, focusResults = true) {
    const term = query.trim();
    if (!term) return;
    contractLoadStatus.textContent = "Searching source index…";
    try {
      await corpusPromise;
      const hits = searchSources(term, includePersonnel, 20);
      contractResults.hidden = false;
      const heading = renderSearchResults(contractResults, term, hits);
      contractLoadStatus.textContent = `Search complete. ${hits.length} result${hits.length === 1 ? "" : "s"} shown.`;
      announce(`${hits.length} source results available for ${term}.`);
      if (focusResults) heading.focus();
    } catch {
      contractLoadStatus.textContent = "Search index unavailable. Use the official PDF links below.";
      announce("Contract search index is unavailable.");
    }
  }

  contractForm.addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("contract-search");
    if (!input.value.trim()) { input.focus(); announce("Enter a contract search term."); return; }
    runContractSearch(input.value);
  });

  document.querySelectorAll(".topic-button").forEach(button => button.addEventListener("click", () => {
    const input = document.getElementById("contract-search");
    const query = button.dataset.query || button.textContent.trim();
    input.value = query;
    runContractSearch(query);
  }));

  function buildArticleList(cba) {
    const target = document.getElementById("cba-article-list");
    target.innerHTML = "";
    const articles = cba.index.filter(item => item.type === "article");
    const list = document.createElement("ol");
    list.className = "article-index";
    articles.forEach(item => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = readerHref("cba", item.record_id);
      a.textContent = `Article ${item.article} — ${item.title}`;
      li.appendChild(a);
      list.appendChild(li);
    });
    target.appendChild(list);
  }

  function formatSourceVersion(meta, type) {
    if (!meta) return "Not available";
    if (type === "cba") {
      const term = meta.term || [meta.effective_start, meta.effective_end].filter(Boolean).join("–");
      return `${meta.short_title || meta.title || "Current CBA"}${term ? ` • ${term}` : ""}`;
    }
    const revised = meta.revised || meta.revision_date;
    return `${meta.short_title || meta.title || "Personnel Rules"}${revised ? ` • revised ${revised}` : ""}`;
  }

  function renderSourceVersionInfo() {
    if (!corpora) return;
    const cbaMeta = corpora.cba?.metadata || {};
    const personnelMeta = corpora.personnel?.metadata || {};
    const cbaSummary = document.getElementById("active-cba-summary");
    const cbaSummaryCopy = document.getElementById("active-cba-summary-copy");
    const cbaSummaryArchive = document.getElementById("active-cba-summary-archive");
    const personnelSummary = document.getElementById("active-personnel-summary");
    const personnelSummaryArchive = document.getElementById("active-personnel-summary-archive");
    const supplementSummary = document.getElementById("active-supplement-summary");
    const supplementSummaryArchive = document.getElementById("active-supplement-summary-archive");
    const cbaLink = document.getElementById("current-cba-link");
    const personnelLink = document.getElementById("current-personnel-link");
    const sourceMode = document.getElementById("document-source-mode");
    const cbaText = formatSourceVersion(cbaMeta, "cba");
    const personnelText = formatSourceVersion(personnelMeta, "personnel");
    if (cbaSummary) cbaSummary.textContent = cbaText;
    if (cbaSummaryCopy) cbaSummaryCopy.textContent = cbaText;
    if (cbaSummaryArchive) cbaSummaryArchive.textContent = cbaText;
    if (personnelSummary) personnelSummary.textContent = personnelText;
    if (personnelSummaryArchive) personnelSummaryArchive.textContent = personnelText;
    const docs = new Map((corpora.supplements?.records || []).map(r => { const m = r.supplement_meta || {}; return [m.document_id || m.title || r.id, m]; }));
    const supplementText = docs.size ? `${docs.size} active supplemental agreement${docs.size === 1 ? "" : "s"} loaded` : "No active supplemental agreements loaded";
    if (supplementSummary) supplementSummary.textContent = supplementText;
    if (supplementSummaryArchive) supplementSummaryArchive.textContent = supplementText;
    if (cbaLink && cbaMeta.pdf) cbaLink.href = cbaMeta.pdf;
    if (personnelLink && personnelMeta.pdf) personnelLink.href = personnelMeta.pdf;
    if (sourceMode) sourceMode.textContent = corpora.sourceMode === "live" ? "Live current versions" : "Bundled fallback versions";

    const archiveTarget = document.getElementById("source-version-list");
    if (archiveTarget) {
      archiveTarget.innerHTML = "";
      const items = corpora.archive?.items || [];
      if (!items.length) {
        const p = document.createElement("p"); p.className = "muted"; p.textContent = "No source archive is connected yet."; archiveTarget.appendChild(p);
      } else {
        const list = document.createElement("ul"); list.className = "source-version-list";
        items.forEach(item => {
          const li = document.createElement("li");
          const strong = document.createElement("strong"); strong.textContent = item.short_title || item.title || "Source"; li.appendChild(strong);
          const details = [];
          if (item.effective_start || item.effective_end) details.push([item.effective_start, item.effective_end].filter(Boolean).join(" to "));
          if (item.revision_date) details.push(`revised ${item.revision_date}`);
          if (item.status) details.push(item.status);
          if (details.length) li.appendChild(document.createTextNode(` — ${details.join(" • ")}`));
          if (item.pdf) {
            li.appendChild(document.createTextNode(" "));
            const a = document.createElement("a"); a.href = item.pdf; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "Open PDF"; li.appendChild(a);
          }
          list.appendChild(li);
        });
        archiveTarget.appendChild(list);
      }
    }
  }

  // Accessible source reader
  function findRecord(source, id) {
    if (!corpora) return null;
    const collection = source === "personnel" ? corpora.personnel : (source === "supplement" ? corpora.supplements : corpora.cba);
    return (collection?.records || []).find(r => r.id === id) || null;
  }

  function childRecordsFor(record, source) {
    if (!corpora || source !== "cba" || record.kind !== "article" || !record.article) return [];
    return corpora.cba.records.filter(r => r.kind === "section" && r.article === record.article);
  }

  async function loadReaderFromHash() {
    const title = document.getElementById("reader-title");
    const label = document.getElementById("reader-source-label");
    const context = document.getElementById("reader-context");
    const text = document.getElementById("reader-text");
    const childLinks = document.getElementById("reader-child-links");
    const pdfLink = document.getElementById("reader-pdf-link");
    const authority = document.getElementById("reader-authority-notice");
    const complex = document.getElementById("reader-complex-notice");
    const params = hashParams();
    const requestedSource = params.get("source");
    const source = requestedSource === "personnel" ? "personnel" : (requestedSource === "supplement" ? "supplement" : "cba");
    const id = params.get("id");

    title.textContent = "Loading source…";
    context.textContent = ""; text.textContent = ""; childLinks.innerHTML = "";
    authority.hidden = true; complex.hidden = true;
    try {
      await corpusPromise;
      const record = findRecord(source, id);
      if (!record) throw new Error("Record not found");
      const meta = sourceMeta(source, record);
      label.textContent = source === "cba" ? (meta.short_title || "Current CBA") : (source === "supplement" ? (meta.short_title || meta.title || "Supplemental agreement") : (meta.short_title || "City of Chicago Personnel Rules"));
      title.textContent = record.heading || meta.short_title;
      const pg = record.pdf_page_start === record.pdf_page_end ? `PDF page ${record.pdf_page_start}` : `PDF pages ${record.pdf_page_start}–${record.pdf_page_end}`;
      const pieces = [meta.short_title, pg];
      if (source === "cba") {
        if (meta.term) pieces.push(meta.term);
        else if (meta.effective_start || meta.effective_end) pieces.push([meta.effective_start, meta.effective_end].filter(Boolean).join(" to "));
      }
      if (source === "personnel") {
        if (meta.revised) pieces.push(`Revised ${meta.revised}`);
        else if (meta.revision_date) pieces.push(`Revised ${meta.revision_date}`);
      }
      if (source === "supplement" && (meta.effective_start || meta.effective_end)) pieces.push([meta.effective_start, meta.effective_end].filter(Boolean).join(" to "));
      context.textContent = pieces.join(" · ");

      if (source === "supplement") {
        authority.hidden = false;
        authority.innerHTML = "";
        const strong = document.createElement("strong");
        strong.textContent = "Conditional supplemental source: ";
        authority.append(strong, document.createTextNode("This document may modify or supplement the CBA only as its own language expressly provides. Review it together with the current CBA and consult a steward for fact-specific application."));
        if (meta.affects) authority.append(document.createTextNode(` Affected provisions listed by the Local: ${meta.affects}.`));
      }

      if (source === "personnel") {
        authority.hidden = false;
        authority.innerHTML = "";
        const strong = document.createElement("strong");
        strong.textContent = "Supplemental source: ";
        authority.append(strong, document.createTextNode("The Personnel Rules state that where they conflict with an applicable CBA, the CBA governs. For Local 2912 members, check the CBA first."));

        let cbaTarget = null;
        let extra = "";
        if (record.rule === "IX") {
          cbaTarget = corpora.cba.records.find(r => r.kind === "section" && String(r.section || "").startsWith("12.10"));
          extra = " The CBA provides a twelve-month probationary period for covered new employees.";
        } else if (record.rule === "XVI") {
          cbaTarget = corpora.cba.records.find(r => r.kind === "article" && r.article === "21");
          extra = " Personnel Rule XVI excludes employees covered by a negotiated grievance procedure; use CBA Article 21 for the represented grievance process.";
        } else if (["XVIII", "XVIIIA"].includes(record.rule)) {
          cbaTarget = corpora.cba.records.find(r => r.kind === "article" && r.article === "20");
          extra = " For covered AFSCME employees, CBA Article 20 directs disciplinary review through the contractual grievance/arbitration procedure.";
        }
        if (extra) authority.append(document.createTextNode(extra));
        if (cbaTarget) {
          authority.append(document.createTextNode(" "));
          const a = document.createElement("a");
          a.href = readerHref("cba", cbaTarget.id);
          a.textContent = "Open the controlling CBA provision.";
          authority.appendChild(a);
        }
      }
      complex.hidden = !record.complex_layout;
      text.textContent = record.text || "This heading has no separate body text. Choose a section below.";

      const children = childRecordsFor(record, source);
      if (children.length) {
        const h = document.createElement("h2");
        h.textContent = `Sections in Article ${record.article}`;
        const ul = document.createElement("ul");
        ul.className = "reader-section-list";
        children.forEach(child => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = readerHref(source, child.id);
          a.textContent = child.heading;
          li.appendChild(a); ul.appendChild(li);
        });
        childLinks.append(h, ul);
      }

      pdfLink.href = meta.pdf ? `${meta.pdf}${String(meta.pdf).includes("drive.google.com") ? "" : `#page=${record.pdf_page_start}`}` : "#";
      pdfLink.firstChild.textContent = `Open official PDF${String(meta.pdf || "").includes("drive.google.com") ? "" : ` at page ${record.pdf_page_start}`} `;
      document.title = `${record.heading} | Local 2912 Member Hub`;
      requestAnimationFrame(() => title.focus({preventScroll:false}));
      announce(`${record.heading} loaded from ${meta.short_title}.`);
    } catch {
      title.textContent = "Source not found";
      context.textContent = "The requested source text could not be loaded.";
      text.textContent = "Return to Contract Search and try again.";
      announce("The requested source could not be loaded.");
    }
  }

  // Ask 2912 Stage 6: local retrieval plus an optional member-owned ChatGPT handoff.
  // There is intentionally no OpenAI API call, token, key, or Local-funded AI endpoint.
  const askForm = document.getElementById("ask-form");
  const riskTerms = ["discipline","disciplinary","suspend","suspension","terminate","termination","discharge","investigation","investigatory","interrogation","retaliation","discrimination","accommodation","pay shortage","unpaid","warning","reprimand","grievance"];
  let latestAskHits = [];

  function sourceLabelForPrompt(hit) {
    const {record, source} = hit;
    if (source === "cba") {
      const article = record.article ? `Article ${record.article}${record.article_title ? ` — ${record.article_title}` : ""}` : "CBA";
      const section = record.section ? `, Section ${record.section}${record.section_title ? ` — ${record.section_title}` : ""}` : "";
      return `${article}${section}, PDF page ${record.pdf_page_start}`;
    }
    if (source === "supplement") {
      const meta = sourceMeta(source, record);
      return `${meta.short_title || meta.title || "Supplemental agreement"}, PDF page ${record.pdf_page_start}${meta.affects ? `, listed as affecting ${meta.affects}` : ""}`;
    }
    const rule = record.rule ? `Rule ${record.rule}${record.rule_title ? ` — ${record.rule_title}` : ""}` : "Personnel Rules";
    const section = record.section ? `, Section ${record.section}${record.section_title ? ` — ${record.section_title}` : ""}` : "";
    return `${rule}${section}, PDF page ${record.pdf_page_start}`;
  }

  function cleanPromptText(value, maxChars = 1600) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars).trim()}… [excerpt shortened by Member Hub]`;
  }

  function selectPromptHits(hits) {
    // Include active supplemental agreements when retrieval found them, but label them as conditional
    // sources whose effect depends on their express language. Preserve CBA-first full-agreement grounding.
    const supplements = hits.filter(hit => hit.source === "supplement" && hit.record.text).slice(0, 2);
    const cba = hits.filter(hit => hit.source === "cba" && hit.record.text).slice(0, 3);
    const personnel = hits.filter(hit => hit.source === "personnel" && hit.record.text).slice(0, 1);
    return [...supplements, ...cba, ...personnel];
  }

  function buildChatGptPrompt(question, hits) {
    const selected = selectPromptHits(hits);
    const sourceBlocks = selected.length ? selected.map((hit, index) => {
      const type = hit.source === "cba" ? "PRIMARY CBA SOURCE" : (hit.source === "supplement" ? "ACTIVE CBA SUPPLEMENT — APPLY ONLY AS EXPRESSLY WRITTEN" : "SUPPLEMENTAL PERSONNEL RULE SOURCE");
      return `[SOURCE ${index + 1} — ${type}]\n${sourceLabelForPrompt(hit)}\n${cleanPromptText(hit.record.text)}`;
    }).join("\n\n") : "[No sufficiently close source excerpt was identified by the Member Hub.]";

    return `AFSCME LOCAL 2912 MEMBER CONTRACT QUESTION\n\n` +
`ROLE AND LIMITS\n` +
`Help a City of Chicago employee represented by AFSCME Local 2912 understand the supplied union source material. Use ONLY the source excerpts below for contract or Personnel Rules claims. Do not rely on outside labor-law knowledge to fill gaps. Do not invent contract language, article numbers, deadlines, facts, or outcomes.\n\n` +
`SOURCE PRIORITY\n` +
`1. The active AFSCME–City of Chicago collective bargaining agreement is the primary full agreement for represented employees.\n` +
`2. An active MOU, amendment, side letter, or extension may modify or supplement a CBA provision only to the extent its supplied language expressly does so. Do not infer an unstated override.\n` +
`3. City of Chicago Personnel Rules are supplemental. If there is a conflict, do not let a Personnel Rule override the applicable CBA or an express active CBA amendment.\n` +
`4. If the excerpts do not answer the question, say that clearly and recommend review with a Local 2912 steward.\n\n` +
`HOW TO ANSWER\n` +
`Use these headings: Potentially Relevant Issue; Contract/Source Provisions; Plain-Language Explanation; What the Member Should Preserve or Document; Deadline or Urgency Warning; Questions to Ask a Steward; Limitations.\n` +
`Do not declare that management definitely violated the contract, that a grievance definitely exists, or that a particular outcome is guaranteed. Do not calculate a definitive grievance deadline from incomplete facts. For discipline, investigations, discharge, suspension, retaliation, discrimination, accommodations, pay disputes, or other time-sensitive issues, prominently recommend prompt review with a Local 2912 steward.\n\n` +
`MEMBER QUESTION\n${question}\n\n` +
`APPROVED SOURCE EXCERPTS\n${sourceBlocks}\n\n` +
`FINAL REQUIREMENT\nEnd with: "Review this situation with a Local 2912 steward before relying on this explanation for a workplace decision or grievance deadline."`;
  }

  function updateChatGptHandoff(question, hits) {
    const handoff = document.getElementById("chatgpt-handoff");
    const prompt = document.getElementById("chatgpt-prompt");
    const open = document.getElementById("open-chatgpt");
    if (!handoff || !prompt) return;
    prompt.value = buildChatGptPrompt(question, hits);
    if (open) open.href = config.externalServices?.chatgptUrl || "https://chatgpt.com/";
    handoff.hidden = false;
  }

  askForm.addEventListener("submit", async event => {
    event.preventDefault();
    const question = document.getElementById("ask-question");
    const error = document.getElementById("ask-error");
    const progress = document.getElementById("ask-progress");
    const response = document.getElementById("ask-response");
    const answerTitle = document.getElementById("answer-title");
    const matchTarget = document.getElementById("ask-source-matches");
    const riskNotice = document.getElementById("ask-risk-notice");
    const handoff = document.getElementById("chatgpt-handoff");
    const q = question.value.trim();
    if (!q) {
      error.hidden = false; question.setAttribute("aria-invalid", "true"); question.focus(); announce("Question is required."); return;
    }
    error.hidden = true; question.removeAttribute("aria-invalid"); response.hidden = true; progress.hidden = false;
    if (handoff) handoff.hidden = true;
    announce("Searching approved sources.");
    try {
      await corpusPromise;
      document.getElementById("echo-question").textContent = q;
      latestAskHits = searchSources(q, true, 6);
      matchTarget.innerHTML = "";
      if (latestAskHits.length) latestAskHits.forEach(hit => matchTarget.appendChild(createSourceResult(hit, q)));
      else {
        const p = document.createElement("p"); p.textContent = "No close source match was found. Try Contract Search with a shorter keyword or contact a steward."; matchTarget.appendChild(p);
      }
      const nq = normalize(q);
      riskNotice.hidden = !riskTerms.some(term => nq.includes(term));
      updateChatGptHandoff(q, latestAskHits);
      progress.hidden = true; response.hidden = false;
      announce(`${latestAskHits.length} potentially relevant source matches found. An optional ChatGPT prompt has been prepared locally and has not been sent anywhere.`);
      answerTitle.focus();
    } catch {
      progress.hidden = true; response.hidden = false;
      matchTarget.textContent = "The source index could not be loaded. Use Contract Search or the official PDFs.";
      if (handoff) handoff.hidden = true;
      announce("Source lookup could not be completed.");
      answerTitle.focus();
    }
  });

  const copyChatGptPrompt = document.getElementById("copy-chatgpt-prompt");
  copyChatGptPrompt?.addEventListener("click", async () => {
    const prompt = document.getElementById("chatgpt-prompt");
    const text = prompt?.value || "";
    if (!text.trim()) { announce("There is no prepared prompt to copy."); return; }
    try {
      await navigator.clipboard.writeText(text);
      copyChatGptPrompt.textContent = "Copied";
      announce("Prepared prompt copied. Nothing was sent automatically. You can now open ChatGPT and paste it into your own account.");
      window.setTimeout(() => { copyChatGptPrompt.textContent = "Copy prepared prompt"; }, 1800);
    } catch {
      prompt.focus(); prompt.select();
      announce("Automatic copy was not available. The prompt has been selected so you can copy it manually.");
    }
  });

  document.getElementById("open-chatgpt")?.addEventListener("click", () => {
    announce("Opening ChatGPT in a new tab. The prepared prompt is not sent automatically; paste it there if you choose to continue.");
  });

  // Workplace problem prototype, now with direct source-search handoff.
  const issueQueries = {
    "Discipline or investigation":"discipline predisciplinary investigation union representative",
    "Pay or overtime":"pay overtime wages",
    "Schedule or shift":"schedule changes shift",
    "Vacation or leave":"vacation leave",
    "Promotion or bid":"permanent vacancies bid promotion",
    "Bullying or harassment":"harassment discrimination retaliation",
    "Accommodation":"reasonable accommodation",
    "Health or safety":"health safety",
    "Probation":"probationary employees",
    "Something else":""
  };
  document.querySelectorAll(".issue-button").forEach(button => button.addEventListener("click", () => {
    const guide = document.getElementById("issue-guide");
    const title = document.getElementById("issue-guide-title");
    const issue = button.dataset.issue;
    document.getElementById("issue-name").textContent = `Selected issue: ${issue}.`;
    const searchLink = document.getElementById("issue-contract-link");
    const query = issueQueries[issue] || issue;
    searchLink.hidden = !query;
    searchLink.dataset.query = query;
    guide.hidden = false; title.focus(); announce(`${issue} guide opened.`);
  }));
  document.getElementById("issue-contract-link")?.addEventListener("click", event => {
    event.preventDefault();
    const query = event.currentTarget.dataset.query || "";
    location.hash = "#contract";
    window.setTimeout(() => {
      const input = document.getElementById("contract-search");
      input.value = query;
      runContractSearch(query, false, true);
    }, 30);
  });

  // Copy Weingarten request
  const copyButton = document.getElementById("copy-rights");
  copyButton.addEventListener("click", async () => {
    const text = document.getElementById("rights-script").textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      announce("Suggested representation request copied to clipboard.");
      copyButton.textContent = "Copied";
      window.setTimeout(() => { copyButton.textContent = "Copy suggested request"; }, 1600);
    } catch {
      announce("Copy was not available. The suggested request follows on the page and can be selected manually.");
    }
  });

  function feedUrl(feedName, explicitUrl, fallbackUrl) {
    if (explicitUrl) return {url: explicitUrl, live: true};
    const base = config.integrations?.liveDataBaseUrl || "";
    if (base) {
      const separator = base.includes("?") ? "&" : "?";
      return {url: `${base}${separator}feed=${encodeURIComponent(feedName)}`, live: true};
    }
    return {url: fallbackUrl, live: false};
  }

  async function loadFeed(feedName, explicitUrl, fallbackUrl, fallback = []) {
    const primary = feedUrl(feedName, explicitUrl, fallbackUrl);
    if (primary.live) {
      try {
        const response = await window.LOCAL2912_FEEDS.request(primary.url, config.feedTimeoutMs);
        if (!response.ok) throw new Error("Live feed request failed");
        const payload = await response.json();
        const data = window.LOCAL2912_FEEDS.items(payload);
        return {data, source:"live"};
      } catch {
        const local = await loadJson(fallbackUrl, fallback);
        return {data:local, source:"fallback"};
      }
    }
    return {data: await loadJson(fallbackUrl, fallback), source:"local"};
  }

  function setFeedStatus(id, source, hasData, liveLabel) {
    const node = document.getElementById(id);
    if (!node) return;
    if (source === "live") {
      node.textContent = `Live ${liveLabel}`;
      node.className = "status-chip status-chip-live";
    } else if (hasData) {
      node.textContent = navigator.onLine ? "Bundled fallback" : "Offline copy";
      node.className = "status-chip status-chip-fallback";
    } else {
      node.textContent = "Not connected";
      node.className = "status-chip";
    }
  }

  function safeExternalLink(url, label) {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = label;
    if (/^https?:/i.test(url)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = " opens in a new tab";
      a.appendChild(sr);
    }
    return a;
  }

  async function loadBoard() {
    const target = document.getElementById("board-list");
    const result = await loadFeed("board", config.integrations?.boardFeedUrl, config.data?.board || "data/board.json", []);
    const board = result.data.filter(member => member && member.name);
    setFeedStatus("board-data-status", result.source, board.length > 0, "board directory");
    target.innerHTML = "";
    if (!board.length) {
      const p = document.createElement("p"); p.className = "muted"; p.textContent = "Approved public board profiles have not been loaded."; target.appendChild(p); return;
    }
    board.forEach(member => {
      const card = document.createElement("article"); card.className = "profile-card";
      if (member.photoUrl) {
        const img = document.createElement("img");
        img.className = "profile-photo";
        img.src = member.photoUrl;
        img.alt = member.photoAlt || `${member.name}, ${member.office || "Local 2912 board member"}`;
        img.loading = "lazy";
        card.appendChild(img);
      }
      const h = document.createElement("h2"); h.textContent = member.name;
      card.appendChild(h);
      if (member.office) {
        const office = document.createElement("p");
        const strong = document.createElement("strong"); strong.textContent = member.office; office.appendChild(strong);
        card.appendChild(office);
      }
      if (member.summary) { const bio = document.createElement("p"); bio.textContent = member.summary; card.appendChild(bio); }
      const contacts = document.createElement("div"); contacts.className = "contact-links";
      if (member.email) contacts.appendChild(safeExternalLink(`mailto:${member.email}`, "Email"));
      if (member.phone) contacts.appendChild(safeExternalLink(`tel:${member.phone.replace(/[^\d+]/g, "")}`, "Call"));
      if (contacts.children.length) card.appendChild(contacts);
      target.appendChild(card);
    });
  }

  async function loadResources() {
    const target = document.getElementById("resource-list");
    const result = await loadFeed("resources", config.integrations?.resourcesFeedUrl, config.data?.resources || "data/resources.json", []);
    const groups = result.data;
    setFeedStatus("resources-data-status", result.source, groups.length > 0, "resources");
    target.innerHTML = "";
    if (!groups.length) {
      const p = document.createElement("p"); p.className = "muted"; p.textContent = "No approved resources are currently available."; target.appendChild(p); return;
    }
    groups.forEach(group => {
      const section = document.createElement("section"); section.className = "resource-group";
      const h = document.createElement("h2"); h.textContent = group.group || "Resources";
      const list = document.createElement("ul");
      (group.items || []).forEach(item => {
        const li = document.createElement("li");
        if (item.href) li.appendChild(safeExternalLink(item.href, item.label || item.href));
        else li.textContent = item.label || "";
        if (item.description) {
          const desc = document.createElement("p");
          desc.className = "help-text";
          desc.textContent = item.description;
          li.appendChild(desc);
        }
        list.appendChild(li);
      });
      section.append(h, list); target.appendChild(section);
    });
  }

  function parseEventDate(value) {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
  }

  function formatEventWhen(event) {
    if (event.when) return event.when;
    const start = parseEventDate(event.start);
    const end = parseEventDate(event.end);
    if (!start) return "Date and time to be announced";
    const dateFmt = new Intl.DateTimeFormat(undefined, {weekday:"short", month:"short", day:"numeric", year:"numeric"});
    if (event.allDay) return dateFmt.format(start);
    const timeFmt = new Intl.DateTimeFormat(undefined, {hour:"numeric", minute:"2-digit"});
    const base = `${dateFmt.format(start)} • ${timeFmt.format(start)}`;
    return end ? `${base}–${timeFmt.format(end)}` : base;
  }

  function compactUtc(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function googleCalendarHref(event) {
    const start = parseEventDate(event.start);
    const end = parseEventDate(event.end);
    if (!start) return "";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title || "Local 2912 event",
      dates: `${compactUtc(start)}/${compactUtc(end || new Date(start.getTime() + 3600000))}`,
      details: event.description || "",
      location: event.location || ""
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function makeIcsDownload(event) {
    const start = parseEventDate(event.start);
    if (!start) return null;
    const end = parseEventDate(event.end) || new Date(start.getTime() + 3600000);
    const clean = value => String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AFSCME Local 2912//Member Hub//EN",
      "BEGIN:VEVENT",
      `UID:${clean(event.id || `${start.getTime()}@local2912`)}`,
      `DTSTAMP:${compactUtc(new Date())}`,
      `DTSTART:${compactUtc(start)}`,
      `DTEND:${compactUtc(end)}`,
      `SUMMARY:${clean(event.title || "Local 2912 event")}`,
      event.location ? `LOCATION:${clean(event.location)}` : "",
      event.description ? `DESCRIPTION:${clean(event.description)}` : "",
      "END:VEVENT",
      "END:VCALENDAR"
    ].filter(Boolean).join("\r\n");
    return URL.createObjectURL(new Blob([ics], {type:"text/calendar;charset=utf-8"}));
  }

  function renderEventCard(event) {
    const article = document.createElement("article"); article.className = "event-card";
    const h = document.createElement("h3"); h.textContent = event.title || "Local 2912 event";
    const when = document.createElement("p"); when.textContent = formatEventWhen(event);
    article.append(h, when);
    if (event.location) { const loc = document.createElement("p"); loc.textContent = event.location; article.appendChild(loc); }
    if (event.description) { const desc = document.createElement("p"); desc.textContent = event.description; article.appendChild(desc); }
    const actions = document.createElement("div"); actions.className = "event-actions";
    const gcal = googleCalendarHref(event);
    if (gcal) actions.appendChild(safeExternalLink(gcal, "Add to Google Calendar"));
    const ics = makeIcsDownload(event);
    if (ics) {
      const a = document.createElement("a"); a.href = ics; a.download = "local2912-event.ics"; a.textContent = "Add to device calendar"; actions.appendChild(a);
    }
    if (event.htmlLink) actions.appendChild(safeExternalLink(event.htmlLink, "View event"));
    if (actions.children.length) article.appendChild(actions);
    return article;
  }

  async function loadEvents() {
    const result = await loadFeed("events", config.integrations?.calendarFeedUrl, config.data?.events || "data/events.json", []);
    const events = result.data
      .filter(event => event && event.title)
      .sort((a,b) => (parseEventDate(a.start)?.getTime() || 0) - (parseEventDate(b.start)?.getTime() || 0));
    setFeedStatus("calendar-data-status", result.source, events.length > 0, "calendar");
    [document.getElementById("calendar-events"), document.getElementById("home-events")].forEach((target, index) => {
      target.innerHTML = "";
      const subset = index === 1 ? events.slice(0, 3) : events;
      if (!subset.length) {
        const p = document.createElement("p"); p.className = "muted";
        p.textContent = "No upcoming Local 2912 events are currently loaded.";
        target.appendChild(p); return;
      }
      subset.forEach(event => target.appendChild(renderEventCard(event)));
    });
  }

  let stewardDirectory = [];
  async function loadStewards() {
    const result = await loadFeed("stewards", config.integrations?.stewardFeedUrl, config.data?.stewards || "data/stewards.json", []);
    stewardDirectory = result.data.filter(item => item && item.department && item.name);
    setFeedStatus("steward-data-status", result.source, stewardDirectory.length > 0, "steward directory");
    const select = document.getElementById("department");
    const current = select.value;
    select.innerHTML = '<option value="">Select a department</option>';
    [...new Set(stewardDirectory.map(item => item.department))].sort((a,b) => a.localeCompare(b)).forEach(department => {
      const option = document.createElement("option");
      option.value = department; option.textContent = department; select.appendChild(option);
    });
    if ([...select.options].some(opt => opt.value === current)) select.value = current;
  }

  function renderStewardResults(department) {
    const target = document.getElementById("steward-results");
    target.innerHTML = "";
    const matches = stewardDirectory.filter(item => item.department === department);
    if (!matches.length) {
      const p = document.createElement("p"); p.className = "muted"; p.textContent = "No approved public contact is listed for that department yet."; target.appendChild(p);
      announce("No approved public union contact was found for the selected department.");
      return;
    }
    matches.forEach(contact => {
      const card = document.createElement("article"); card.className = "profile-card";
      const h = document.createElement("h2"); h.textContent = contact.name;
      card.appendChild(h);
      if (contact.role) { const p = document.createElement("p"); const st = document.createElement("strong"); st.textContent = contact.role; p.appendChild(st); card.appendChild(p); }
      if (contact.workLocation) { const p = document.createElement("p"); p.textContent = contact.workLocation; card.appendChild(p); }
      if (contact.notes) { const p = document.createElement("p"); p.textContent = contact.notes; card.appendChild(p); }
      const links = document.createElement("div"); links.className = "contact-links";
      if (contact.email) links.appendChild(safeExternalLink(`mailto:${contact.email}`, "Email"));
      if (contact.phone) links.appendChild(safeExternalLink(`tel:${contact.phone.replace(/[^\d+]/g, "")}`, "Call"));
      if (links.children.length) card.appendChild(links);
      target.appendChild(card);
    });
    announce(`${matches.length} approved union contact${matches.length === 1 ? "" : "s"} found for ${department}.`);
  }

  document.getElementById("steward-directory-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const department = document.getElementById("department").value;
    if (!department) { announce("Select a department first."); document.getElementById("department").focus(); return; }
    renderStewardResults(department);
  });

  async function loadAnnouncements() {
    const result = await loadFeed("announcements", config.integrations?.announcementsFeedUrl, config.data?.announcements || "data/announcements.json", []);
    const now = Date.now();
    const items = result.data
      .filter(item => item && item.title)
      .filter(item => !item.expires || new Date(item.expires).getTime() >= now)
      .sort((a,b) => (new Date(b.publishDate || 0).getTime() || 0) - (new Date(a.publishDate || 0).getTime() || 0));
    setFeedStatus("announcements-status", result.source, items.length > 0, "announcements");
    const target = document.getElementById("home-announcements");
    target.innerHTML = "";
    if (!items.length) {
      const p = document.createElement("p"); p.className = "muted"; p.textContent = "No current announcements."; target.appendChild(p); return;
    }
    items.slice(0, 4).forEach(item => {
      const article = document.createElement("article"); article.className = "announcement-card";
      const h = document.createElement("h3"); h.textContent = item.title; article.appendChild(h);
      if (item.summary) { const p = document.createElement("p"); p.textContent = item.summary; article.appendChild(p); }
      if (item.href) article.appendChild(safeExternalLink(item.href, item.linkLabel || "Learn more"));
      target.appendChild(article);
    });
  }

  loadBoard();
  loadResources();
  loadEvents();
  loadStewards();
  loadAnnouncements();

})();
