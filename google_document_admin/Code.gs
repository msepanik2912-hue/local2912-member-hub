/**
 * AFSCME Local 2912 Member Hub - Document Administration backend
 * Stage 8
 *
 * Deploy this as a SEPARATE, RESTRICTED Apps Script web app for authorized
 * union administrators. Do not use this deployment as the public member feed.
 */

const REGISTRY_SHEET_NAME = 'Document Registry';
const HEADERS = [
  'document_id','document_type','title','short_title','effective_start','effective_end',
  'revision_date','ratified_effective','status','authority','affects','precedence_note',
  'pdf_file_id','corpus_file_id','validation_status','validation_summary',
  'uploaded_at','uploaded_by','activated_at','archived_at'
];

function doGet() {
  assertAdmin_();
  return HtmlService.createHtmlOutputFromFile('DocumentAdmin')
    .setTitle('Local 2912 Document Administration')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function setupDocumentAdmin() {
  assertAdmin_();
  const props = PropertiesService.getScriptProperties();
  let registryId = props.getProperty('REGISTRY_SHEET_ID');
  let documentFolderId = props.getProperty('DOCUMENT_FOLDER_ID');
  let publishedFolderId = props.getProperty('PUBLISHED_FOLDER_ID');

  if (!registryId) {
    const ss = SpreadsheetApp.create('Local 2912 Member Hub - Document Registry');
    registryId = ss.getId();
    props.setProperty('REGISTRY_SHEET_ID', registryId);
  }
  const ss = SpreadsheetApp.openById(registryId);
  let sheet = ss.getSheetByName(REGISTRY_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(REGISTRY_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  ensureHeaders_(sheet);

  if (!documentFolderId) {
    const folder = DriveApp.createFolder('Local 2912 Member Hub - Source Documents');
    documentFolderId = folder.getId();
    props.setProperty('DOCUMENT_FOLDER_ID', documentFolderId);
  }
  if (!publishedFolderId) {
    const folder = DriveApp.createFolder('Local 2912 Member Hub - Published Source Snapshots');
    publishedFolderId = folder.getId();
    props.setProperty('PUBLISHED_FOLDER_ID', publishedFolderId);
  }

  return {
    registrySheetId: registryId,
    documentFolderId: documentFolderId,
    publishedFolderId: publishedFolderId,
    publicFeedPropertyValue: publishedFolderId
  };
}

function getAdminState() {
  assertAdmin_();
  const rows = getRows_();
  return {
    documents: rows.map(publicRow_),
    setup: {
      registrySheetId: PropertiesService.getScriptProperties().getProperty('REGISTRY_SHEET_ID') || '',
      documentFolderId: PropertiesService.getScriptProperties().getProperty('DOCUMENT_FOLDER_ID') || '',
      publishedFolderId: PropertiesService.getScriptProperties().getProperty('PUBLISHED_FOLDER_ID') || ''
    }
  };
}

function saveDocument(payload) {
  assertAdmin_();
  if (!payload || !payload.metadata || !payload.corpusJson || !payload.pdfBase64) {
    throw new Error('Missing PDF, metadata, or extracted corpus.');
  }
  const setup = ensureSetup_();
  const meta = payload.metadata;
  const validation = payload.validation || {};
  const validationStatus = String(validation.status || 'REVIEW').toUpperCase();
  if (!['PASS','REVIEW','FAIL'].includes(validationStatus)) throw new Error('Invalid validation status.');

  const documentId = Utilities.getUuid();
  const safeName = sanitizeFileName_(payload.fileName || `${meta.short_title || meta.title || 'source'}.pdf`);
  const bytes = Utilities.base64Decode(payload.pdfBase64);
  const pdfBlob = Utilities.newBlob(bytes, 'application/pdf', safeName);
  const documentFolder = DriveApp.getFolderById(setup.documentFolderId);
  const pdfFile = documentFolder.createFile(pdfBlob);

  let shareWarning = '';
  if (payload.sharePdf !== false) {
    try {
      pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (err) {
      shareWarning = 'The PDF could not be made public automatically. Share it as view-only before activation if members must open the official PDF.';
    }
  }
  const pdfUrl = `https://drive.google.com/file/d/${pdfFile.getId()}/view`;

  const corpus = JSON.parse(payload.corpusJson);
  corpus.metadata = Object.assign({}, corpus.metadata || {}, {
    document_id: documentId,
    document_type: meta.document_type,
    title: meta.title,
    short_title: meta.short_title || meta.title,
    effective_start: meta.effective_start || '',
    effective_end: meta.effective_end || '',
    revision_date: meta.revision_date || '',
    ratified_effective: meta.ratified_effective || '',
    authority: meta.authority || authorityForType_(meta.document_type),
    affects: meta.affects || '',
    precedence_note: meta.precedence_note || '',
    pdf: pdfUrl,
    source_file_name: safeName,
    page_count: Number(meta.page_count || corpus.metadata.page_count || 0)
  });

  const corpusFile = documentFolder.createFile(
    Utilities.newBlob(JSON.stringify(corpus), 'application/json', `${documentId}.json`)
  );

  const user = currentUserEmail_();
  const now = new Date();
  const row = {
    document_id: documentId,
    document_type: meta.document_type,
    title: meta.title,
    short_title: meta.short_title || meta.title,
    effective_start: meta.effective_start || '',
    effective_end: meta.effective_end || '',
    revision_date: meta.revision_date || '',
    ratified_effective: meta.ratified_effective || '',
    status: 'DRAFT',
    authority: meta.authority || authorityForType_(meta.document_type),
    affects: meta.affects || '',
    precedence_note: meta.precedence_note || '',
    pdf_file_id: pdfFile.getId(),
    corpus_file_id: corpusFile.getId(),
    validation_status: validationStatus,
    validation_summary: JSON.stringify(validation),
    uploaded_at: now,
    uploaded_by: user,
    activated_at: '',
    archived_at: ''
  };
  appendRow_(row);

  return {
    document: publicRow_(row),
    shareWarning: shareWarning,
    compare: compareDocumentToActive_(documentId)
  };
}

function activateDocument(documentId) {
  assertAdmin_();
  const rows = getRows_();
  const target = rows.find(r => r.document_id === documentId);
  if (!target) throw new Error('Document not found.');
  if (String(target.validation_status).toUpperCase() === 'FAIL') {
    throw new Error('Activation blocked because validation failed. Correct the document or upload a new version.');
  }

  const now = new Date();
  if (target.document_type === 'cba' || target.document_type === 'personnel_rules') {
    rows.filter(r => r.document_type === target.document_type && r.status === 'ACTIVE' && r.document_id !== documentId)
      .forEach(r => updateRow_(r.document_id, {status:'ARCHIVED', archived_at: now}));
  }
  updateRow_(documentId, {status:'ACTIVE', activated_at: now, archived_at:''});
  publishSnapshots_();
  return getAdminState();
}

function archiveDocument(documentId) {
  assertAdmin_();
  const row = getRows_().find(r => r.document_id === documentId);
  if (!row) throw new Error('Document not found.');
  updateRow_(documentId, {status:'ARCHIVED', archived_at:new Date()});
  publishSnapshots_();
  return getAdminState();
}

function rollbackDocument(documentId) {
  assertAdmin_();
  const row = getRows_().find(r => r.document_id === documentId);
  if (!row) throw new Error('Document not found.');
  if (!['cba','personnel_rules'].includes(row.document_type)) throw new Error('Rollback is only for full CBA or Personnel Rules versions.');
  if (String(row.validation_status).toUpperCase() === 'FAIL') throw new Error('Cannot roll back to a version that failed validation.');
  return activateDocument(documentId);
}

function compareDocument(documentId) {
  assertAdmin_();
  return compareDocumentToActive_(documentId);
}

function republishSnapshots() {
  assertAdmin_();
  publishSnapshots_();
  return getAdminState();
}

function compareDocumentToActive_(documentId) {
  const rows = getRows_();
  const target = rows.find(r => r.document_id === documentId);
  if (!target) return null;
  const active = rows.find(r => r.document_type === target.document_type && r.status === 'ACTIVE' && r.document_id !== documentId);
  if (!active) return {message:'No active version of this document type exists yet.', added:[], removed:[], unchanged:0};
  const a = readCorpus_(active.corpus_file_id);
  const b = readCorpus_(target.corpus_file_id);
  const headingsA = new Set((a.records || []).map(r => normalizeHeading_(r.heading)).filter(Boolean));
  const headingsB = new Set((b.records || []).map(r => normalizeHeading_(r.heading)).filter(Boolean));
  const added = [...headingsB].filter(x => !headingsA.has(x)).slice(0,100);
  const removed = [...headingsA].filter(x => !headingsB.has(x)).slice(0,100);
  const unchanged = [...headingsB].filter(x => headingsA.has(x)).length;
  return {
    comparedTo: publicRow_(active),
    added: added,
    removed: removed,
    unchanged: unchanged,
    message: `${added.length} new headings, ${removed.length} removed headings, ${unchanged} unchanged headings detected.`
  };
}

function publishSnapshots_() {
  const setup = ensureSetup_();
  const rows = getRows_();
  const activeCba = latestActive_(rows, 'cba');
  const activePersonnel = latestActive_(rows, 'personnel_rules');
  const activeSupplements = rows.filter(r => r.document_type === 'supplement' && r.status === 'ACTIVE');

  if (activeCba) writePublishedJson_('cba_corpus.json', readCorpus_(activeCba.corpus_file_id), setup.publishedFolderId);
  if (activePersonnel) writePublishedJson_('personnel_corpus.json', readCorpus_(activePersonnel.corpus_file_id), setup.publishedFolderId);

  const supplementRecords = [];
  activeSupplements.forEach(row => {
    const corpus = readCorpus_(row.corpus_file_id);
    (corpus.records || []).forEach(record => {
      supplementRecords.push(Object.assign({}, record, {
        supplement_meta: {
          document_id: row.document_id,
          title: row.title,
          short_title: row.short_title,
          effective_start: serializeDate_(row.effective_start),
          effective_end: serializeDate_(row.effective_end),
          affects: row.affects,
          precedence_note: row.precedence_note,
          pdf: driveViewUrl_(row.pdf_file_id)
        }
      }));
    });
  });
  writePublishedJson_('supplements_corpus.json', {
    metadata:{short_title:'Active supplemental agreements', authority:'conditional'},
    records:supplementRecords
  }, setup.publishedFolderId);

  const sourceManifest = {
    generated_at: new Date().toISOString(),
    sources: [activeCba, activePersonnel].filter(Boolean).map(manifestSource_),
    supplements: activeSupplements.map(manifestSource_),
    precedence: [
      'Active amendment/MOU/side letter only when it expressly modifies or supplements the identified CBA provision',
      'Active AFSCME-City of Chicago CBA for represented employees',
      'Active City of Chicago Personnel Rules as a supplemental source; CBA controls conflicts'
    ],
    governance_note: 'Activation requires administrator review. Ask 2912 must identify the source version used and refer fact-specific workplace issues to a steward.'
  };
  writePublishedJson_('source_manifest.json', sourceManifest, setup.publishedFolderId);

  const archive = rows
    .filter(r => ['ACTIVE','ARCHIVED'].includes(r.status))
    .map(publicRow_)
    .sort((a,b) => String(b.activated_at || b.uploaded_at).localeCompare(String(a.activated_at || a.uploaded_at)));
  writePublishedJson_('source_archive.json', {items:archive}, setup.publishedFolderId);
}

function manifestSource_(row) {
  return {
    document_id: row.document_id,
    document_type: row.document_type,
    title: row.title,
    short_title: row.short_title,
    effective_start: serializeDate_(row.effective_start),
    effective_end: serializeDate_(row.effective_end),
    revision_date: serializeDate_(row.revision_date),
    ratified_effective: serializeDate_(row.ratified_effective),
    authority: row.authority,
    affects: row.affects,
    precedence_note: row.precedence_note,
    status: row.status,
    pdf: driveViewUrl_(row.pdf_file_id),
    validation_status: row.validation_status
  };
}

function writePublishedJson_(name, data, folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByName(name);
  while (files.hasNext()) files.next().setTrashed(true);
  folder.createFile(Utilities.newBlob(JSON.stringify(data), 'application/json', name));
}

function latestActive_(rows, type) {
  const matches = rows.filter(r => r.document_type === type && r.status === 'ACTIVE');
  matches.sort((a,b) => new Date(b.activated_at || b.uploaded_at).getTime() - new Date(a.activated_at || a.uploaded_at).getTime());
  return matches[0] || null;
}

function readCorpus_(fileId) {
  if (!fileId) return {metadata:{},records:[],index:[]};
  return JSON.parse(DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8'));
}

function appendRow_(obj) {
  const sheet = registrySheet_();
  sheet.appendRow(HEADERS.map(h => obj[h] !== undefined ? obj[h] : ''));
}

function updateRow_(documentId, patch) {
  const sheet = registrySheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('document_id');
  for (let i=1; i<values.length; i++) {
    if (String(values[i][idCol]) !== String(documentId)) continue;
    Object.keys(patch).forEach(key => {
      const col = headers.indexOf(key);
      if (col >= 0) sheet.getRange(i+1, col+1).setValue(patch[key]);
    });
    return;
  }
  throw new Error('Document row not found.');
}

function getRows_() {
  const sheet = registrySheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(r => r.some(v => v !== '')).map(row => {
    const out = {};
    headers.forEach((h,i) => out[h] = row[i]);
    return out;
  });
}

function publicRow_(row) {
  return {
    document_id: row.document_id,
    document_type: row.document_type,
    title: row.title,
    short_title: row.short_title,
    effective_start: serializeDate_(row.effective_start),
    effective_end: serializeDate_(row.effective_end),
    revision_date: serializeDate_(row.revision_date),
    ratified_effective: serializeDate_(row.ratified_effective),
    status: row.status,
    authority: row.authority,
    affects: row.affects,
    precedence_note: row.precedence_note,
    validation_status: row.validation_status,
    uploaded_at: serializeDateTime_(row.uploaded_at),
    activated_at: serializeDateTime_(row.activated_at),
    archived_at: serializeDateTime_(row.archived_at),
    pdf: row.pdf_file_id ? driveViewUrl_(row.pdf_file_id) : ''
  };
}

function registrySheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('REGISTRY_SHEET_ID');
  if (!id) throw new Error('Document admin has not been set up. Run setupDocumentAdmin() once from the Apps Script editor.');
  const ss = SpreadsheetApp.openById(id);
  const sheet = ss.getSheetByName(REGISTRY_SHEET_NAME);
  if (!sheet) throw new Error('Document Registry sheet is missing.');
  ensureHeaders_(sheet);
  return sheet;
}

function ensureSetup_() {
  const props = PropertiesService.getScriptProperties();
  const setup = {
    registrySheetId: props.getProperty('REGISTRY_SHEET_ID') || '',
    documentFolderId: props.getProperty('DOCUMENT_FOLDER_ID') || '',
    publishedFolderId: props.getProperty('PUBLISHED_FOLDER_ID') || ''
  };
  if (!setup.registrySheetId || !setup.documentFolderId || !setup.publishedFolderId) {
    throw new Error('Document admin is not initialized. Run setupDocumentAdmin() once from the Apps Script editor.');
  }
  return setup;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.appendRow(HEADERS);
    return;
  }
  const current = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  if (current.length === HEADERS.length && HEADERS.every((h,i) => current[i] === h)) return;
  throw new Error('Document Registry headers do not match the Stage 8 schema. The script will not clear or overwrite an existing registry automatically. Review/migrate the sheet manually.');
}

function authorityForType_(type) {
  if (type === 'cba') return 'primary';
  if (type === 'personnel_rules') return 'supplemental';
  return 'conditional';
}

function currentUserEmail_() {
  return Session.getActiveUser().getEmail() || '';
}

function assertAdmin_() {
  const props = PropertiesService.getScriptProperties();
  const allowed = String(props.getProperty('ADMIN_EMAILS') || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const email = currentUserEmail_().toLowerCase();
  if (!allowed.length || !email || !allowed.includes(email)) throw new Error('You are not authorized to administer Local 2912 source documents.');
}

function sanitizeFileName_(name) {
  return String(name || 'source.pdf').replace(/[\\/:*?"<>|]/g,'_').slice(0,180);
}
function driveViewUrl_(id) { return id ? `https://drive.google.com/file/d/${id}/view` : ''; }
function normalizeHeading_(value) { return String(value || '').toLowerCase().replace(/\s+/g,' ').trim(); }
function serializeDate_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return Utilities.formatDate(value, 'UTC', 'yyyy-MM-dd');
  return String(value);
}
function serializeDateTime_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value.toISOString();
  return String(value);
}
function safeJson_(value) {
  try { return typeof value === 'string' ? JSON.parse(value) : value; } catch (_) { return {raw:String(value || '')}; }
}
