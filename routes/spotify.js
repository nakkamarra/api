const https = require('https');

// Get an API token using the provided ID and Secret
async function getAccessToken(clientId, clientSecret) {
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

    https.request(postData, function (response) {
        return new Promise((resolve, reject) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                let body = [];

                response.on('data', (chunk => {
                    body.push(chunk)
                }));

                response.on('end', () => {
                    let responseBody = body.join('');
                    let json = JSON.parse(responseBody);
                    resolve(json['access_token'])
                });
            } else {
                reject(new Error('no token'))
            }
        });
    });
}
// Get all albums from the Artist passed and randomly select one and return it
async function getRandomAlbum(artistId, accessToken) {

    let data = {
        host: 'api.spotify.com',
        port: 443,
        path: '/v1/artists/' + artistId + '/albums',
        method: 'GET',
        headers : {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    https.get(data, function (response) {
        return new Promise((resolve, reject) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                let body = [];

                response.on('data', (chunk => {
                    body.push(chunk)
                }));

                response.on('end', () => {
                    let responseBody = body.join('');
                    let json = JSON.parse(responseBody);
                    let albums = json['items'];
                    let randomAlbum = _.sample(albums);
                    resolve(randomAlbum['id'])
                });
            } else {
                reject(new Error('failed to get random album'))
            }
        });
    });
}

// Get all tracks from the Album passed and randomly select one and return it
async function getRandomTrackFromAlbum(albumId, accessToken) {
    let data = {
        host: 'api.spotify.com',
        port: 443,
        path: '/v1/albums/' + albumId + '/tracks',
        method: 'GET',
        headers : {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    https.get(data, function (response) {
        return new Promise((resolve, reject) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                let body = [];

                response.on('data', (chunk => {
                    body.push(chunk)
                }));

                response.on('end', () => {
                    let responseBody = body.join('');
                    let json = JSON.parse(responseBody);
                    let tracks = json['items'];
                    let randomTrack = _.sample(tracks);
                    resolve(randomTrack['external_urls'])
                });
            } else {
                reject(new Error('failed to get random song'))
            }
        });
    });
}

// Export the helper functions
module.exports.getAccessToken = getAccessToken();
module.exports.getRandomAlbum = getRandomAlbum();
module.exports.getRandomTrackFromAlbum = getRandomTrackFromAlbum();

