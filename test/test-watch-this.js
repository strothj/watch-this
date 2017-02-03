const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const {app} = require('../sever');

chai.use(chaiHttp);
