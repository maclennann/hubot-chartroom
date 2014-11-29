/*jslint node:true,stupid:true*/
/*global describe:true,beforeEach:true,expect:true,it:true*/
'use strict';

var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var expect = chai.expect;

describe('graphite operations', function () {
    var nock = require('nock'),
        Graph = require('../src/graphite.js'),
        fs = require('fs'),

        // Test data setup
        GRAPHITE_SERVER = "graphite.normmaclennan.com",
        TEST_FILE = './test/test-data/test-image.png',
        GOOD_TARGET = "target=test",
        BAD_TARGET = "lolwut",
        ROOM_ID = '12345',
        API_TOKEN = 'ABCDEF',
        GUID = "not-a-guid-really";

    // Set up our mock HTTP responses before each test
    beforeEach(function (done) {
        // Mock HTTP response for graphite calls.
        nock("http://" + GRAPHITE_SERVER)
            .get('/render?format=png&' + GOOD_TARGET)
            .replyWithFile(200, TEST_FILE);

        // Mock HTTP responses for HipChat calls
        nock("https://api.hipchat.com")
            .post('/v2/room/' + ROOM_ID + '/share/file?auth_token=' + API_TOKEN)
            .reply(204)
            .get('/v2/room/' + ROOM_ID + '/history?reverse=false&max-results=10&auth_token=' + API_TOKEN)
            .reply(200, {
                "items": [
                    {
                        "date": "2014-11-29T17:10:49.250773+00:00",
                        "file": {
                            "name": "upload.png",
                            "size": 4851,
                            "thumb_url": TEST_FILE,
                            "url": TEST_FILE
                        },
                        "id": "85ba004c-0fdd-49ed-b6df-1c554d2ff00c",
                        "mentions": [],
                        "message": GUID,
                        "type": "message"
                    }
                ]
            });
        done();
    });

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
            expect(image).to.be.undefined();
            done();
        });
    });

    it('should get the link for its uploaded image by GUID', function (done) {
        var graph = new Graph({
            target: GOOD_TARGET,
            server: GRAPHITE_SERVER,
            room_id: ROOM_ID,
            api_token: API_TOKEN,
            guid: GUID
        });

        graph.getLink().then(function (link) {
            expect(link).to.be.equal(TEST_FILE);
            done();
        });
    });

    it('should return an error if it can\'t find our link by GUID', function (done) {
        var graph = new Graph({
            target: GOOD_TARGET,
            server: GRAPHITE_SERVER,
            room_id: ROOM_ID,
            api_token: API_TOKEN,
            guid: 'garbage-guid-yo'
        });

        graph.getLink().then(function (link) {
            expect(link).to.have.string('GUID not found.');
            done();
        });
    });

    it('should use environment variable where no overrides are provided', function (done) {
        var target = "target=local", graph;
        process.env.GRAPHITE_SERVER = "www.google.com";
        process.env.GRAPH_ROOM_ID = "my-room";
        process.env.HIPCHAT_TOKEN = "my-token";

        graph = new Graph(target);

        expect(graph.target).to.be.equal(target);
        expect(graph.server).to.be.equal(process.env.GRAPHITE_SERVER);
        expect(graph.room_id).to.be.equal(process.env.GRAPH_ROOM_ID);
        expect(graph.api_token).to.be.equal(process.env.HIPCHAT_TOKEN);

        done();
    });

    it('should generate a valid guid when no id is provided', function (done) {
        var graph = new Graph(GOOD_TARGET);
        expect(graph.guid()).to.match(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i);

        done();
    });
});
