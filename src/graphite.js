/*jslint node:true,unparam:true,todo:true*/
'use strict';

var request = require('request');
var PromiseClass = require('node-promise').Promise;
var util = require('util');

// Generate a GUID
// Used to identify our uploaded graph message
// when harvesting the S3 URL
var generateGuid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function () {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    };

function image(options) {
    var me = this;

    if (typeof options === "object" && options.hasOwnProperty("target")) {
        me.target = options.target;
    } else if (typeof options === "string") {
        me.target = options;
    }

    me.server = options.server || process.env.GRAPHITE_SERVER;
    me.room_id = options.room_id || process.env.GRAPH_ROOM_ID;
    me.api_token = options.api_token || process.env.HIPCHAT_TOKEN;

    // This GUID is used to idenfity the message containing
    // the image once it has been shared in HipChat
    me.guid = options.guid || generateGuid();

    // This will hold the buffer with the image data
    me.image = undefined;

    // All of the various URLs we'll be using.
    me.graphite_url = util.format("http://%s/render?format=png&%s", me.server, me.target);
    me.upload_url = util.format("https://api.hipchat.com/v2/room/%s/share/file?auth_token=%s", me.room_id, me.api_token);
    me.history_url = util.format("https://api.hipchat.com/v2/room/%s/history?reverse=false&max-results=10&auth_token=%s", me.room_id, me.api_token);
}

image.prototype = {
    // Fetch the image data from Graphite and save it into a Buffer
    fetch: function () {
        var promise = new PromiseClass(),
            me = this;

        // Set encoding:null so we get it back as a buffer - we need that to send it
        // through to the multipart upload - otherwise things get complicated.
        request({url: me.graphite_url, encoding: null},
            function (e, r, b) {
                me.image = b;

                // Return the buffer to the user in case they want
                // to write to file or something
                promise.resolve(me.image);
            });

        return promise;

    },
    // Share our image buffer with the predetermined HipChat room
    upload: function () {
        var me = this,
            promise = new PromiseClass();

        request({
            method: "POST",
            uri: me.upload_url,
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
                    body: me.image
                }]
        },
            function (e) {
                if (e) {
                    promise.resolve("failed to upload graph: " + e);
                }

                promise.resolve();
            });

        return promise;
    },
    // Find the URL of the image associated with our GUID
    getLink: function () {
        var promise = new PromiseClass(),
            me = this;

        // Fetch some recent history from the room and try to find our
        // image's GUID. Then harvest the file URL from the message
        request(me.history_url, function (e, r, b) {
            if (e) {
                promise.resolve("Failed to fetch graph URL from graph room. " + e);
                return;
            }

            var messages = JSON.parse(b).items,
                fileMessage = messages.filter(function (e) {
                    return e.message === me.guid;
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
