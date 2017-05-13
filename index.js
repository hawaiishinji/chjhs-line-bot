var linebot = require('linebot');
var express = require('express');
var MongoClient = require('mongodb').MongoClient;

var bot = linebot({
  channelId:  process.env.ChannelId,
  channelSecret:  process.env.ChannelSecret,
  channelAccessToken:  process.env.ChannelAccessToken
});

var mongoDb;
var url = 'mongodb://' + process.env.dbUsername + ':'+ process.env.dbPassword + '@ds137281.mlab.com:37281/line-bot';
MongoClient.connect(url, function (err, db) {
    console.log("DB Connected correctly to server");
    mongoDb = db;
    //insertId(db, '123', ()=>{});
    removeId(db, '123', ()=>{});
});


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
    insertId(mongoDb, event.source.userId, ()=>console.log(event.source.userId + " added")); 
});

bot.on('unfollow', function(event) {
    console.log(event);
    removeId(mongoDb, event.source.userId, ()=>console.log(event.source.userId + " removed")); 
});

bot.on('join', function(event) {
    console.log(event);
    insertId(mongoDb, event.source.groupId, ()=>console.log(event.source.groupId+ " added")); 
});

bot.on('leave', function(event) {
    console.log(event);
    removeId(mongoDb, event.source.groupId, ()=>console.log(event.source.groupId+ " removed")); 

});

var insertId = function (db, id, callback) {
    var collection = db.collection('subscribe');
    collection.insert([{id : id }],
        function (err, result) {
            console.log("Inserted 2 documents into the userProfile collection\n");
            callback(result);
        });
};



var removeId = function (db, id, callback){
    // Get the documents collection
    var collection = db.collection('subscribe');

    collection.remove({id: id}, function(error, result){
        callback(); 
    });

}

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});
