function getRemoData() {
  var url = 'https://api.nature.global/1/devices';
  var token = PropertiesService.getScriptProperties().getProperty('nature_remo_access_token');
  var headers = {
    "Authorization": 'Bearer ' + token
  }
  var options = {
    "headers": headers
  }
  // GETリクエスト
  var response = UrlFetchApp.fetch(url, options);
  var content = response.getContentText("UTF-8");
  var res_data = JSON.parse(content)[0].newest_events;
  //Logger.log(res_data);
  setData({
    temperature: res_data['te'].val,
    humidity: res_data['hu'].val,
    llluminance: res_data['il'].val,
    human_sensor: res_data['mo'].val
  });
}

//現在の時刻を取得する関数
function getNowDate() {
  var d = new Date();
  return String(Utilities.formatDate(d, 'JST', 'yyyy-MM-dd HH:mm'));
}

//スプレッドシートに書き込む関数
function setData(data) {
  var spreadsheet_id = PropertiesService.getScriptProperties().getProperty('spreadsheet_id');
  var spreadsheet = SpreadsheetApp.openById(spreadsheet_id);
  var sheet = spreadsheet.getSheetByName('natureRemo');
  var last_row = sheet.getLastRow() + 1;

  sheet.getRange(last_row, 1).setValue(getNowDate());
  sheet.getRange(last_row, 2).setValue(data.temperature);
  sheet.getRange(last_row, 3).setValue(data.humidity);
  sheet.getRange(last_row, 4).setValue(data.llluminance);
  sheet.getRange(last_row, 5).setValue(data.human_sensor);
}