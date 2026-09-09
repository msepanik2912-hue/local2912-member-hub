/**
 * AFSCME Local 2912 Member Hub - READ-ONLY document source feed
 * Stage 8
 *
 * Deploy separately from the restricted document admin project.
 * This project contains no write endpoint and no document-admin UI.
 */

const ALLOWED = {
  'cbaCorpus': 'cba_corpus.json',
  'personnelCorpus': 'personnel_corpus.json',
  'supplementsCorpus': 'supplements_corpus.json',
  'sourceManifest': 'source_manifest.json',
  'sourceArchive': 'source_archive.json'
};

function doGet(e) {
  const feed = String((e && e.parameter && e.parameter.feed) || 'sourceManifest');
  const name = ALLOWED[feed];
  if (!name) return json_({error:'Unknown feed.'});
  const folderId = PropertiesService.getScriptProperties().getProperty('PUBLISHED_FOLDER_ID');
  if (!folderId) return json_({error:'PUBLISHED_FOLDER_ID is not configured.'});
  const files = DriveApp.getFolderById(folderId).getFilesByName(name);
  if (!files.hasNext()) return json_({error:`${name} has not been published yet.`});
  const text = files.next().getBlob().getDataAsString('UTF-8');
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
