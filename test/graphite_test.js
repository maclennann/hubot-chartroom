/*jslint node:true,stupid:true*/
/*global describe:true,beforeEach:true,expect:true,it:true*/
'use strict';

var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('chartroom should listen for commands', function () {
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

describe('graphite operations', function () {
    var nock = require('nock'),
        Graph = require('../src/graphite.js'),
        fs = require('fs'),

        GRAPHITE_SERVER = "graphite.normmaclennan.com",
        TEST_FILE = './test/test-data/test-image.png',
        GOOD_TARGET = "target=test",
        BAD_TARGET = "lolwut";

    nock("http://" + GRAPHITE_SERVER)
        .get('/render?format=png&' + GOOD_TARGET)
        .replyWithFile(200, TEST_FILE);

    it('should fetch a buffer for the graph', function (done) {
        var graph = new Graph({
            target: GOOD_TARGET,
            server: GRAPHITE_SERVER
        });

        graph.fetch().then(function (image) {
            var expected = fs.readFileSync(TEST_FILE);

            expect(image.toString()).to.equal(expected.toString());
            done();
        });
    });

    it('should return undefined if it cannot fetch the graph', function (done) {
        var graph = new Graph({
            target: BAD_TARGET,
            server: GRAPHITE_SERVER
        });

        graph.fetch().then(function (image) {
            expect(image).to.equal(undefined);
            done();
        });
    });
});
