const express = require('express');
const router = express.Router();
const config = require('../config');
const https = require('https');
const mongo = require('mongodb').MongoClient;

/* GET request */
router.get('/', function (req, res, next) {
    res.sendStatus(405);
});

/* POST request */
router.post('/', function (req, res, next) {
    console.log(req.body);
    let data = req.body;
    parseRequest(data, res);
});

function parseRequest(data, res) {
    let senderID = data['sender_id'] || '';
    let senderName = data['name'] || '';
    let messageText = data['text'].toLowerCase() || '';
    if (containsTrigger(messageText)) {
        if (containsStorageRequest(messageText)) {
            storeInput(messageText);
        } else {
            if (containsPictureRequest(messageText)) {
                postPictureResponse(senderID, senderName, res);
            } else {
                postTextResponse(senderID, senderName, res)
            }
        }
    } else {
        res.sendStatus(200);
        res.end();
    }
}

function containsTrigger(text) {
    return text.indexOf(config.thugbot.trigger_words.mention) >= 0;
}

function containsPictureRequest(text) {
    return text.indexOf(config.thugbot.trigger_words.picture) >= 0;
}

function containsStorageRequest(text) {
    return text.indexOf(config.thugbot.trigger_words.storage) >= 0;
}

function storeInput() {

}

function postTextResponse(id, name, res) {

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

    let callback = function (returning) {
        let incoming = '';
        returning.on('data', function (chunk) {
            incoming += chunk;
        });
        returning.on('end', function () {
            console.log(incoming);
        });
        res.sendStatus(201);
    };

    let req = https.request(options, callback);
    req.write(response);
    req.end();

}

function postPictureResponse(id, name) {

}

function readImage() {

}

async function readQuote() {
    let client;
    let cred = config.database.credentials.user + ':' + config.database.credentials.pwd;
    let path = config.database.host + ':' + config.database.port;
    let url = 'mongodb://' + cred + path + '/' + config.database.name;

    try {
        client = await mongo.connect(url);
        console.log("Connected correctly to server");

        const db = client.db(config.database.name);

        let quote = await db.collection('quotes').aggregate({$sample: {size: 1}})
        return quote.text
    } catch (err) {
        console.log(err.stack);
    }

    client.close();
}

module.exports = router;