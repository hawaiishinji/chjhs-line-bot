var Crawler = require('js-crawler');
var he = require('he');
var Cheerio = require('cheerio');
var linebot = require('linebot');
var dbTool = require('./db');
var crawler = new Crawler().configure({ignoreRelative: false, depth: 1});
var classes = require('./classes');

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

const getContent = (selector, className) => {
  return new Promise((resolve, reject) =>{
    var resultString = '';

    //get the day string
    const mon = selector('div.todayarea .mm');
    const day = selector('div.todayarea .dd');
    var dayString = selector(mon[0]).text() + ' ' +  selector(day[0]).text();
    resultString = className + ' ' + dayString + '\n';

    const result = selector('div.ecbookdetail li,h5');
    for(let i = 0;i<result.length;i++) {
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

function crawlTheUrl(theClass){
  const {url, name} = theClass;
  const classId = theClass.id;

  return crawl(url)
  .then((page) => {
    return getSelector(page);
  })
  .then((selector) =>{
    return checkHasContent(selector);
  })
  .then((selector) => {
    return getContent(selector, name);
  })
  .then((content) => {

    console.log(content);

    dbTool.findLastestContent(classId).then((contentObject) =>{

      if ((contentObject) && (contentObject.dayString == content.dayString)){
        console.log('this content already exist in db');
      }
      else if ((!contentObject) || (contentObject.dayString != content.dayString)){

        // clean old content and insert new day
        dbTool.cleanContentDb(classId);

        dbTool.insertContent(classId, content.dayString, content.contentString);

        // send content to each id
        dbTool.findId(classId).then((ids)=>{
          console.log('multicast to ' + ids);
          bot.push(ids, content.contentString);
        });
      }
    });
  })
  .catch((err) => console.log(err.message));
}

var bot = linebot({
  channelId:  process.env.ChannelId,
  channelSecret:  process.env.ChannelSecret,
  channelAccessToken:  process.env.ChannelAccessToken
});

crawlTheUrl(classes[0]).then(() =>{
  crawlTheUrl(classes[1]);
});
