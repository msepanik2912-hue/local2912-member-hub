/**
 * AFSCME Local 2912 Member Hub — public read-only data endpoint.
 * Bind this script to a dedicated Google Sheet containing only information
 * approved for display in the member-facing app.
 *
 * IMPORTANT: Do not place grievance files, member case notes, medical data,
 * SSNs, internal steward notes, or other confidential information in this Sheet.
 */

function doGet(e) {
  var feed = String((e && e.parameter && e.parameter.feed) || 'health').toLowerCase();
  var payload;
  switch (feed) {
    case 'board': payload = {items: getPublishedRows_('Board')}; break;
    case 'stewards': payload = {items: getPublishedRows_('Stewards')}; break;
    case 'resources': payload = {items: getResourceGroups_()}; break;
    case 'announcements': payload = {items: getAnnouncements_()}; break;
    case 'events': payload = {items: getCalendarEvents_()}; break;
    case 'health': payload = {ok: true, service: 'Local 2912 Member Hub public data', generatedAt: new Date().toISOString()}; break;
    default: payload = {error: 'Unknown feed'};
  }
  payload.generatedAt = payload.generatedAt || new Date().toISOString();
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function getPublishedRows_(sheetName) {
  var rows = rowsAsObjects_(sheetName);
  return rows.filter(function(row) {
    return truthy_(row.Publish) && !falsey_(row.Active);
  }).sort(function(a, b) {
    return number_(a.Sort, 9999) - number_(b.Sort, 9999);
  }).map(function(row) {
    var fields = sheetName === 'Board'
      ? {Name:'name', Office:'office', Summary:'summary', Email:'email', Phone:'phone', PhotoUrl:'photoUrl', PhotoAlt:'photoAlt'}
      : {Department:'department', Name:'name', Role:'role', WorkLocation:'workLocation', Email:'email', Phone:'phone', Notes:'notes'};
    var output = {};
    Object.keys(fields).forEach(function(key) { output[fields[key]] = row[key]; });
    return removeBlank_(output);
  });
}

function getResourceGroups_() {
  var rows = rowsAsObjects_('Resources').filter(function(row) {
    return truthy_(row.Publish) && !falsey_(row.Active) && row.Label;
  }).sort(function(a,b) {
    var ga = String(a.Group || 'Resources');
    var gb = String(b.Group || 'Resources');
    if (ga !== gb) return ga.localeCompare(gb);
    return number_(a.Sort, 9999) - number_(b.Sort, 9999);
  });
  var map = {};
  rows.forEach(function(row) {
    var group = String(row.Group || 'Resources');
    if (!map[group]) map[group] = [];
    map[group].push(removeBlank_({label: row.Label, href: row.Href, description: row.Description}));
  });
  return Object.keys(map).map(function(group) { return {group: group, items: map[group]}; });
}

function getAnnouncements_() {
  var now = new Date();
  return rowsAsObjects_('Announcements').filter(function(row) {
    if (!truthy_(row.Publish) || falsey_(row.Active) || !row.Title) return false;
    var publish = date_(row.PublishDate);
    var expires = date_(row.Expires);
    if (publish && publish > now) return false;
    if (expires && expires < now) return false;
    return true;
  }).sort(function(a,b) {
    return (date_(b.PublishDate) || new Date(0)) - (date_(a.PublishDate) || new Date(0));
  }).map(function(row) {
    return removeBlank_({
      title: row.Title,
      summary: row.Summary,
      href: row.Href,
      linkLabel: row.LinkLabel,
      publishDate: iso_(row.PublishDate),
      expires: iso_(row.Expires)
    });
  });
}

function getCalendarEvents_() {
  var calendarId = getSetting_('Calendar ID');
  if (!calendarId) return [];
  var calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) return [];
  var daysAhead = number_(getSetting_('Calendar Days Ahead'), 180);
  var start = new Date();
  start.setHours(0,0,0,0);
  var end = new Date(start.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return calendar.getEvents(start, end).map(function(event) {
    return removeBlank_({
      id: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString(),
      allDay: event.isAllDayEvent(),
      location: event.getLocation(),
      description: event.getDescription()
    });
  });
}

function getSetting_(key) {
  var rows = rowsAsObjects_('Settings');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].Key || '').trim().toLowerCase() === String(key).trim().toLowerCase()) return rows[i].Value;
  }
  return '';
}

function rowsAsObjects_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(h) { return String(h).trim(); });
  return values.slice(1).filter(function(row) {
    return row.some(function(v) { return String(v).trim() !== ''; });
  }).map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) { if (header) obj[header] = row[i]; });
    return obj;
  });
}

function truthy_(value) {
  if (value === true) return true;
  return ['true','yes','y','1','publish','published'].indexOf(String(value || '').trim().toLowerCase()) >= 0;
}
function falsey_(value) {
  if (value === false) return true;
  return ['false','no','n','0','inactive'].indexOf(String(value || '').trim().toLowerCase()) >= 0;
}
function number_(value, fallback) {
  var n = Number(value);
  return isFinite(n) ? n : fallback;
}
function date_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value;
  var d = new Date(value);
  return isNaN(d) ? null : d;
}
function iso_(value) {
  var d = date_(value);
  return d ? d.toISOString() : '';
}
function removeBlank_(obj) {
  Object.keys(obj).forEach(function(key) {
    if (obj[key] === '' || obj[key] === null || typeof obj[key] === 'undefined') delete obj[key];
  });
  return obj;
}
