const express = require('express');
const router = express.Router();
const config = require('../config');
const https = require('https');
const mongo = require('mongodb').MongoClient;
const spot = require('/spotify');

/* GET request */
router.get('/', function (req, res) {
    res.sendStatus(405);
});

/* POST request */
router.post('/', function (req, res) {
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
            storeInput(messageText, data, res);
        } else {
            if (containsPictureRequest(messageText)) {
                postPictureResponse(senderID, senderName, res);
            } else if (containsSongRequest(messageText)) {
                postSongResponse(senderID, senderName, res);
            }
            else {
                postTextResponse(senderID, senderName, res);
            }
        }

    } else {
        res.sendStatus(200);
        res.end();
    }
}


// Trigger Word Checkers
function containsTrigger(text) {
    return text.indexOf(config.thugbot.trigger_words.mention) >= 0;
}

function containsPictureRequest(text) {
    return text.indexOf(config.thugbot.trigger_words.picture) >= 0;
}

function containsStorageRequest(text) {
    return text.indexOf(config.thugbot.trigger_words.storage) >= 0;
}

function containsSongRequest(text) {
    return text.indexOf(config.thugbot.trigger_words.song) >= 0;
}

// Write the received message to the database
function storeInput(message, data, res) {
    let name = data['name'];
    let id = data['sender_id'];
    let attachments = data['attachments'];
    let outgoing;
    if (attachments.length !== 0) {
        let url = attachments[0].url;
        insertImage(url).then(result => {
            if (result.insertedCount === 1) {
                outgoing = JSON.stringify({
                    bot_id: config.thugbot.bot_id,
                    text: '@' + name + ' ' + 'got you luv',
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
            } else {
                outgoing = JSON.stringify({
                    bot_id: config.thugbot.bot_id,
                    text: '@' + name + ' ' + 'something went wrong',
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
            }
            sendResponse(outgoing, res);
        });
    } else {
        outgoing = JSON.stringify({
            bot_id: config.thugbot.bot_id,
            text: '@' + name + ' ' + 'I can only store flicks rn',
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
    }

}

// Send a quote as a message
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

// Send a picture as a message
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

// Send a spotify link as a message
function postSongResponse(){

    getRandomSong().then(track => {

        let outgoing = JSON.stringify({
            bot_id: config.thugbot.bot_id,
            text: '@' + name + "bump it luv" + track['spotify'],
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


    })
}

// Fetch a photo from the DB
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

// Read a quote from the DB
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

// Write an image URL to the DB
async function insertImage(source) {
    let cred = config.database.credentials.user + ':' + config.database.credentials.pwd;
    let path = config.database.host + ':' + config.database.port;
    let url = 'mongodb://' + cred + '@' + path + '/?authSource=' + config.database.name;
    let client;

    try {
        client = await mongo.connect(url);
        let db = client.db(config.database.name);
        let collection = db.collection('images');
        return await collection.insertOne({ url: source })
    } catch (err) {
        console.log(err.stack);
    }

    client.close();
}

// Use spotify helper functions to get a random track
async function getRandomSong() {

    let accessToken = await spot.getAccessToken(config.spotify.clientId, config.spotify.clientSecret);
    let albumId = await spot.getRandomAlbum(config.spotify.artistId, accessToken);
    return await spot.getRandomTrackFromAlbum(albumId, accessToken);

}

// Post the response with proper format and info
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