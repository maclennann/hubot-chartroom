/*jslint node:true,unparam:true*/
'use strict';

var request = require('request');
var Promise = require('node-promise').Promise;
var util = require('util');

// Generate a GUID
// Used to identify our uploaded graph message
// when harvesting the S3 URL
var generateGuid = (function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function () {
            if (process.env.DETERMINISTIC_GUID !== undefined) {
                console.warn("Non-random GUID: " + process.env.DETERMINISTIC_GUID);
                return process.env.DETERMINISTIC_GUID;
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    }());

function image(options) {
    var me = image.prototype;

    if (typeof options === "object" && options.hasOwnProperty("server")) {
        me.server = options.server;
    } else if (typeof options === "string") {
        me.server = options;
    } else {
        me.server = process.env.GRAPHITE_SERVER;
    }

    if (options === undefined) {
        options = {};
    }

    me.roomId = options.roomId || process.env.GRAPH_ROOM_ID;
    me.apiToken = options.apiToken || process.env.HIPCHAT_TOKEN;

    // This GUID is used to idenfity the message containing
    // the image once it has been shared in HipChat
    me.guid = options.guid || generateGuid();

    // All of the various URLs we'll be using.
    me.graphiteUrl = util.format("http://%s/render?format=png&%s", me.server);
    me.uploadUrl = util.format("https://api.hipchat.com/v2/room/%s/share/file?auth_token=%s", me.roomId, me.apiToken);
    me.historyUrl = util.format("https://api.hipchat.com/v2/room/%s/history?reverse=false&max-results=10&auth_token=%s", me.roomId, me.apiToken);
}

image.prototype = {
    // Fetch the image data from Graphite and save it into a Buffer
    fetch: function (target) {
        var promise = new Promise(),
            me = this;

        // Set encoding:null so we get it back as a buffer - we need that to send it
        // through to the multipart upload - otherwise things get complicated.
        request({url: util.format(me.graphiteUrl, target), encoding: null},
            function (e, r, b) {
                promise.resolve(b);
            });

        return promise;

    },
    // Share our image buffer with the predetermined HipChat room
    upload: function (buffer) {
        var me = this,
            promise = new Promise();

        request({
            method: "POST",
            uri: me.uploadUrl,
            multipart: [
                {
                    'content-type': 'application/json; charset=UTF-8',
                    // This GUID is used to identify this as our requested image
                    // after it has been uploaded
                    body: JSON.stringify({message: me.guid})
                },
                {
                    'content-type': 'image/png',
                    'content-disposition': 'attachment; name="file"; filename="upload.png"',
                    body: buffer
                }]
        },
            function () {
                promise.resolve(me.guid);
            });

        return promise;
    },
    // Find the URL of the image associated with our GUID
    getLink: function (guid) {
        var promise = new Promise(),
            me = this;

        guid = guid || me.guid;

        // Fetch some recent history from the room and try to find our
        // image's GUID. Then harvest the file URL from the message
        request(me.historyUrl, function (e, r, b) {
            var messages = JSON.parse(b).items,
                fileMessage = messages.filter(function (e) {
                    return e.message === guid;
                });

            if (fileMessage.length === 0) {
                promise.resolve("Failed to fetch graph URL from graph room. GUID not found.");
                return;
            }

            promise.resolve(fileMessage[0].file.url);
        });

        return promise;
    }
};

module.exports = image;
