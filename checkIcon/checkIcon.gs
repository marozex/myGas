// 使用するライブラリは下記
// Slackapp  M3W5Ut3Q39AaIwLquryEPMwV62A3znfOO

// ↓チャンネルIDを編集してご利用ください。
// 対象のチャンネルに、アイコン設定してください〜の文言が投稿されます。
var channelId = 'HOGEHOGE';

// プロジェクトのプロパティ＞スクリプトのプロパティにtokenを設定してください。

function checkDefaultIconUsers() {
    var token = PropertiesService.getScriptProperties().getProperty('OAuth_token');
    var slackapp = SlackApp.create(token);
    var membersList = slackapp.usersList().members;
    var defaultIconUsers = []

    membersList.forEach(function(m) {
        // is_restricted 以外にすることで multi-channel guest を除外
        // is_ultra_restricted 以外にすることで single channel guest を除外
        // 詳細は https://api.slack.com/types/user を参照
        if (!m.deleted && !m.is_bot && m.id !== "USLACKBOT" && !m.profile.is_custom_image 
            && !m.is_restricted && !m.is_ultra_restricted) {
                defaultIconUsers.push(m.id)
            };
        })
        
    var message = ""
    if (defaultIconUsers.length > 0) {
        message = "視認性向上のためアイコン画像の設定をお願いします\n"
        defaultIconUsers.forEach(function(d) {
            message += "<@" + d + ">"
    })} else {
        message = "アイコン画像を設定していないユーザーは居ません"
    }
    slackapp.postMessage(channelId, message);
}
