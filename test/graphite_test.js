/*jslint node:true,stupid:true*/
/*global describe:true,beforeEach:true,expect:true,it:true,afterEach:true*/
'use strict';

var chai = require('chai');
chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('graphite operations', function () {
    //var nock = require('nock'),
    var httpHelpers = require('./http_mock_helpers'),
        Graph = require('../src/graphite.js'),
        fs = require('fs'),

        // Test data setup
        GRAPHITE_SERVER = process.env.GRAPHITE_SERVER,
        TEST_FILE = './test/test-data/test-image.png',
        GOOD_TARGET = "target=test",
        BAD_TARGET = "lolwut",
        ROOM_ID = process.env.GRAPH_ROOM_ID,
        API_TOKEN = process.env.HIPCHAT_TOKEN,
        GUID = "not-a-guid-really";

    // Set up our mock HTTP responses before each test
    beforeEach(function (done) {
        httpHelpers.setUp({
            GRAPHITE_SERVER: GRAPHITE_SERVER,
            TEST_FILE: TEST_FILE,
            GOOD_TARGET: GOOD_TARGET,
            ROOM_ID: ROOM_ID,
            API_TOKEN: API_TOKEN,
            GUID: GUID
        });

        done();
    });

    afterEach(function (done) {
        httpHelpers.tearDown();
        done();
    });

    it('should fetch a buffer for the graph', function (done) {
        var graph = new Graph({
            server: GRAPHITE_SERVER
        });

        graph.fetch(GOOD_TARGET).then(function (image) {
            var expected = fs.readFileSync(TEST_FILE);

            expect(image.toString()).to.equal(expected.toString());
            done();
        });
    });

    it('should return undefined if it cannot fetch the graph', function (done) {
        var graph = new Graph({
            server: GRAPHITE_SERVER
        });

        graph.fetch(BAD_TARGET).then(function (image) {
            expect(image).to.be.undefined();
            done();
        });
    });

    it('should get the link for its uploaded image by GUID', function (done) {
        var graph = new Graph({
            server: GRAPHITE_SERVER,
            roomId: ROOM_ID,
            apiToken: API_TOKEN,
            guid: GUID
        });

        graph.getLink().then(function (link) {
            expect(link).to.be.equal(TEST_FILE);
            done();
        });
    });

    it('should return an error if it can\'t find our link by GUID', function (done) {
        var graph = new Graph({
            server: GRAPHITE_SERVER,
            roomId: ROOM_ID,
            apiYoken: API_TOKEN,
            guid: 'garbage-guid-yo'
        });

        graph.getLink().then(function (link) {
            expect(link).to.have.string('GUID not found.');
            done();
        });
    });

    it('should use environment variable where no overrides are provided', function (done) {
        // EnvVars are set in `.env` at the root of this project
        var graph = new Graph();

        //expect(graph.target).to.be.equal(target);
        expect(graph.server).to.be.equal(process.env.GRAPHITE_SERVER);
        expect(graph.roomId).to.be.equal(process.env.GRAPH_ROOM_ID);
        expect(graph.apiToken).to.be.equal(process.env.HIPCHAT_TOKEN);

        done();
    });

    it('should generate a valid guid when no id is provided', function (done) {
        var graph = new Graph(GOOD_TARGET);
        expect(graph.guid).to.match(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i);

        done();
    });
});
