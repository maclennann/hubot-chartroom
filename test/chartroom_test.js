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
        expect(robot.respond).to.have.been.calledWith(/save graph (\w*) as ([\S]*)( on )?(\w*)/i);
        done();
    });
});

describe('chartroom stored graph list', function () {
    var robotHelpers = require('./chartroom_test_helpers'),
        httpHelpers = require('./http_mock_helpers'),
        GRAPHITE_SERVER = process.env.GRAPHITE_SERVER,
        GOOD_TARGET = "target=test",
        ROOM_ID = process.env.GRAPH_ROOM_ID,
        API_TOKEN = process.env.HIPCHAT_TOKEN,
        TEST_FILE = './test/test-data/test-image.png',
        GUID = 'im-a-good-guid';

    beforeEach(function (done) {
        robotHelpers.setUp();
        httpHelpers.setUp({
            GRAPHITE_SERVER: GRAPHITE_SERVER,
            GOOD_TARGET: GOOD_TARGET,
            ROOM_ID: ROOM_ID,
            API_TOKEN: API_TOKEN,
            TEST_FILE: TEST_FILE,
            GUID: GUID
        });
        done();
    });

    afterEach(function () {
        robotHelpers.tearDown();
        httpHelpers.tearDown();
    });

    it('should save graphs', function (done) {
        robotHelpers.assertGraphs(0)
            .then(function () {
                return robotHelpers.assertSaveGraph("target=lol", "lolgraph");
            })
            .then(function () {
                robotHelpers.assertGraphs(1);
                done();
            });
    });

    it('should not save two graphs with the same name', function (done) {
        robotHelpers.assertSaveGraph('target=lol', 'lolgraph')
            .then(function () {
                return robotHelpers.saveGraph('target=broken', 'lolgraph');
            })
            .then(function (strings) {
                expect(strings[0]).to.have.string('Graph lolgraph already exists.');
                done();
            });
    });

    it('should forget graphs', function (done) {
        robotHelpers.assertSaveGraph('target=lol', 'lolgraph')
            .then(function () {
                return robotHelpers.assertForgetGraph('lolgraph');
            })
            .then(function () {
                robotHelpers.assertGraphs(0);
                done();
            });
    });

    it('should forget all graphs', function (done) {
        robotHelpers.assertSaveGraph('target=lol', 'lolgraph')
            .then(robotHelpers.assertForgetAllGraphs)
            .then(function () {
                robotHelpers.assertGraphs(0);
                done();
            });
    });

    it('should quietly fail if graph to forget doesn\'t exist', function (done) {
        robotHelpers.assertForgetGraph('lolgraph')
            .then(function () {
                robotHelpers.assertGraphs(0);
                done();
            });
    });

    it('should fetch the correct saved graph', function (done) {
        // Have our GUID generate return a known value
        process.env.DETERMINISTIC_GUID = GUID;

        robotHelpers.assertSaveGraph(GOOD_TARGET, 'graph')
            .then(function () {
                return robotHelpers.graphMe('graph');
            })
            .then(function (strings) {
                expect(strings[0]).to.have.string(TEST_FILE);

                // Put the GUID generated back to random
                delete process.env.DETERMINISTIC_GUID;
                done();
            });

    });

    it('should save graphs for non-default servers', function (done) {
        // Have our GUID generate return a known value
        process.env.DETERMINISTIC_GUID = GUID;
        var nonDefaultGraphite = "nondefaultgraphite";


        httpHelpers.makeGraphiteMock({
            GRAPHITE_SERVER: nonDefaultGraphite,
            GOOD_TARGET: "nondefaulttarget",
            TEST_FILE: TEST_FILE
        });

        expect(httpHelpers.pendingMocksForServer(nonDefaultGraphite)).to.not.be.empty();

        robotHelpers.assertSaveGraph("nondefaulttarget", "newgraph", nonDefaultGraphite)
            .then(function () {
                return robotHelpers.graphMe("newgraph");
            }).then(function (strings) {
                expect(strings[0]).to.have.string(TEST_FILE);
                expect(httpHelpers.pendingMocksForServer(nonDefaultGraphite)).to.be.empty();

                // Put the GUID generated back to random
                delete process.env.DETERMINISTIC_GUID;
                done();
            });

    });

    it('should fetch the correct saved graph from a specific timerange', function (done) {
        // Have our GUID generate return a known value
        process.env.DETERMINISTIC_GUID = GUID;

        robotHelpers.assertSaveGraph(GOOD_TARGET, 'graph')
            .then(function () {
                return robotHelpers.graphMeFrom('graph', '-2h');
            })
            .then(function (strings) {
                expect(strings[0]).to.have.string(TEST_FILE);

                // Put the GUID generated back to random
                delete process.env.DETERMINISTIC_GUID;
                done();
            });
    });

    it('should fetch a graph from an unsaved target', function (done) {
        // Have our GUID generate return a known value
        process.env.DETERMINISTIC_GUID = GUID;

        robotHelpers.graphMeFrom(GOOD_TARGET)
            .then(function (strings) {
                expect(strings[0]).to.have.string(TEST_FILE);

                // Put the GUID generated back to random
                delete process.env.DETERMINISTIC_GUID;
                done();
            });
    });
});
