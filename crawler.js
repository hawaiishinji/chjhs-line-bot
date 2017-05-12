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

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find, 'g'), replace);
};

crawler.crawl({
    url: 'http://www.chjhs.tp.edu.tw/dispPageBox/KIDFULL.aspx?ddsPageID=KIDECONTACT&&classid=ECKID3F',

    success: (page) => {
        const html = page.content.toString();
        const $ = Cheerio.load(html);

        //get the day string
        const day = $('div.todayarea');
        var dayString = $(day[0]).text().replaceAll(' ', '').replaceAll('[\r\n]', ' ').trim();
        var resultString = dayString + '\n';


        const result = $('div.ecbookdetail li,h5');
        for(i=0;i<result.length;i++) {
            if (result[i].name == 'h5'){
                resultString += '\n'; 
            }
            resultString += $(result[i]).text().replaceAll('[\t]' ,'') + '\n';
        }
        console.log(resultString);

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
                    console.log('send to ' + docs[i].id);
                    bot.push(docs[i].id, resultString);
                }
            });
        });



    },
    failure: (page) => {
    }
})
