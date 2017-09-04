var linebot = require('linebot');
var express = require('express');
var dbTool = require('./db');

var bot = linebot({
  channelId:  process.env.ChannelId,
  channelSecret:  process.env.ChannelSecret,
  channelAccessToken:  process.env.ChannelAccessToken
});

const checkContentAndReply = (event) => {
    dbTool.findLastestContent().then((content) =>{
      if (content.contentString){
        event.reply(content.contentString);
      }
    });

}


bot.on('message', function(event) {
    //console.log(event); //把收到訊息的 event 印出來看看
    if (event.message.type = 'text') {
        var msg = event.message.text;
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
    dbTool.insertId(event.source.userId);
    checkContentAndReply(event);
});

bot.on('unfollow', function(event) {
    console.log(event);
    dbTool.removeId(event.source.userId);
});

bot.on('join', function(event) {
    console.log(event);
    dbTool.insertId(event.source.groupId);
    checkContentAndReply(event);
});

bot.on('leave', function(event) {
    console.log(event);
    dbTool.removeId(event.source.groupId);

});

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});
