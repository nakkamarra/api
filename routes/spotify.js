const axios = require('axios');
const qs = require('querystring');

const getAccessToken = async function (clientId, clientSecret) {
    let payload = Buffer(clientId + ':' + clientSecret).toString('base64');
    let auth = 'Basic ' + payload;

    return await axios.post('https://accounts.spotify.com/api/token',
        qs.stringify({grant_type: "client_credentials"}), {
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
};

const getRandomAlbum = async function (artistId, accessToken) {

    return await axios.get('https://api.spotify.com/v1/artists/' + artistId + '/albums', {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        }
    });
};

const getRandomTrackFromAlbum = async function (albumId, accessToken) {

    return axios.get('https://api.spotify.com/v1/albums/' + albumId + '/tracks', {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        }
    });

};

module.exports.getAccessToken = getAccessToken;
module.exports.getRandomAlbum = getRandomAlbum;
module.exports.getRandomTrackFromAlbum = getRandomTrackFromAlbum;


