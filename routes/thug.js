let express = require('express');
let router = express.Router();
let config = require('../config');
let https = require('https');

/* POST request */
//TODO :: SWITCH TO POST REQUEST
router.post('/', function(req, res, next) {
    //parseRequest();
    console.log(req.body)
    //postTextResponse();
    res.send();
});

function parseRequest() {

}

function postTextResponse(){

    let response = JSON.stringify({ bot_id: config.thugbot.bot_id, text: readQuote() });

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
        let str = '';

        res.on('data', function (chunk) {
            str += chunk;
        });

        res.on('end', function () {
            console.log(str);
        });
    };

    let req = https.request(options, callback);
    req.write(response);
    req.end();

}

function readQuote() {
    let quoteArray = ['Thugga thugga! 😤', 'Babysit your dog all day... Bouta watch you jog all day! 😏', 'YeeHAW!! 🤠'];
    let randomIndex = Math.floor(Math.random() * Math.floor(quoteArray.length));
    return quoteArray[randomIndex];
}

module.exports = router;