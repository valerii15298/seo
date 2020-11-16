const customtoken = 'valerii15298';
const portAppServer = '8080';
const ipAppServer = '157.230.221.83';
const statusCell = 'D2';
const urlCellRange = 'A2';
const clickySiteIdRange = 'B2';
const clickySiteKeyRange = 'C2';

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}

function setStatus(status){
  SpreadsheetApp.getActiveSheet().getRange(statusCell).setValue(status);
}

function updateData(url, clickySiteId, clickySiteKey) {
  const apiEndpoint = `http://${ipAppServer}:${portAppServer}?customtoken=${customtoken}&url=${url}&spreadSheetId=${SpreadsheetApp.getActiveSpreadsheet().getId()}&clickySiteId=${clickySiteId}&clickySiteKey=${clickySiteKey}`;
  const response = UrlFetchApp.fetch(apiEndpoint);
  if (response.getResponseCode() !== 200) {
    return setStatus('Error with response(most likely error on appServer)!');
  }
  const respText = response.getContentText();
  setStatus(respText);
  return respText;
}

function test(){
  const url = SpreadsheetApp.getActiveSheet().getRange(urlCellRange).getValue();
  const clickySiteId = SpreadsheetApp.getActiveSheet().getRange(clickySiteIdRange).getValue();
  const clickySiteKey = SpreadsheetApp.getActiveSheet().getRange(clickySiteKeyRange).getValue();
  if (validURL(url)) {
    setStatus(`Started: ${url}`);
    const status = updateData(url, clickySiteId, clickySiteKey);
    setStatus(`${status} - ${url}`);
  } else
    setStatus('Wrong URL!');
}
