function getSheet_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name + '. Run setupCampaignSystem().');
  return sheet;
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

function getRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];
  const headers = getHeaders_(sheet);
  return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues().map(values => {
    const row = {};
    headers.forEach((h, i) => row[h] = values[i]);
    return row;
  });
}

function appendObject_(sheet, object) {
  const headers = getHeaders_(sheet);
  sheet.appendRow(headers.map(h => object[h] === undefined ? '' : object[h]));
}

function findRow_(sheet, field, value) {
  const headers = getHeaders_(sheet);
  const index = headers.indexOf(field);
  if (index < 0) return null;
  const values = sheet.getRange(2, index + 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < values.length; i++) if (String(values[i][0]) === String(value)) return { row: i + 2 };
  return null;
}

function setField_(headers, values, field, value) {
  const index = headers.indexOf(field);
  if (index >= 0) values[index] = value;
}

function getField_(headers, values, field) {
  const index = headers.indexOf(field);
  return index >= 0 ? values[index] : '';
}

