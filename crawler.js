var Crawler = require('js-crawler');
var Cheerio = require('cheerio');
var linebot = require('linebot');
var dbTool = require('./db');
var crawler = new Crawler().configure({ignoreRelative: false, depth: 1});
var MongoClient = require('mongodb').MongoClient;

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find, 'g'), replace);
};

const crawl = (url) =>{
    return new Promise((resolve, reject) => {
        crawler.crawl({
            url: url,
            success: (page) => resolve(page),
            failure: (page) => reject(page)
        });
    });
};

const url = 'http://www.chjhs.tp.edu.tw/dispPageBox/KIDFULL.aspx?ddsPageID=KIDECONTACT&&classid=ECKID3F';
//const url = 'http://www.chjhs.tp.edu.tw/dispPageBox/KIDFULL.aspx?ddsPageID=KIDECONTACT&&classid=ECKID3F&date=20170511';

const getSelector = (page) => {
    return new Promise((resolve, reject) => {

        const html = page.content.toString();
        const selector = Cheerio.load(html);
        resolve(selector);
    });
};

const checkHasContent = (selector) => {
    return new Promise((resolve, reject) =>{
        const lis = selector('div.ecbookdetail li');
        if (lis.length > 0){
            resolve(selector);
        }
        else{
            throw new Error('no content!');
        }
    });

};

const getContent = (selector) => {
    return new Promise((resolve, reject) =>{
        var resultString = '';

        //get the day string
        const day = selector('div.todayarea');
        var dayString = selector(day[0]).text().replaceAll(' ', '').replaceAll('[\r\n]', ' ').trim();
        resultString = dayString + '\n';

        const result = selector('div.ecbookdetail li,h5');
        for(i=0;i<result.length;i++) {
            console.log(result[i].name);
            if (result[i].name == 'h5'){
                resultString += '\n'; 
            }
            resultString += selector(result[i]).text().replaceAll('[\t]' ,'') + '\n';
        }
        console.log(resultString);

        resolve({dayString: dayString, contentString: resultString});
    });
};

crawl(url)
    .then((page) => {
        return getSelector(page);
    })
    .then((selector) =>{
        return checkHasContent(selector);
    })
    .then((selector) => {
        return getContent(selector);
    })
    .then((content) => {
        var bot = linebot({
            channelId:  process.env.ChannelId,
            channelSecret:  process.env.ChannelSecret,
            channelAccessToken:  process.env.ChannelAccessToken
        });
        console.log(content);

        var url = 'mongodb://' + process.env.dbUsername + ':'+ process.env.dbPassword + '@ds137281.mlab.com:37281/line-bot';
        MongoClient.connect(url, function (err, db) {
            console.log("DB Connected correctly to server");

            dbTool.findLastestDayString(db, (docs) =>{

                if ((docs.length == 1) && (docs[0].dayString == content.dayString)){
                    console.log('this content already exist in db'); 
                }
                else if ((docs.length == 0) || (docs[0].dayString != content.dayString)){

                    // clean old content and insert new day
                    dbTool.cleanContentDb(db); 

                    dbTool.insertContent(db, content.dayString, content.contentString, ()=> console.log('insert content complete'));

                    // send content to each id
                    dbTool.findId(db, (docs)=>{
                        for (i in docs){
                            console.log('send to ' + docs[i].id);
                            bot.push(docs[i].id, content.contentString);
                        }
                    });


                }

            });

        });

    })
    .catch((err) => console.log(err.message));

