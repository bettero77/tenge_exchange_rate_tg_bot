require('dotenv').config();
const http = require('http');
const https = require('https');
const cheerio = require("cheerio");
const TelegramBot = require('node-telegram-bot-api');


const mirURL = 'https://mironline.ru/support/list/kursy_mir/';
const bot = new TelegramBot(process.env.T_TOKEN, {polling: true});

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World!');
});

const callMir = async (chatId) => {
    https.get(mirURL, (k) => callback(k, chatId));
}

callback = function (response, chatId) {
    let str = '', data, rate;
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        data = find(cheerio.load(str));
        rate = Number(1 / +data.value).toFixed(2);
        bot.sendMessage(chatId, data.name + ' ' + rate);
    });
}

botOn = () => bot.on('message', (msg) => {
    callMir(msg.chat.id);
});


server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running at http://127.0.0.1:${process.env.PORT || 3000}/`);
    callMir(process.env.T_CHAT_ID);
    botOn();
});

const find = ($) => {
    let name, value;
    $('tbody').each((parentIndex, parentElem) => {
        $(parentElem).children().each((pI1, pE1) => {
            let flag = false;

            $(pE1).children().each((pI2, pE2) => {

                $(pE2).children().each((pI3, pE3) => {
                    if (pE3?.children[0] && pE3.children[0].data.includes("Казахстанский тенге")) {
                        name = pE3.children[0].data;
                        flag = true;
                    }
                    $(pE3).children().each((pI4, pE4) => {
                        if (pE4.children[0] && flag) {
                            value = pE4.children[0].data;
                        }
                    });

                });
            });
        });
    });
    name = name.replace(/[^А-Яа-я ]/g, '').trim();
    value = value.replace(/[^a-zA-Z0-9, ]/g, '').trim().replace(',', '.');
    value = +value;
    return {name, value};
}
