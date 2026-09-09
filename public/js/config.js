window.LOCAL2912_CONFIG = {
  appName: "Local 2912 Member Hub",
  version: "0.9.0",
  feedTimeoutMs: 10000,
  data: {
    board: "data/board.json",
    stewards: "data/stewards.json",
    resources: "data/resources.json",
    events: "data/events.json",
    announcements: "data/announcements.json",
    cbaCorpus: "data/cba_corpus.json",
    personnelCorpus: "data/personnel_corpus.json",
    sourceManifest: "data/source_manifest.json",
    sourceArchive: "data/source_archive.json",
    supplementsCorpus: "data/supplements_corpus.json",
    retrievalHints: "data/retrieval_hints.json"
  },
  integrations: {
    // Optional Google Apps Script web-app endpoint created from google_admin_backend/Code.gs.
    // Example: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"
    liveDataBaseUrl: "",
    // Separate read-only document source feed produced by Stage 8.
    // Example: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"
    documentDataBaseUrl: "",
    // Individual feed URLs can override liveDataBaseUrl if Local 2912 later separates services.
    calendarFeedUrl: "",
    boardFeedUrl: "",
    stewardFeedUrl: "",
    resourcesFeedUrl: "",
    announcementsFeedUrl: ""
  },
  externalServices: {
    // Ask 2912 never calls an AI API. This link opens the member's own ChatGPT account.
    chatgptUrl: "https://chatgpt.com/"
  }
};
