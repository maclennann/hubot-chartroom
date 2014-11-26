var request = require('request');
var Promise = require('node-promise').Promise;
var util = require('util');

// Generate a GUID
// Used to identify our uploaded graph message
// when harvesting the S3 URL
var generateGuid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
  };
})();

function image (options) {
  if(typeof options === "object" && options.hasOwnProperty("target")){
    this.target = options.target;
    this.server = options.server;
    this.room_id = options.room_id;
    this.api_token = options.api_token;
  }
  else if(typeof options === "string"){
    this.target = options;
    this.server = process.env.GRAPHITE_SERVER;
    this.room_id = process.env.GRAPH_ROOM_ID;
    this.api_token = process.env.HIPCHAT_TOKEN;
  }

  this.guid = generateGuid();
  this.image = undefined;

  this.graphite_url = util.format("http://%s/render?format=png&%s", this.server, this.target);
  this.upload_url = util.format("https://api.hipchat.com/v2/room/%s/share/file?auth_token=%s", this.room_id, this.api_token);
  this.history_url = util.format("https://api.hipchat.com/v2/room/%s/history?reverse=false&max-results=10&auth_token=%s", this.room_id, this.api_token);
};

image.prototype = {
  fetch: function() {
    var promise = new Promise();
    var me = this;

    // Set encoding:null so we get it back as a buffer - we need that to send it
    // through to the multipart upload - otherwise things get complicated.
    request({url: me.graphite_url, encoding: null},
      function(e,r,b){
        me.image = b;
        promise.resolve();
      });

    return promise;

  },
  upload: function() {
    var me = this;
    var promise = new Promise();

    request({
      method: "POST",
      uri: me.upload_url,
      multipart: [
      {
        'content-type': 'application/json; charset=UTF-8',
        body: JSON.stringify({message: me.guid})
      },
      {
        'content-type': 'image/png',
        'content-disposition': 'attachment; name="file"; filename="upload.png"',
        body: me.image
      }]
    },
    function(e,r,b) {
      if(e) {
        promise.resolve("failed to upload graph: " + error);
      }

      promise.resolve();
    });

    return promise;
  },
  getLink: function() {
    var promise = new Promise();
    var me = this;

    request(me.history_url, function(e,r,b) {
      if(e) {
        promise.resolve("Failed to fetch graph URL from graph room. " + e);
      }

      var messages = JSON.parse(b)["items"];

      var fileMessage = messages.filter(function(e) {
        return e["message"] == me.guid;
      });

      if(fileMessage.length === 0) {
        promise.resolve("Failed to fetch graph URL from graph room. GUID not found.");
      }

      promise.resolve(fileMessage[0]["file"]["url"]);
    });

    return promise;
  }
};

module.exports = image;
