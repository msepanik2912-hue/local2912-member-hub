/* Public reads only. No question, credential, upload or administration transport. */
(() => {
  'use strict';
  const api = {
    async request(url, timeoutMs = 10000) {
      const target = new URL(url, globalThis.location?.href || 'https://localhost/');
      if (target.protocol !== 'https:' || target.username || target.password) throw new Error('Public HTTPS feed required');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(target.href, {method:'GET', credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', signal:controller.signal});
        if (!response.ok) throw new Error('Public feed request failed');
        const payload = await response.json();
        return {ok:true, json:async () => payload};
      } finally { clearTimeout(timer); }
    },
    items(payload) {
      if (!payload || payload.error) throw new Error('Feed error');
      const rows = Array.isArray(payload) ? payload : (payload.items ?? payload.data);
      if (!Array.isArray(rows) || rows.some(x => !x || typeof x !== 'object' || Array.isArray(x))) throw new Error('Invalid feed data');
      return rows;
    },
    validDocument(name, payload) {
      if (!payload || payload.error) return false;
      if (name === 'sourceManifest') return Array.isArray(payload.sources) && payload.sources.length >= 2;
      if (name === 'sourceArchive') return Array.isArray(payload.items);
      if (!Array.isArray(payload.records)) return false;
      if (name !== 'supplementsCorpus' && !payload.records.length) return false;
      return payload.records.every(r => r && typeof r.id === 'string' && typeof r.text === 'string');
    }
  };
  globalThis.LOCAL2912_FEEDS = api;
})();
