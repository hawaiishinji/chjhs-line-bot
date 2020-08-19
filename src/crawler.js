require("babel-polyfill");
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

var bot = linebot({
  channelId:  process.env.ChannelId,
  channelSecret:  process.env.ChannelSecret,
  channelAccessToken:  process.env.ChannelAccessToken
});

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

  const html = page.content.toString();
  const selector = Cheerio.load(html);
  return selector;
};

const checkHasContent = (selector) => {
  const lis = selector('div.ecbookdetail li');
  return lis.length >0;
};

const getContent = (selector, className) => {
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

  return {dayString: dayString + ' ' + hashCode(resultString), contentString: resultString};
};

const hashCode = function(s) {
  var h = 0, l = s.length, i = 0;
  if ( l > 0 )
    while (i < l)
      h = (h << 5) - h + s.charCodeAt(i++) | 0;
  console.log('hash', h)
  return h;
};

async function crawlTheUrl(theClass){
  const {url, name} = theClass;
  const classId = theClass.id;

  var page = await crawl(url);
  var selector = getSelector(page);

  if (!checkHasContent(selector)){
    console.log('no content');
    return;
  }
  var content = getContent(selector, name);

  console.log(content);

  var contentObject = await dbTool.findLastestContent(classId);

  if ((contentObject) && (contentObject.dayString == content.dayString)
    && (content.contentString == contentObject.contentString)){
    console.log('this content already exist in db');
  }
  else if ((!contentObject) || (contentObject.dayString != content.dayString)
    || (content.contentString != contentObject.contentString)){

    await dbTool.cleanContentDb(classId);

    await dbTool.insertContent(classId, content.dayString, content.contentString);

    // ### do not push content anymore
    // var ids = await dbTool.findId(classId);
    // console.log('multicast to ' + ids);

    // await bot.push(ids, content.contentString);
  }
}

async function run (){
  for (let i in classes){
    await crawlTheUrl(classes[i]);
  }
  dbTool.endDb()
}

run();
