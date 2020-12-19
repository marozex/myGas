↓↓環境に合わせてチャンネルID,スプレッドシートのID,シート名を編集する
var channelId = 'ABCDEFGHIJK' //勤怠報告をするチャンネルのID
var sheet = SpreadsheetApp.openById(""); //https://docs.google.com/spreadsheets/d/hogehoge/ のhogehogeの部分がID
var table = sheet.getSheetByName("シート1"); //名簿を記録するシート
↑↑適宜編集ここまで

var rowNum = table.getLastRow();
var range = table.getRange("A1:B" + rowNum + 1);
var value = range.getValues();
var token = PropertiesService.getScriptProperties().getProperty('OAuth_token');

function doPost(e){
  var verified_token = PropertiesService.getScriptProperties().getProperty('verified_token');
  //スラッシュコマンド経由はe.parameter.token,メンションを検知したbot経由はJSON.parse(e.postData.getDataAsString()).token
  var verificationToken = e.parameter.token || JSON.parse(e.postData.getDataAsString()).token || null;
  if (verificationToken !== verified_token) {
    console.log(e);
    return ContentService.createTextOutput();
  }

  if (e.parameter.command === '/list' && e.parameter.channel_id !== channelId) {
    console.log(e);
    var obj = {
      //ephemeralで実行ユーザーにだけ通知される。
      response_type: 'ephemeral',
      text: '勤怠出力は<#' + channelId + '>で行って下さい'
    };
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  } else if (e.parameter.command === '/list'){
    this.postAttendanceList(e)
    return ContentService.createTextOutput();
  } else {
    this.updateStatus(e)
  }
}

function postAttendanceList(e){
  var beforeLunch = ''
  var onLunch = ''
  var afterLunch = ''
  var goHome = ''
  value.forEach(v => {
    var attendId = v[0]
    var attendStatus = v[1]
    if (attendStatus === '出勤済み') {
      beforeLunch += ' ' + attendId
    } else if (attendStatus === 'お昼休み') {
      onLunch += ' ' + attendId
    } else if (attendStatus === '昼終了済') {
      afterLunch += ' ' + attendId
    } else if (attendStatus === '帰宅済み') {
      goHome += ' ' + attendId
    }
  })
  
  var msg = '【出勤済み】\n' + beforeLunch + '\n'
  + '【お昼休み】\n' + onLunch+ '\n'
  + '【昼終了済】\n' + afterLunch + '\n'
  + '【帰宅済み】\n' + goHome;

  var id = e.parameter.user_id;
  var payload = {
    token : token,
    channel : channelId,
    user: id,
    text: msg
  };
  var params = {
    method : 'post',
    payload : payload
  };
  var url = "https://slack.com/api/chat.postEphemeral"
  var response = UrlFetchApp.fetch(url, params)
}

function updateStatus(e){
  var status = '';
  var text = JSON.parse(e.postData.getDataAsString()).event.text;
  var targetId = text.match(/<.*?>/).pop();
  if (text.includes('出勤')) {
    status = '出勤済み';
  } else if (text.includes('昼休憩入ります')){
    status = 'お昼休み';
  } else if (text.includes('昼休憩終了')){
    status = '昼終了済';
  } else if (text.includes('退勤')){
    status = '帰宅済み';
  } else {
    return;
  }
  
  tmp = []
  value.forEach(v => tmp.push(v[0]))
  var index = tmp.findIndex(e => e === targetId)
  if (index < 0) {
    table.getRange(rowNum + 1,1).setValue(targetId)
    table.getRange(rowNum + 1,2).setValue(status)
  } else {
    table.getRange(index + 1,2).setValue(status)
  }
}
