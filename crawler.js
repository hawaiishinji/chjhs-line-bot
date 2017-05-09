var Crawler = require('js-crawler');
var Cheerio = require('cheerio');
var linebot = require('linebot');
var crawler = new Crawler().configure({ignoreRelative: false, depth: 1});

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

        bot.push('Uf3cfda1e70a640d8df26fef62e3c6d03', resultString);
    },
    failure: (page) => {
    }
})
