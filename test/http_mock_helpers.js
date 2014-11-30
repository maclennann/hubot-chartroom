/*jslint node:true*/
/*global exports:true*/
'use strict';

var nock = require('nock'),
    fs = require('fs');

exports.setUp = function (options) {
    // Mock HTTP response for graphite calls.
    nock("http://" + options.GRAPHITE_SERVER)
        .get('/render?format=png&' + options.GOOD_TARGET)
        .replyWithFile(200, options.TEST_FILE);

    // Mock HTTP responses for HipChat calls
    nock("https://api.hipchat.com")
        .post('/v2/room/' + options.ROOM_ID + '/share/file?auth_token=' + options.API_TOKEN)
        .reply(204)
        .get('/v2/room/' + options.ROOM_ID + '/history?reverse=false&max-results=10&auth_token=' + options.API_TOKEN)
        .reply(200, {
            "items": [
                {
                    "date": "2014-11-29T17:10:49.250773+00:00",
                    "file": {
                        "name": "upload.png",
                        "size": 4851,
                        "thumb_url": options.TEST_FILE,
                        "url": options.TEST_FILE
                    },
                    "id": "85ba004c-0fdd-49ed-b6df-1c554d2ff00c",
                    "mentions": [],
                    "message": options.GUID,
                    "type": "message"
                }
            ]
        });
};

exports.tearDown = function () {
    nock.cleanAll();
};
