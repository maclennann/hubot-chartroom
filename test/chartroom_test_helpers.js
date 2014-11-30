/*jslint node:true,stupid:true,nomen:true,unparam:true*/
'use strict';

// Sorry, hubot-mock-adapter requires coffeescript :(
require('coffee-script/register');
var robot, user, adapter,
    path = require('path'),

    Robot = require('../node_modules/hubot-mock-adapter/node_modules/hubot/src/robot'),
    TextMessage = require('../node_modules/hubot-mock-adapter/node_modules/hubot/src/message').TextMessage,
    Promise = require('node-promise').Promise,

    chai = require('chai'),
    expect = chai.expect;

// Create our mock hubot
exports.setUp = function () {
    // create new robot, without http, using the mock adapter
    robot = new Robot(null, "mock-adapter", false, "hubot");

    robot.adapter.on("connected", function () {
        // only load scripts we absolutely need
        process.env.HUBOT_AUTH_ADMIN = "1";
        robot.loadFile(
            path.resolve(
                path.join("../hubot-mock-adapter/node_modules/hubot/src/scripts")
            )
        );

        // load the module under test and configure it for the
        // robot.  This is in place of external-scripts
        require("../index")(robot);

        // create a user
        user = robot.brain.userForId("1", {
            name: "jasmine",
            room: "#jasmine"
        });

        adapter = robot.adapter;
    });

    robot.run();
};

// Clear our mock hubot
exports.tearDown = function () {
    robot.shutdown();
};

exports.saveGraph = function (target, name) {
    var promise = new Promise();
    adapter.once('send', function (envelope, strings) {
        promise.resolve(strings);
    });

    adapter.receive(new TextMessage(user, "hubot save graph " + name + " as " + target));

    return promise;
};

exports.listGraphs = function () {
    var promise = new Promise();
    adapter.once('send', function (envelope, strings) {
        promise.resolve(strings);
    });

    adapter.receive(new TextMessage(user, "hubot list graphs"));

    return promise;
};

exports.forgetGraph = function (name) {
    var promise = new Promise();
    adapter.once('send', function (envelope, strings) {
        promise.resolve(strings);
    });

    adapter.receive(new TextMessage(user, "hubot forget graph " + name));

    return promise;
};

exports.forgetAllGraphs = function () {
    var promise = new Promise();
    adapter.once('send', function (envelope, strings) {
        promise.resolve(strings);
    });

    adapter.receive(new TextMessage(user, "hubot forget all graphs"));

    return promise;
};

exports.graphMe = function (name) {
    var promise = new Promise(),
        messages = 0;

    adapter.on('send', function (envelope, strings) {
        // We need to resolve on the second message
        // since the first one is just a "working..."
        // confirmation
        messages += 1;
        if (messages === 2) {
            promise.resolve(strings);
            adapter.removeAllListeners('send');
        }
    });

    adapter.receive(new TextMessage(user, "hubot graph me " + name));

    return promise;
};

exports.graphMeFrom = function (name, from) {
    var promise = new Promise(),
        messages = 0;

    adapter.on('send', function (envelope, strings) {
        // We need to resolve on the second message
        // since the first one is just a "working..."
        // confirmation
        messages += 1;
        if (messages === 2) {
            promise.resolve(strings);
            adapter.removeAllListeners('send');
        }
    });

    adapter.receive(new TextMessage(user, "hubot graph me " + name + " from " + from));

    return promise;
};

exports.assertSaveGraph = function (target, name) {
    var promise = new Promise();
    exports.saveGraph(target, name)
        .then(function (strings) {
            expect(strings[0]).to.have.string('You can now use "graph me '
                + name + '" to see this graph');
            promise.resolve();
        });

    return promise;
};

exports.assertForgetAllGraphs = function () {
    var promise = new Promise();

    exports.forgetAllGraphs()
        .then(function (strings) {
            expect(strings[0]).to.have.string('(yougotitdude)');
            promise.resolve();
        });

    return promise;
};

exports.assertGraphs = function (number) {
    var promise = new Promise();

    exports.listGraphs()
        .then(function (strings) {
            expect(strings[0]).to.have.string('Saved graphs found: ' + number);
            promise.resolve();
        });

    return promise;
};

exports.assertForgetGraph = function (name) {
    var promise = new Promise();

    exports.forgetGraph(name)
        .then(function (strings) {
            expect(strings[0]).to.have.string('(yougotitdude)');
            promise.resolve();
        });

    return promise;
};
