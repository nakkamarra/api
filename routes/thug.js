let express = require('express');
let router = express.Router();
let config = require('../config');
let https = require('https');

/* GET request */
router.get('/', function(req, res, next) {
    res.status(405);
});


/* POST request */
router.post('/', function(req, res, next) {
    console.log(req.body);
    let data = req.body;
    parseRequest(data, res);
});

function parseRequest(data, res) {
    let senderID = data['sender_id'] || '';
    let senderName = data['name'] || '';
    let messageText = data['text'] || '';
    if (messageText.indexOf('thug') >= 0 || messageText.indexOf('thugger') >= 0) {
        if (messageText.indexOf('pic') >= 0 || messageText.indexOf('picture') >= 0) {
            postPictureResponse(senderID, senderName, res);
        } else {
            postTextResponse(senderID, senderName, res);
        }
    }
}

function postTextResponse(id, name, res){

    let response = JSON.stringify({
        bot_id: config.thugbot.bot_id,
        text: '@' + name + ' ' + readQuote(),
        attachments: [
            {
                type: 'mentions',
                user_ids: [id],
                loci: [
                    [0, 1 + name.length]
                ]
            }
        ]
    });

    let options = {
        host: config.thugbot.host,
        path: config.thugbot.path,
        port: config.thugbot.port,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(response)
        }
    };

    let callback = function(returning) {
        let incoming = '';
        returning.on('data', function (chunk) {
            incoming += chunk;
        });
        returning.on('end', function () {
            console.log(incoming);
        });
        res.send(201);
    };

    let req = https.request(options, callback);
    req.write(response);
    req.end();

}

function postPictureResponse(id, name) {

}

function getPicture() {

}

function readQuote() {
    let quoteArray = ['Thugga thugga! 😤',
        'Roll up that raw all day... Babysit your dog all day... Bouta watch you jog all day!! 😏',
        'YeeHAW!! 🤠',
        'I’ve did a lot of shit back in the day 🐍',
        'DRIP DROP💧 I\'m drippy...',
        'Bet it all, bet it all... She pult uhp ina benz truck 🚘',
        'Middle finger stick it up 🖕 if u ain een give a fuck',
        'Wamp-wamp 😜',
        'Jeffreeeeey... 🎶 \'long side Wyclef',
        'My diamonds yellow like a corn 🌽',
        'And I\'m on a perky pill!!',
        'Bentley wheelin...',
        'What it do',
        'Pour up a four of that Actavis, Lean like my mothafuckin\' granny did',
        'I\'m fucking this cash 💰 I’m not celibate',
        'Bump on her bumper like a traffic jam 🚦',
        'I\'m on the top of the mountain, puffin\' on clouds ☁️ and y\'all still beginnin\'!!',
        'I ain\'t got AIDS 💉 but I swear to God I would bleed \'til I D.I.E',
        'I know all my whips are foreign, I know all your bitches borin\' 😒',
        'I\'m at Rolling Loud, right there, rolling out, smokin\' Baaaackwooooooods ',
        'FAMILY DON\'T MATTA',
        'What\'s poppin\'... what\'s the deal?',
        'The bread ambassador... No nothin\' else matter to him... \n ballin\' 🏀 like Patrick Ewing!!!',
        'Country Billy made a couple milli\'... tryna park the Rolls Royce inside the Piccadilly',
        'I ain\'t goin\' out like no idiot, I\'m a OG!!',
        'Yellow school buses, that\'s a Xanny... causin\' me to sleep 😴 and I ain\'t plan it',
        'I\'m speedin\' and I got a trunk full of wham',
        'She wan\' chicken like sesame',
        'Black diamonds like I\'m Akon kid!!',
        'Diamonds water like I bought \'em from a squid',
        'America, I just checked my following list, and —— you mothafuckas owe me!!!',
        'SEX is the name don’t wear it out... Go to the library and check it out...',
        'I’m changing my name to SEX.... For now on call me SEX!!!',
        'YSL want all the smoke... ask the opps... 🐍',
        'I don\'t drink water cause I rock it 😊',
        'when u talk better talk in all caps',
        'Ima die from my chains choking me in my sleep...',
        'We tryin to fuck yo tears'];
    let randomIndex = Math.floor(Math.random() * Math.floor(quoteArray.length));
    return quoteArray[randomIndex];
}

module.exports = router;