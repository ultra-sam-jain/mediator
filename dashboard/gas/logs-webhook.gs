/**
 * Deploy as web app (Execute as: Me, Who has access: Anyone).
 * Set LOGS_GAS_URL in Vercel to this deployment URL.
 * Spreadsheet must have a "Logs" sheet with headers in row 1:
 * id | timestamp | source | name | phone | project | budget | status | raw_payload | forward_error
 */
const LOG_SHEET = 'Logs';

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(LOG_SHEET);
  if (!sheet) throw new Error('Missing Logs sheet');

  if (body.action === 'append') {
    const lead = body.lead;
    sheet.appendRow([
      lead.id,
      lead.timestamp,
      lead.source,
      lead.name,
      lead.phone,
      lead.project,
      lead.budget,
      lead.status,
      lead.raw_payload,
      lead.forward_error || '',
    ]);
    return jsonResponse({ ok: true });
  }

  if (body.action === 'updateStatus') {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === body.id) {
        sheet.getRange(i + 1, 8).setValue(body.status);
        sheet.getRange(i + 1, 10).setValue(body.forward_error || '');
        break;
      }
    }
    return jsonResponse({ ok: true });
  }

  if (body.action === 'list') {
    const filters = body.filters || {};
    const data = sheet.getDataRange().getValues();
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      const row = rowFromSheet(data[i]);
      if (filters.source && row.source !== filters.source) continue;
      if (filters.status && row.status !== filters.status) continue;
      if (filters.search) {
        const q = String(filters.search).toLowerCase();
        const hay = (row.name + ' ' + row.phone).toLowerCase();
        if (hay.indexOf(q) === -1) continue;
      }
      rows.push(row);
    }
    rows.reverse();
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, filters.limit || 50);
    const start = (page - 1) * limit;
    return jsonResponse({ rows: rows.slice(start, start + limit), total: rows.length });
  }

  if (body.action === 'stats') {
    const data = sheet.getDataRange().getValues();
    const stats = { total: 0, success: 0, failed: 0, pending: 0, bySource: {} };
    for (let i = 1; i < data.length; i++) {
      const status = data[i][7];
      const source = data[i][2];
      stats.total++;
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
      if (status === 'SUCCESS') stats.success++;
      else if (status === 'FAILED') stats.failed++;
      else stats.pending++;
    }
    return jsonResponse(stats);
  }

  return jsonResponse({ error: 'Unknown action' });
}

function rowFromSheet(cells) {
  return {
    id: cells[0],
    timestamp: cells[1],
    source: cells[2],
    name: cells[3],
    phone: cells[4],
    project: cells[5],
    budget: cells[6],
    status: cells[7],
    raw_payload: cells[8],
    forward_error: cells[9] || undefined,
    email: '',
    propertyType: '',
    intent: '',
  };
}
