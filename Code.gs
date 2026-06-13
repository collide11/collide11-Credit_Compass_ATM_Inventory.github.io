// ============================================================
// ATM Card Inventory System — Google Apps Script Backend
// Preventive & Remedial Department
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Open Google Sheets → Extensions → Apps Script
// 2. Paste this entire file into Code.gs
// 3. Save → Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the Web App URL
// 5. Paste it into the app Settings → Script URL
// ============================================================

const SHEET_NAME = {
  CLIENTS:    'Clients',
  CARDS:      'Cards',
  PASSBOOKS:  'Passbooks',
  MOVEMENTS:  'Movements',
  AUDITS:     'Audits',
  INTERDEPT:  'InterdeptRequests',
  OFFCYCLE:   'OffcycleLogs',
  NOTES:      'Notes',
  USERS:      'Users',
  SETTINGS:   'Settings',
};

// ── MAIN ENTRY POINT ──────────────────────────────────────
function doGet(e) {
  return handleRequest(e);
}
function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    const body   = e.postData ? JSON.parse(e.postData.contents || '{}') : {};
    const action = params.action || body.action;
    const data   = body.data || {};

    let result;
    switch(action) {
      // CLIENTS
      case 'getClients':      result = getClients(); break;
      case 'addClient':       result = addClient(data); break;
      case 'updateClient':    result = updateClient(data.id, data); break;
      case 'deleteClient':    result = deleteClient(data.id); break;

      // CARDS
      case 'addCard':         result = addCard(data.clientId, data); break;
      case 'updateCard':      result = updateCard(data.clientId, data.cardId, data); break;
      case 'deleteCard':      result = deleteCard(data.clientId, data.cardId); break;

      // PASSBOOKS
      case 'addPassbook':     result = addPassbook(data.clientId, data); break;
      case 'updatePassbook':  result = updatePassbook(data.clientId, data.pbId, data); break;
      case 'deletePassbook':  result = deletePassbook(data.clientId, data.pbId); break;

      // MOVEMENTS
      case 'getMovements':    result = getMovements(); break;
      case 'addMovement':     result = addMovement(data); break;
      case 'updateMovement':  result = updateMovement(data.id, data); break;

      // AUDITS
      case 'getAudits':       result = getAudits(); break;
      case 'addAudit':        result = addAudit(data); break;

      // INTER-DEPT
      case 'getInterdept':    result = getInterdept(); break;
      case 'addInterdept':    result = addInterdept(data); break;
      case 'updateInterdept': result = updateInterdept(data.id, data); break;
      case 'deleteInterdept': result = deleteInterdept(data.id); break;

      // OFF-CYCLE LOGS
      case 'getOffcycleLogs': result = getOffcycleLogs(); break;
      case 'addOffcycleLog':  result = addOffcycleLog(data); break;

      // NOTES
      case 'getNotes':        result = getNotes(data.clientId); break;
      case 'addNote':         result = addNote(data.clientId, data); break;

      // USERS
      case 'getUsers':        result = getUsers(); break;
      case 'saveUsers':       result = saveUsers(data.users); break;

      // SETTINGS
      case 'getSettings':     result = getSettings(); break;
      case 'saveSettings':    result = saveSettings(data); break;

      // FULL DATA (dashboard load)
      case 'getAllData':       result = getAllData(); break;

      default:
        result = { error: 'Unknown action: ' + action };
    }

    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ error: err.message, stack: err.stack });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SHEET HELPERS ──────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add header row based on sheet type
    const headers = HEADERS[name] || ['id','data','createdAt'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

const HEADERS = {
  Clients: ['id','clientId','lastName','firstName','middleName','gender','birthdate','age','spouse','address',
            'bankName','bankAccountNo','cardNo','passbookNo','expiration','withdrawalDate','atmPin',
            'pensionType','pensionAmount','office','contingencyStatus','contingencyDate',
            'tag','problemCode','collectionStatus','createdAt','updatedAt'],
  Cards: ['id','clientId','bank','cardNo','accountNo','expiration','pin','slot','box','location','flag','addedDate','updatedAt'],
  Passbooks: ['id','clientId','passBookNo','slot','box','location','addedDate','updatedAt'],
  Movements: ['id','clientId','clientName','action','itemId','itemType','slot','box',
              'fromLocation','toLocation','staff','requestedBy','dept','office',
              'remarks','cycle','withdrawalAmount','date','time',
              'lastEditedBy','lastEditedAt','editHistory','createdAt'],
  Audits: ['id','cycle','month','year','boxes','auditedBy','totalWithdrawal','createdAt'],
  InterdeptRequests: ['id','type','clientId','clientName','itemType','slot','box',
                      'requestedBy','dept','office','date','dueBack','staff',
                      'purpose','remarks','status','createdAt'],
  OffcycleLogs: ['id','staff','initials','date','time','reason','createdAt'],
  Notes: ['id','clientId','text','author','initials','createdAt'],
  Users: ['id','name','initials','role','type','pin','password'],
  Settings: ['key','value'],
};

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Parse JSON fields
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      obj[h] = val === '' ? null : val;
    });
    return obj;
  }).filter(obj => obj.id); // skip empty rows
}

function objectToRow(headers, obj) {
  return headers.map(h => {
    const val = obj[h];
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  });
}

function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-based
  }
  return -1;
}

function generateId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
}

// ── CLIENTS ────────────────────────────────────────────────
function getClients() {
  const clients = sheetToObjects(getSheet(SHEET_NAME.CLIENTS));
  const cards   = sheetToObjects(getSheet(SHEET_NAME.CARDS));
  const pbs     = sheetToObjects(getSheet(SHEET_NAME.PASSBOOKS));
  // Attach cards and passbooks to each client
  return clients.map(c => ({
    ...c,
    cards: cards.filter(k => k.clientId === c.id),
    passbooks: pbs.filter(p => p.clientId === c.id),
  }));
}

function addClient(data) {
  const sheet = getSheet(SHEET_NAME.CLIENTS);
  data.id = generateId('cl');
  data.createdAt = new Date().toISOString();
  data.updatedAt = data.createdAt;
  const headers = HEADERS[SHEET_NAME.CLIENTS];
  sheet.appendRow(objectToRow(headers, data));
  return { success: true, id: data.id };
}

function updateClient(id, data) {
  const sheet = getSheet(SHEET_NAME.CLIENTS);
  const rowNum = findRowById(sheet, id);
  if (rowNum < 0) return { error: 'Client not found' };
  data.updatedAt = new Date().toISOString();
  const headers = HEADERS[SHEET_NAME.CLIENTS];
  const existing = sheetToObjects(sheet).find(c => c.id === id) || {};
  const merged = { ...existing, ...data, id };
  sheet.getRange(rowNum, 1, 1, headers.length).setValues([objectToRow(headers, merged)]);
  return { success: true };
}

function deleteClient(id) {
  // Delete client row
  const sheet = getSheet(SHEET_NAME.CLIENTS);
  const rowNum = findRowById(sheet, id);
  if (rowNum > 0) sheet.deleteRow(rowNum);
  // Delete associated cards
  const cardSheet = getSheet(SHEET_NAME.CARDS);
  deleteRowsWhere(cardSheet, 'clientId', id);
  // Delete associated passbooks
  const pbSheet = getSheet(SHEET_NAME.PASSBOOKS);
  deleteRowsWhere(pbSheet, 'clientId', id);
  return { success: true };
}

function deleteRowsWhere(sheet, field, value) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const fieldIdx = headers.indexOf(field);
  if (fieldIdx < 0) return;
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][fieldIdx]) === String(value)) {
      sheet.deleteRow(i + 1);
    }
  }
}

// ── CARDS ──────────────────────────────────────────────────
function addCard(clientId, data) {
  const sheet = getSheet(SHEET_NAME.CARDS);
  data.id = generateId('card');
  data.clientId = clientId;
  data.addedDate = new Date().toISOString().split('T')[0];
  data.updatedAt = new Date().toISOString();
  sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.CARDS], data));
  return { success: true, id: data.id };
}

function updateCard(clientId, cardId, data) {
  const sheet = getSheet(SHEET_NAME.CARDS);
  const rowNum = findRowById(sheet, cardId);
  if (rowNum < 0) return { error: 'Card not found' };
  data.updatedAt = new Date().toISOString();
  const existing = sheetToObjects(sheet).find(c => c.id === cardId) || {};
  const merged = { ...existing, ...data, id: cardId, clientId };
  sheet.getRange(rowNum, 1, 1, HEADERS[SHEET_NAME.CARDS].length)
       .setValues([objectToRow(HEADERS[SHEET_NAME.CARDS], merged)]);
  return { success: true };
}

function deleteCard(clientId, cardId) {
  const sheet = getSheet(SHEET_NAME.CARDS);
  const rowNum = findRowById(sheet, cardId);
  if (rowNum > 0) sheet.deleteRow(rowNum);
  return { success: true };
}

// ── PASSBOOKS ──────────────────────────────────────────────
function addPassbook(clientId, data) {
  const sheet = getSheet(SHEET_NAME.PASSBOOKS);
  data.id = generateId('pb');
  data.clientId = clientId;
  data.addedDate = new Date().toISOString().split('T')[0];
  data.updatedAt = new Date().toISOString();
  sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.PASSBOOKS], data));
  return { success: true, id: data.id };
}

function updatePassbook(clientId, pbId, data) {
  const sheet = getSheet(SHEET_NAME.PASSBOOKS);
  const rowNum = findRowById(sheet, pbId);
  if (rowNum < 0) return { error: 'Passbook not found' };
  data.updatedAt = new Date().toISOString();
  const existing = sheetToObjects(sheet).find(p => p.id === pbId) || {};
  const merged = { ...existing, ...data, id: pbId, clientId };
  sheet.getRange(rowNum, 1, 1, HEADERS[SHEET_NAME.PASSBOOKS].length)
       .setValues([objectToRow(HEADERS[SHEET_NAME.PASSBOOKS], merged)]);
  return { success: true };
}

function deletePassbook(clientId, pbId) {
  const sheet = getSheet(SHEET_NAME.PASSBOOKS);
  const rowNum = findRowById(sheet, pbId);
  if (rowNum > 0) sheet.deleteRow(rowNum);
  return { success: true };
}

// ── MOVEMENTS ──────────────────────────────────────────────
function getMovements() {
  return sheetToObjects(getSheet(SHEET_NAME.MOVEMENTS));
}

function addMovement(data) {
  const sheet = getSheet(SHEET_NAME.MOVEMENTS);
  data.id = generateId('mov');
  data.createdAt = new Date().toISOString();
  sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.MOVEMENTS], data));
  // Update item location
  if (data.clientId && data.itemId && data.itemType) {
    if (data.itemType === 'ATM Card') updateCard(data.clientId, data.itemId, { location: data.toLocation });
    else updatePassbook(data.clientId, data.itemId, { location: data.toLocation });
  }
  return { success: true, id: data.id };
}

function updateMovement(id, data) {
  const sheet = getSheet(SHEET_NAME.MOVEMENTS);
  const rowNum = findRowById(sheet, id);
  if (rowNum < 0) return { error: 'Movement not found' };
  const existing = sheetToObjects(sheet).find(m => m.id === id) || {};
  const merged = { ...existing, ...data, id };
  sheet.getRange(rowNum, 1, 1, HEADERS[SHEET_NAME.MOVEMENTS].length)
       .setValues([objectToRow(HEADERS[SHEET_NAME.MOVEMENTS], merged)]);
  return { success: true };
}

// ── AUDITS ─────────────────────────────────────────────────
function getAudits() {
  return sheetToObjects(getSheet(SHEET_NAME.AUDITS));
}

function addAudit(data) {
  const sheet = getSheet(SHEET_NAME.AUDITS);
  data.id = generateId('aud');
  data.createdAt = new Date().toISOString();
  sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.AUDITS], data));
  return { success: true, id: data.id };
}

// ── INTER-DEPT ─────────────────────────────────────────────
function getInterdept() {
  return sheetToObjects(getSheet(SHEET_NAME.INTERDEPT));
}

function addInterdept(data) {
  const sheet = getSheet(SHEET_NAME.INTERDEPT);
  const existing = sheetToObjects(sheet);
  data.id = 'IDR-' + String(existing.length + 1).padStart(4, '0');
  data.createdAt = new Date().toISOString();
  sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.INTERDEPT], data));
  return { success: true, id: data.id };
}

function updateInterdept(id, data) {
  const sheet = getSheet(SHEET_NAME.INTERDEPT);
  const rowNum = findRowById(sheet, id);
  if (rowNum < 0) return { error: 'Request not found' };
  const existing = sheetToObjects(sheet).find(r => r.id === id) || {};
  const merged = { ...existing, ...data, id };
  sheet.getRange(rowNum, 1, 1, HEADERS[SHEET_NAME.INTERDEPT].length)
       .setValues([objectToRow(HEADERS[SHEET_NAME.INTERDEPT], merged)]);
  return { success: true };
}

function deleteInterdept(id) {
  const sheet = getSheet(SHEET_NAME.INTERDEPT);
  const rowNum = findRowById(sheet, id);
  if (rowNum > 0) sheet.deleteRow(rowNum);
  return { success: true };
}

// ── OFF-CYCLE LOGS ─────────────────────────────────────────
function getOffcycleLogs() {
  return sheetToObjects(getSheet(SHEET_NAME.OFFCYCLE));
}

function addOffcycleLog(data) {
  const sheet = getSheet(SHEET_NAME.OFFCYCLE);
  data.id = generateId('oc');
  data.createdAt = new Date().toISOString();
  sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.OFFCYCLE], data));
  return { success: true };
}

// ── NOTES ──────────────────────────────────────────────────
function getNotes(clientId) {
  const all = sheetToObjects(getSheet(SHEET_NAME.NOTES));
  return all.filter(n => n.clientId === clientId);
}

function addNote(clientId, data) {
  const sheet = getSheet(SHEET_NAME.NOTES);
  data.id = generateId('note');
  data.clientId = clientId;
  data.createdAt = new Date().toISOString();
  sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.NOTES], data));
  return { success: true, id: data.id };
}

// ── USERS ──────────────────────────────────────────────────
function getUsers() {
  const sheet = getSheet(SHEET_NAME.USERS);
  const users = sheetToObjects(sheet);
  if (users.length === 0) {
    // Seed default users on first run
    const defaults = [
      {id:'u1',name:'Maria Lopez',initials:'ML',role:'Admin',type:'admin',pin:'1234',password:'1234'},
      {id:'u2',name:'Jose Ramos',initials:'JR',role:'Admin',type:'admin',pin:'1234',password:'1234'},
      {id:'u3',name:'R. Santos',initials:'RS',role:'Staff',type:'staff',pin:'1234',password:'1234'},
      {id:'u4',name:'L. Cruz',initials:'LC',role:'Staff',type:'staff',pin:'1234',password:'1234'},
      {id:'u5',name:'M. Diaz',initials:'MD',role:'Staff',type:'staff',pin:'1234',password:'1234'},
      {id:'u6',name:'B. Reyes',initials:'BR',role:'Staff',type:'staff',pin:'1234',password:'1234'},
    ];
    defaults.forEach(u => sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.USERS], u)));
    return defaults;
  }
  return users;
}

function saveUsers(users) {
  const sheet = getSheet(SHEET_NAME.USERS);
  // Clear all data rows and rewrite
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  users.forEach(u => sheet.appendRow(objectToRow(HEADERS[SHEET_NAME.USERS], u)));
  return { success: true };
}

// ── SETTINGS ───────────────────────────────────────────────
function getSettings() {
  const sheet = getSheet(SHEET_NAME.SETTINGS);
  const rows = sheetToObjects(sheet);
  if (rows.length === 0) {
    const defaults = {
      tags: ['Deceased 1st','Deceased 16th','Blacklisted','Trouble Rogue','TR3','GSIS','Unahan','Error','New/Old','Inactive'],
      branches: ['Trouble Rouge','TR3','Makati Office'],
      accountTypes: ['Savings','Current','Payroll','GSIS','SSS'],
      pensionTypes: ['SSS','GSIS','SSS + GSIS','Other'],
      banks: ['BDO Unibank','BPI','Metrobank','UnionBank','Security Bank','Landbank','DBP','Other'],
    };
    saveSettings(defaults);
    return defaults;
  }
  const result = {};
  rows.forEach(r => {
    try { result[r.key] = JSON.parse(r.value); } catch(e) { result[r.key] = r.value; }
  });
  return result;
}

function saveSettings(data) {
  const sheet = getSheet(SHEET_NAME.SETTINGS);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  Object.entries(data).forEach(([key, value]) => {
    sheet.appendRow([key, JSON.stringify(value)]);
  });
  return { success: true };
}

// ── GET ALL DATA (single load) ─────────────────────────────
function getAllData() {
  return {
    clients:     getClients(),
    movements:   getMovements(),
    audits:      getAudits(),
    interdept:   getInterdept(),
    offcycleLogs: getOffcycleLogs(),
    users:       getUsers(),
    settings:    getSettings(),
  };
}
