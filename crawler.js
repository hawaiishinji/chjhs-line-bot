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
var insertContent = function(db, dayString, contentString, callback){
    // Get the documents collection
    var collection = db.collection('content');

    collection.insert({dayString: dayString, contentString: contentString}, callback);
}

var cleanContentDb = function (db){
    // Get the documents collection
    var collection = db.collection('content');
    collection.remove();
}

var findLastestDayString = function (db, callback) {
    // Get the documents collection
    var collection = db.collection('content');
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
    //url: 'http://www.chjhs.tp.edu.tw/dispPageBox/KIDFULL.aspx?ddsPageID=KIDECONTACT&&classid=ECKID3F&date=20170511',

    success: (page) => {
        const html = page.content.toString();
        const $ = Cheerio.load(html);
        var resultString = '';

        const lis = $('div.ecbookdetail li');
        if (lis.length > 0){

            //get the day string
            const day = $('div.todayarea');
            var dayString = $(day[0]).text().replaceAll(' ', '').replaceAll('[\r\n]', ' ').trim();
            resultString = dayString + '\n';

            const result = $('div.ecbookdetail li,h5');
            for(i=0;i<result.length;i++) {
                console.log(result[i].name);
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

                findLastestDayString(db, (docs) =>{

                    if ((docs.length == 1) && (docs[0].dayString == dayString)){
                        console.log('this content already exist in db'); 
                    }
                    else if ((docs.length == 0) || (docs[0].dayString != dayString)){

                        // clean old content and insert new day
                        cleanContentDb(db); 

                        insertContent(db, dayString, resultString, ()=> console.log('insert content complete'));

                        // send content to each id
                        findId(db, (docs)=>{
                            for (i in docs){
                                console.log('send to ' + docs[i].id);
                                bot.push(docs[i].id, resultString);
                            }
                        });


                    }

                });

            });


        }
        else{
            console.log('no content today');
        }

    },
    failure: (page) => {
    }
})
