const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const {app} = require('../server');

chai.use(chaiHttp);

describe('HTML', function() {
  it('should return the html page and a 200 status code', function() {
    return chai.request(app)
      .get('/')
      .then(function(res) {
        res.should.have.status(200);
        res.should.be.html;
      });
  });
});
