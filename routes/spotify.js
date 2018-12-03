const https = require('https');
const _ = require('underscore');

// Get an API token using the provided ID and Secret
function getAccessToken(clientId, clientSecret) {
    let payload = Buffer(clientId + ':' + clientSecret).toString('base64');
    let auth = 'Basic ' + payload;

    let postData = {
        host: 'accounts.spotify.com',
        port: 443,
        path: '/api/token',
        method: 'POST',
        headers : {
            'Authorization': auth,
            'Content-Type': 'x-www-form-urlencoded'
        }
    };

    return new Promise((resolve, reject) => {

        var req = https.request(postData, function(response) {

            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error('statusCode=' + response.statusCode));
            }

            var body = [];
            response.on('data', function(chunk) {
                body.push(chunk);
            });

            response.on('end', function() {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch(e) {
                    reject(e);
                }
                resolve(body['access_token']);
            });
        });

        req.on('error', function(err) {

            reject(err);
        });

        if (postData) {
            req.write({grant_type : "client_credentials"});
        }

        req.end();
    });
}

// Get all albums from the Artist passed and randomly select one and return it
function getRandomAlbum(artistId, accessToken) {

    let data = {
        host: 'api.spotify.com',
        port: 443,
        path: '/v1/artists/' + artistId + '/albums',
        method: 'GET',
        headers : {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    return new Promise((resolve, reject) => {

        var req = https.request(postData, function(response) {

            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error('statusCode=' + response.statusCode));
            }

            var body = [];
            response.on('data', function(chunk) {
                body.push(chunk);
            });

            response.on('end', function() {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch(e) {
                    reject(e);
                }
                let albums = body['items'];
                let randomAlbum = _.sample(albums);
                resolve(randomAlbum['id']);
            });
        });

        req.on('error', function(err) {

            reject(err);
        });

        req.end();
    });
}

// Get all tracks from the Album passed and randomly select one and return it
function getRandomTrackFromAlbum(albumId, accessToken) {
    let data = {
        host: 'api.spotify.com',
        port: 443,
        path: '/v1/albums/' + albumId + '/tracks',
        method: 'GET',
        headers : {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    return new Promise((resolve, reject) => {

        var req = https.request(data, function(response) {

            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error('statusCode=' + response.statusCode));
            }

            var body = [];
            response.on('data', function(chunk) {
                body.push(chunk);
            });

            response.on('end', function() {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch(e) {
                    reject(e);
                }
                let tracks = body['items'];
                let randomTrack = _.sample(tracks);
                resolve(randomTrack['external_urls'])
            });
        });

        req.on('error', function(err) {

            reject(err);
        });

        req.end();
    });
}

// Export the helper functions
module.exports.getAccessToken = getAccessToken();
module.exports.getRandomAlbum = getRandomAlbum();
module.exports.getRandomTrackFromAlbum = getRandomTrackFromAlbum();

