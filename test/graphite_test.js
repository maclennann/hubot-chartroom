var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));

expect = chai.expect;

describe('chartroom', function(){
  beforeEach(function(done){
    robot = {
      respond: sinon.spy(),
      hear: sinon.spy()
    }

    require('../src/chartroom.js')(robot)

    done();
  });

  it('registers a respond listener', function(done) {
    expect(robot.respond).to.have.been.calledWith(/graph me something/);
    expect(robot.respond).to.have.been.calledWith(/save graph what as things/);
    done();
  });
});
