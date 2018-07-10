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

    readQuote().then(quotes => {

        let outgoing = JSON.stringify({
            bot_id: config.thugbot.bot_id,
            text: '@' + name + ' ' + quotes[0].text,
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

        sendResponse(outgoing, res);
    });

}

function postPictureResponse(id, name, res) {

    readImage().then(images => {

        let outgoing = JSON.stringify({
            bot_id: config.thugbot.bot_id,
            text: '@' + name,
            attachments: [
                {
                    type: 'mentions',
                    user_ids: [id],
                    loci: [
                        [0, 1 + name.length]
                    ]
                },
                {
                    type: 'image',
                    url: images[0].url
                }
            ]
        });

        sendResponse(outgoing, res);
    });
}

async function readImage() {
    let cred = config.database.credentials.user + ':' + config.database.credentials.pwd;
    let path = config.database.host + ':' + config.database.port;
    let url = 'mongodb://' + cred + '@' + path + '/?authSource=' + config.database.name;
    let client;

    try {
        client = await mongo.connect(url);
        let db = client.db(config.database.name);
        let collection = db.collection('images');
        return await collection.aggregate([{ $sample: { size: 1 }}]).toArray();
    } catch (err) {
        console.log(err.stack);
    }

    client.close();
}

async function readQuote() {
    let cred = config.database.credentials.user + ':' + config.database.credentials.pwd;
    let path = config.database.host + ':' + config.database.port;
    let url = 'mongodb://' + cred + '@' + path + '/?authSource=' + config.database.name;
    let client;

    try {
        client = await mongo.connect(url);
        let db = client.db(config.database.name);
        let collection = db.collection('quotes');
        return await collection.aggregate([{ $sample: { size: 1 }}]).toArray();
    } catch (err) {
        console.log(err.stack);
    }

    client.close();
}

function sendResponse(outgoing, res) {

    let options = {
        host: config.thugbot.host,
        path: config.thugbot.path,
        port: config.thugbot.port,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(outgoing)
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
    req.write(outgoing);
    req.end();
}

module.exports = router;