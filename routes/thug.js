const express = require('express');
const router = express.Router();
const config = require('../config');
const mongo = require('mongodb').MongoClient;
const spot = require('./spotify');
const _ = require('underscore');
const axios = require('axios');

var groupId;

/* GET request */
router.get('/', function (req, res) {
    res.sendStatus(405);
});

/* POST request */
router.post('/', function (req, res) {
    console.log(req.body);
    if (Object.keys(req.body).length === 0) {
        res.sendStatus(400);
    } else {
        let data = req.body;
        parseRequest(data, res);
    }
});

function parseRequest(data, res) {
    try {
        let senderID = data['sender_id'];
        let senderName = data['name'];
        let messageText = data['text'].toLowerCase();
        groupId = data['group_id'];
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
    } catch (err) {
        res.sendStatus(400);
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
                    bot_id: config.thugbot.identifiers[groupId],
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
                    bot_id: config.thugbot.identifiers[groupId],
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
            bot_id: config.thugbot.identifiers[groupId],
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
            bot_id: config.thugbot.identifiers[groupId],
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
            bot_id: config.thugbot.identifiers[groupId],
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
function postSongResponse(id, name, res){

    getRandomSong().then(track => {
        console.log(track);

        let outgoing = JSON.stringify({
            bot_id: config.thugbot.identifiers[groupId],
            text: track.spotify,
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
    try {
        let tokenCall = await spot.getAccessToken(config.spotify.clientId, config.spotify.clientSecret);
        console.log(tokenCall.data);
        let accessToken = tokenCall.data['access_token'];
        let albumCall = await spot.getRandomAlbum(config.spotify.artistId, accessToken);
        let albums = albumCall.data['items'];
        let randomAlbum = _.sample(albums);
        let albumId = randomAlbum.id;
        let trackCall = await spot.getRandomTrackFromAlbum(albumId, accessToken);
        let tracks = trackCall.data['items'];
        let randomTrack = _.sample(tracks);
        return randomTrack['external_urls']
    }  catch (err) {
        console.log(err.stack);
    }
}

// Post the response with proper format and info
async function sendResponse(outgoing, res) {

    let url = 'https://' + config.thugbot.host + '/' + config.thugbot.path;
    let response = await axios.post(url, outgoing);
    console.log(response);
    res.sendStatus(response.status);
    res.end();
}

module.exports = router;
