/*jslint node:true,stupid:true,unparam:true*/
/*global describe:true,beforeEach:true,expect:true,it:true,afterEach:true*/
'use strict';

var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('chartroom setup', function () {
    var robot;

    beforeEach(function (done) {
        robot = {
            respond: sinon.spy(),
            hear: sinon.spy()
        };

        require('../src/chartroom.js')(robot);

        done();
    });

    it('registers a bunch of respond listeners', function (done) {
        expect(robot.respond).to.have.been.calledWith(/list graphs/i);
        expect(robot.respond).to.have.been.calledWith(/forget all graphs/i);
        expect(robot.respond).to.have.been.calledWith(/forget graph (\w*)/i);
        expect(robot.respond).to.have.been.calledWith(/graph me (\S*)( from )?([\-\d\w]*)$/i);
        expect(robot.respond).to.have.been.calledWith(/save graph (\w*) as ([\S]*)/i);
        done();
    });
});

describe('chartroom stored graph list', function () {
    // Sorry, hubot-mock-adapter requires coffeescript :(
    require('coffee-script/register');
    var robot, user, adapter,
        path = require('path'),
        Robot = require('../node_modules/hubot-mock-adapter/node_modules/hubot/src/robot'),
        TextMessage = require('../node_modules/hubot-mock-adapter/node_modules/hubot/src/message').TextMessage,
        Promise = require('node-promise').Promise;

    beforeEach(function (done) {
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

        done();
    });

    afterEach(function () {
        robot.shutdown();
    });


    function saveGraph(target, name) {
        var promise = new Promise();
        adapter.once('send', function (envelope, strings) {
            promise.resolve(strings);
        });

        adapter.receive(new TextMessage(user, "hubot save graph " + name + " as " + target));

        return promise;
    }

    function listGraphs() {
        var promise = new Promise();
        adapter.once('send', function (envelope, strings) {
            promise.resolve(strings);
        });

        adapter.receive(new TextMessage(user, "hubot list graphs"));

        return promise;
    }

    function forgetGraph(name) {
        var promise = new Promise();
        adapter.once('send', function (envelope, strings) {
            promise.resolve(strings);
        });

        adapter.receive(new TextMessage(user, "hubot forget graph " + name));

        return promise;
    }

    function assertSaveGraph(target, name) {
        var promise = new Promise();
        saveGraph(target, name)
            .then(function (strings) {
                expect(strings[0]).to.have.string('You can now use "graph me '
                    + name + '" to see this graph');
                promise.resolve();
            });

        return promise;
    }

    function assertGraphs(number) {
        var promise = new Promise();

        listGraphs()
            .then(function (strings) {
                expect(strings[0]).to.have.string('Saved graphs found: ' + number);
                promise.resolve();
            });

        return promise;
    }

    function assertForgetGraph(name) {
        var promise = new Promise();

        forgetGraph(name)
            .then(function (strings) {
                expect(strings[0]).to.have.string('(yougotitdude)');
                promise.resolve();
            });

        return promise;
    }



    it('should save graphs', function (done) {
        assertGraphs(0)
            .then(function () {
                return assertSaveGraph("target=lol", "lolgraph");
            })
            .then(function () {
                assertGraphs(1);
                done();
            });
    });

    it('should not save two graphs with the same name', function (done) {
        assertSaveGraph('target=lol', 'lolgraph')
            .then(function () {
                return saveGraph('target=broken', 'lolgraph');
            })
            .then(function (strings) {
                expect(strings[0]).to.have.string('Graph lolgraph already exists.');
                done();
            });
    });

    it('should forget graphs', function (done) {
        assertSaveGraph('target=lol', 'lolgraph')
            .then(function () {
                return assertForgetGraph('lolgraph');
            })
            .then(function () {
                assertGraphs(0);
                done();
            });
    });
});
