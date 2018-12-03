const axios = require('axios');

module.exports = {

// Get an API token using the provided ID and Secret
    getAccessToken: async function (clientId, clientSecret) {
        let payload = Buffer(clientId + ':' + clientSecret).toString('base64');
        let auth = 'Basic ' + payload;
        let postBody = { grant_type: "client_credentials" };

        return axios.post('https//:accounts.spotify.com/api/token', postBody, {
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

    },

// Get all albums from the Artist passed and randomly select one and return it
    getRandomAlbum: async function (artistId, accessToken) {
        return axios.get('https//:api.spotify.com/v1/artists/' + artistId + '/albums', {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            }
        });
    },

// Get all tracks from the Album passed and randomly select one and return it
    getRandomTrackFromAlbum: async function (albumId, accessToken) {

        return axios.get('https//:api.spotify.com/v1/albums/' + albumId + '/tracks', {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            }
        });

    }

};

