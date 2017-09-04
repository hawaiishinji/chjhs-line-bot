var linebot = require('linebot');
var express = require('express');
var dbTool = require('./db');

var bot1 = linebot({
  channelId:  process.env.ChannelId,
  channelSecret:  process.env.ChannelSecret,
  channelAccessToken:  process.env.ChannelAccessToken
});

var bot2 = linebot({
  channelId:  process.env.ChannelId2,
  channelSecret:  process.env.ChannelSecret2,
  channelAccessToken:  process.env.ChannelAccessToken2
});

const checkContentAndReply = (event, classId) => {
    dbTool.findLastestContent(classId).then((content) =>{
      if (content.contentString){
        event.reply(content.contentString);
      }
    });

}

function registerCallback(bot, classId){

bot.on('message', function(event) {
    //console.log(event); //把收到訊息的 event 印出來看看
    if (event.message.type = 'text') {
        var msg = event.message.text;
        console.log('message ' + msg);
        /*    event.reply(msg).then(function(data) {
            // success
            console.log(msg);
        }).catch(function(error) {
            // error
            console.log('error');
        });*/
    }
});

bot.on('follow', function(event) {
    console.log(event);
    dbTool.insertId(classId, event.source.userId);
    checkContentAndReply(event, classId);
});

bot.on('unfollow', function(event) {
    console.log(event);
    dbTool.removeId(classId, event.source.userId);
});

bot.on('join', function(event) {
    console.log(event);
    dbTool.insertId(classId, event.source.groupId);
    checkContentAndReply(event, classId);
});

bot.on('leave', function(event) {
    console.log(event);
    dbTool.removeId(classId, event.source.groupId);

});

}

registerCallback(bot1, 'ECELE1B');
registerCallback(bot2, 'ECKID1C');

const app = express();
const linebotParser1 = bot1.parser();
const linebotParser2 = bot2.parser();
app.post('/ECELE1B', linebotParser1);
app.post('/ECKID1C', linebotParser2);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});
