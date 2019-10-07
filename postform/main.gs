function doGet() {
  var mail = Session.getActiveUser().getEmail();
  if (!mail){
    return Browser.msgBox("googleアカウントに再ログインして下さい")
  } else {
    return HtmlService.createTemplateFromFile('form').evaluate()
  .addMetaTag('viewport', 'width=device-width, initial-scale=1, shrink-to-fit=no');
  }
}

function doPost(e) {
  this.translateForSlack(e);
  this.updateSpreadSheet(e);
  return HtmlService.createHtmlOutputFromFile("complete");
}


function updateSpreadSheet(e) {
  var f = e.parameter;
  var sheet = SpreadsheetApp.openById("hogehogehogehogehoge");
  var table = f.product == "aaaaa" ? sheet.getSheetByName("aaaaa問い合わせ") : sheet.getSheetByName("bbbbb問い合わせ") ;

  //B列の中で最終行を探す
  var lastRow = table.getLastRow();
  var B_Cells = table.getRange(1,2,lastRow,1);
   //getRange(row, column [, numrows [, numcolumns]])
  var B_Values = B_Cells.getValues();

for( var i=B_Values.length-1; i>=1; i-- ){
    if( B_Values[i] != "" ){
      //最終記録No.を取得し、今回記録するNoを算出
      var index = table.getRange(i+1,1).getValue() + 1;
      var facility = f.product == "aaaaa" ? f.aaaaaFacility : f.bbbbbFacility;
      var array = [[index, f.product, facility, f.inquiryPerson, f.inquiryDateTime, f.staff,
                    f.department, f.consumptiontime, f.question, f.response, f.class]];
      var ranege = table.getRange(i+2,1,1,11).setValues(array);

      table.insertRows(i+3);
      table.getRange(i+3,1,1,11).setBorder(true,true,true,true,true,true);

      break;
    }
  }
}

function sendToSlack(bodypublic, channel, icon) {
  var url = "https://hooks.slack.com/services/hogehogehogehogehoge";
  var data = { "channel" : channel, "username" : "問い合わせ記録bot", "text" : bodypublic, "icon_emoji" : icon };
  var payload = JSON.stringify(data);
  var options = {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : payload,
    "muteHttpExceptions": true
  };
  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  var responseBody = response.getContentText();
  if (responseCode !== 200) {
    MailApp.sendEmail('mail@addresshoge', '問合せフォームエラー', 'slackの投稿に失敗。\nエラー内容:'+ responseBody);
  }
}

function translateForSlack(e){
  var f = e.parameter;
  var inquiryDateTime = f.inquiryDateTime;
  var inquiryFacility = f.product == "aaaaa" ?  f.aaaaaFacility : f.bbbbbFacility;
  var inquiryPerson   = f.inquiryPerson == '' ? '' : '(' + f.inquiryPerson + ')';
  var staff           = f.staff;
  var question        = f.question;
  var response        = f.response;

  var bodyPublic =  "製品　　　： " + f.product + "\n問合せ日時： " + inquiryDateTime +"\n問合わせ元： " + inquiryFacility + inquiryPerson
                   +"\n対応者　　： " + staff +"\n【質問】\n" + question + "\n【回答＆対応】\n" + response + "\n=====================================";
  var channel = '#test';
  var icon = f.product == "aaaaa" ?  ":aaaaa:" : ":bbbbb:";
  this.sendToSlack(bodyPublic, channel, icon);
}

function getShopList(activeSheet) {
  var activeSheet = SpreadsheetApp.openById('hogehogehogehogehoge');
  var shopSheet = activeSheet.getSheetByName("管理");
  var shopMaster = shopSheet.getRange(7,2,shopSheet.getLastRow()-2,11).getValues();
  var shopList = [{"label": '対応施設なし',
                       "shopName": '無し', "companyName": '無し'}];
  for(var i = 0; i < shopMaster.length ; i++) {
    var shopCode = shopMaster[i][10]
    var shopName = shopMaster[i][1]
    var companyCode = shopMaster[i][9]
    var companyName = shopMaster[i][0]
    shopList.push({"label": shopCode + ' ' + shopName + '(' + companyCode + companyName + ')',
                       "shopName": shopName, "companyName": companyName});
  }
  return JSON.stringify(shopList);
}
