var channelName = 'hogechannel' //コマンドを使用するチャンネル名。適宜編集してください。

var token = PropertiesService.getScriptProperties().getProperty('OAuth_token');
var slackApp = SlackApp.create(token);

function doPost(e) {
  //GASのプロパティストアに登録したVerification Token
  var verified_token = PropertiesService.getScriptProperties().getProperty('verified_token');
  var verificationToken = e.parameter.token || JSON.parse(e.parameter.payload).token || null;
  if (verificationToken !== verified_token) { // AppのVerification
    console.log(e);
    return ContentService.createTextOutput();
  }
  
  if (e.parameter.command === '/bihin' && e.parameter.channel_name !== channelName) {
    console.log(e);
    //response_typeをephemeralにすることで実行ユーザーにだけ通知される。
    var rtnjson = {"response_type": "ephemeral","text": "/bihinコマンドは備品管理チャンネルでのみ使用可能です"};
    return ContentService.createTextOutput(JSON.stringify(rtnjson)).setMimeType(ContentService.MimeType.JSON);
  } else if (e.parameter.command === '/bihin') {
    var createdDialog = createDialog(e);
    var options = {
    'method' : 'POST',
    'payload' : createdDialog,
    };
    var slackUrl = "https://slack.com/api/dialog.open";
    var response = UrlFetchApp.fetch(slackUrl, options);
    return ContentService.createTextOutput();
  } else {
    var p = JSON.parse(e.parameter.payload)
    var postChannel = p.channel.id;
    var s = p.submission;
    var free = s.freeText || "なし" 
    slackApp.postMessage(postChannel,
                         "購入依頼by <@" + p.user.id + ">\n【購入品名】　：" + s.name
                         +"\n【購入URL】　：" + s.url +"\n【購入承諾者】：" + s.approver 
                         + "\n【納品希望日】：" + s.date  +"\n【備考】　　　：" + free,
                         {"username" : "備品依頼bot", "icon_emoji" : ":hammer_and_wrench:"});
    return ContentService.createTextOutput();//←これが無いとslackのダイアログが閉じない。
  }
}

function createDialog(e){
  var trigger_id = e.parameter.trigger_id;
  var token = PropertiesService.getScriptProperties().getProperty('OAuth_token');
  var dialog = {
    "token": token, // OAuth_token
    "trigger_id": trigger_id,
    "dialog": JSON.stringify({
      "callback_id": "irai_dialog",
      "title": "備品購入依頼依頼フォーム",
      "submit_label": "依頼する",
      "elements": [
        {
          "type": "text",
          "label": "品名",
          "name": "name"
        },
        {
          "type": "text",
          "subtype": "url",
          "label": "購入希望品URL",
          "name": "url",
        },
        {
          "type": "select",
          "label": "購入承諾者(上長)",
          "name": "approver",
          "options": [
            {
              "label": "A部長",
              "value": "A部長"
            },
            {
              "label": "B課長",
              "value": "B課長"
            }]
        },
        {
          "type": "text",
          "label": "納品希望日(※希望日無ければ↓は編集しなくてokです)",
          "name": "date",
          "value": "2019/XX/XX"
        },
        {
          "type": "textarea",
          "label": "備考欄",
          "name": "freeText",
          "optional": true, //この指定がないとrequiredになる
          "placeholder": "備考欄のみ入力必須ではありません"
        },
      ]
    })
  };
  return dialog;
}