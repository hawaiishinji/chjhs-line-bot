var Crawler = require('js-crawler');
var Cheerio = require('cheerio');
var linebot = require('linebot');
var crawler = new Crawler().configure({ignoreRelative: false, depth: 1});
var MongoClient = require('mongodb').MongoClient;

var findId = function (db, callback) {
    // Get the documents collection
    var collection = db.collection('subscribe');
    // Find some documents
    collection.find({}).toArray(function (err, docs) {
        callback(docs);
    });
}

crawler.crawl({
    url: 'http://www.chjhs.tp.edu.tw/dispPageBox/KIDFULL.aspx?ddsPageID=KIDECONTACT&&classid=ECKID3F',

    success: (page) => {
        const html = page.content.toString();
        const $ = Cheerio.load(html);
        const result = $('div.ecbookdetail li');
        var resultString = '';
        for(i=0;i<result.length;i++) {
            resultString += $(result[i]).text() + '\n';
            console.log($(result[i]).text());
        }
        var bot = linebot({
            channelId:  process.env.ChannelId,
            channelSecret:  process.env.ChannelSecret,
            channelAccessToken:  process.env.ChannelAccessToken
        });

        var url = 'mongodb://' + process.env.dbUsername + ':'+ process.env.dbPassword + '@ds137281.mlab.com:37281/line-bot';
        MongoClient.connect(url, function (err, db) {
            console.log("DB Connected correctly to server");
            mongoDb = db;

            findId(db, (docs)=>{
                for (i in docs){
                    console.log('send to ' + docs[i]);
                    bot.push(docs[i].id, resultString);
                }
            });
        });



    },
    failure: (page) => {
    }
})
