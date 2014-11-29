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
