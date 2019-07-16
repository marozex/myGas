var channelId = "HOGEHOGE";  //この値のみ書き換えて使用して下さい。

//1.平日毎朝8時〜９時のトリガーでsetGomiTrigger()を呼ぶ
//2.朝9:40分にsendGomiMsgWithButtonが呼ばれるトリガーが作られる
//2-2.11:30にsendGomieminderが呼ばれるトリガーが作られる
//3.作業完了選択時にdeleteGomiTrigger()で2-1.の9:40のトリガー&2-2.のトリガーを削除する

var token = PropertiesService.getScriptProperties().getProperty('OAuth_token');
var slackapp = SlackApp.create(token);
var message = "ゴミ捨て当番【燃えるゴミ・燃えないゴミ・ペットボトル・缶・ダンボール】お願いします。";
var scriptProperties = PropertiesService.getScriptProperties();

function setGomiTrigger() {
  var triggerDay = new Date();
  //日本の祝日を取得する
  var calendarId = "ja.japanese#holiday@group.v.calendar.google.com";
  var calendar = CalendarApp.getCalendarById(calendarId);
  var todayEvents = calendar.getEventsForDay(triggerDay);
  if(todayEvents.length === 0){
    triggerDay.setHours(9);
    triggerDay.setMinutes(40);
    ScriptApp.newTrigger("sendGomiMsgWithButton").timeBased().at(triggerDay).create();
    triggerDay.setHours(11);
    triggerDay.setMinutes(30);
    ScriptApp.newTrigger("sendGomiReminder").timeBased().at(triggerDay).create();
  }
}

// その日のトリガーを削除する関数(消さないと残る)
function deleteGomiTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendGomiMsgWithButton"
        || triggers[i].getHandlerFunction() === "sendGomiReminder") {
        try {
          ScriptApp.deleteTrigger(triggers[i]);
        } catch (e) {
          Logger.log(e);
        }
    }
  }
}

function selectRandomUser() {
  var membersList = slackapp.channelsInfo(channelId).channel.members;
  
   // 最新の当選者を取り除く。
  var latest = scriptProperties.getProperty('selected_user_id');
   
  if (membersList.indexOf(latest) > -1){
    membersList = membersList.filter(function(list){
      return list !== latest;
    })
  }
  
  var selected = membersList[Math.floor(Math.random() * membersList.length)];
  scriptProperties.setProperty('selected_user_id', selected);
  return selected;
}

function sendGomiMsgWithButton() {
  var targetUser = selectRandomUser();

  var result = slackapp.postMessage(channelId, "<@" + targetUser + ">" + message, {
    attachments : JSON.stringify(
    [
      {
        "text": "完了後は下記のボタンを押して下さい（ボタンのダブルクリックNG）\n ※ *ダンボール* 捨てるの忘れずに！",
        "fallback": "not support attachments or interactive messages",
        "callback_id": "ButtonResponse",
        "color": "#3AA3E3",
        "actions": [
          {
             "name": "button",
             "text": "ゴミ捨て完了しました",
             "style": "primary",
             "type": "button",
             "value": "finish"
          },
          {
              "name": "button",
              "text": "再抽選ダイアログを開く",
              "style": "danger",
              "type": "button",
              "value": "open_reason_dialog"
          }
        ]
      }
    ]
    )
  });
  scriptProperties.setProperty('message_ts', result.ts);  //基準となる投稿のタイムスタンプを保持しておく

  return result;
}

function sendGomiReminder() {
  var latest = scriptProperties.getProperty('selected_user_id');
  slackapp.postMessage(channelId, "<@" + latest + ">ゴミ捨てリマインド通知");
}

function doPost(e) {
  var p = JSON.parse(e.parameter.payload);
  
  //app経由でのアクセス以外は弾く
  var verified_token = scriptProperties.getProperty('verified_token'); //GASのプロパティストアに登録したVerification Token
  var verificationToken = p.token ? p.token : null;
  if (verificationToken !== verified_token) { // AppのVerification
    console.log(e);
    return ContentService.createTextOutput();
  }

  var text = "";
  var unix_ts = Moment.moment.unix(p.action_ts).format("MM月DD日HH:mm ddd"); //ボタン操作した時刻のタイムスタンプ
  if (p.actions && p.actions[0].value === "finish"){
    text =  p.user.name + "さん、ゴミ捨てありがとうございました (" + unix_ts + ")";
    update(text);
    deleteGomiTrigger();
  } else if (p.actions && p.actions[0].value === "open_reason_dialog") {
    var org_msg = p.original_message.text.replace(message, '');
    var alt_text = "再抽選実行 by " + p.user.name +"." + unix_ts + "(元の当選者：" + org_msg + ")";
    var createdDialog = createDialog(p, alt_text);
    var options = {
      "method" : "POST",
      "payload" : createdDialog
    };
    var slackUrl = "https://slack.com/api/dialog.open";
    var response = UrlFetchApp.fetch(slackUrl, options);
    return ContentService.createTextOutput();
  } else if (p.callback_id === 'redo_dialog') {
    text = p.state + "\n理由：" + p.submission.redo_dialog_input;
    update(text);
    sendGomiMsgWithButton();
  }
  
  return ContentService.createTextOutput();
}

function update(text){
  var options = {
    "method" : "POST",
    "payload" : {
      "token": token,
      "channel": channelId,
      "text": text,
      "ts": scriptProperties.getProperty('message_ts'),
      "attachments": [] //空配列で上書きしないと元の投稿のattachmentsが残ってしまう
    }
  };
  var slackUrl = "https://slack.com/api/chat.update";
  var response = UrlFetchApp.fetch(slackUrl, options);
  return ContentService.createTextOutput();
}

function createDialog(p, alt_text){
  var trigger_id = p.trigger_id;
  var dialog = {
    "token": token, // OAuth_token
    "trigger_id": trigger_id,
    "dialog": JSON.stringify({
      "callback_id": "redo_dialog",
      "title": "再抽選ダイアログ",
      "submit_label": "再抽選実施",
      "state": alt_text,
      "elements": [
        {
          "type": "text",
          "label": "再抽選を実施する理由",
          "name": "redo_dialog_input",
          "placeholder": "例 〇〇さん休みのため"
        }
      ]
    })
  };
  return dialog;
}
