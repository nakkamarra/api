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

function parseRequest(data) {
    let senderID = data['sender_id'] || '';
    let senderName = data['name'] || '';
    let messageText = data['text'] || '';
    if (messageText.indexOf('thug') >= 0 || messageText.indexOf('thugger') >= 0) {
        if (messageText.indexOf('pic') >= 0 || messageText.indexOf('picture') >= 0) {
            postPictureResponse(senderID, senderName);
        } else {
            postTextResponse(senderID, senderName);
        }
    }
}

function postTextResponse(id, name){

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

    let callback = function(res) {
        let incoming = '';
        res.on('data', function (chunk) {
            incoming += chunk;
        });
        res.on('end', function () {
            console.log(incoming);
        });
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
        'Babysit your dog all day... Bouta watch you jog all day! 😏',
        'YeeHAW!! 🤠'];
    let randomIndex = Math.floor(Math.random() * Math.floor(quoteArray.length));
    return quoteArray[randomIndex];
}

module.exports = router;