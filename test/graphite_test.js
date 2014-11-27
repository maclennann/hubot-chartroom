var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));

var expect = chai.expect;

describe('chartroom should fucking work', function(){
  beforeEach(function(done){
    robot = {
      respond: sinon.spy(),
      hear: sinon.spy()
    }

    require('../src/chartroom.js')(robot)

    done();
  });

  it('registers a respond listener', function(done) {
    expect(robot.respond).to.have.been.calledWith(/list graphs/i);
    expect(robot.respond).to.have.been.calledWith(/forget all graphs/i);
    expect(robot.respond).to.have.been.calledWith(/forget graph (.*)/i);
    expect(robot.respond).to.have.been.calledWith(/graph me (\w*)( from )?([-\d\w]*)$/i);
    expect(robot.respond).to.have.been.calledWith(/save graph (.*) as (.*)/i);
    done();
  });
});
