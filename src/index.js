var linebot = require('linebot');
var express = require('express');
var dbTool = require('./db');
var handleMsg = require('./handleMsg')

var bot = linebot({
  channelId:  process.env.ChannelId,
  channelSecret:  process.env.ChannelSecret,
  channelAccessToken:  process.env.ChannelAccessToken
});

const initialMessage = '目前僅支援一四年級所有班級\n'
                        +'請問你要關注哪一班\n'
                        +'請用"小幫手我要關注" 或 "小幫手我要退訂" 加上班級名稱來關注或退訂聯絡簿'
                        ;


bot.on("message", function(event) {
  //console.log(event); //把收到訊息的 event 印出來看看
  var targetId = event.source.groupId ? event.source.groupId : event.source.userId;
  if ((event.message.type = "text")) {
    var msg = event.message.text;
    console.log("message " + msg);
    if (msg) {
      handleMsg(targetId, msg, message => {
        event.reply(message);
      });
    }
  }
});

function checkHasNotSentContent(targetId) {
  dbTool.findSubscribe(targetId);  
}

bot.on('follow', function(event) {
    console.log(event);
    event.reply(initialMessage);
});

bot.on('unfollow', function(event) {
    console.log(event);
    dbTool.removeIdFromAllClass(event.source.userId);
});

bot.on('join', function(event) {
    console.log(event);
    event.reply(initialMessage);
});

bot.on('leave', function(event) {
    console.log(event);
    dbTool.removeIdFromAllClass(event.source.groupId);

});


const app = express();
const linebotParser1 = bot.parser();
app.post('/', linebotParser1);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});
