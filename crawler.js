var Crawler = require('js-crawler');
var he = require('he');
var Cheerio = require('cheerio');
var linebot = require('linebot');
var dbTool = require('./db');
var crawler = new Crawler().configure({ignoreRelative: false, depth: 1});

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

const url = 'http://www.chjhs.tp.edu.tw/dispPageBox/ELEFULL.aspx?ddsPageID=ELEECONTACT&&classid=ECELE1B';
//const url = 'http://www.chjhs.tp.edu.tw/dispPageBox/ELEFULL.aspx?ddsPageID=ELEECONTACT&&classid=ECELE1B&date=20170731';

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
        const mon = selector('div.todayarea .mm');
        const day = selector('div.todayarea .dd');
        var dayString = selector(mon[0]).text() + ' ' +  selector(day[0]).text();
        resultString = dayString + '\n';

        const result = selector('div.ecbookdetail li,h5');
        for(i=0;i<result.length;i++) {
            console.log(result[i].name);
            //insert change line before header
            if (result[i].name == 'h5'){
                resultString += '\n'; 
            }
            selector('i').remove();
            //resultString += selector(result[i]).text().replaceAll('[\t]' ,'') + '\n';
            
            //convert <br> to change line
            resultString += he.decode(selector(result[i]).html()).replaceAll('<br>' ,'\n\n') + '\n';
            //insert change line after header
            if (result[i].name == 'h5'){
                resultString += '\n'; 
            }
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


            dbTool.findLastestContent().then((contentObject) =>{

                if ((contentObject) && (contentObject.dayString == content.dayString)){
                    console.log('this content already exist in db'); 
                }
                else if ((!contentObject) || (contentObject.dayString != content.dayString)){

                    // clean old content and insert new day
                    dbTool.cleanContentDb(); 

                    dbTool.insertContent(content.dayString, content.contentString);

                    // send content to each id
                    dbTool.findId().then((ids)=>{
                        for (i in ids){
                            console.log('send to ' + ids[i]);
                            bot.push(ids[i], content.contentString);
                        }
                    });


                }

            });


    })
    .catch((err) => console.log(err.message));

