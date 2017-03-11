const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const should = chai.should();
const expect = chai.expect;
const mongoose = require('mongoose');
const nock = require('nock');
const bcrypt = require('bcryptjs');

mongoose.Promise = global.Promise;

const {app, runServer, closeServer} = require('../server');
const User = require('../models/user');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);
app.request.isAuthenticated = () => true;

// Generate a user====================================================
// ===================================================================
function generateUser() {
  return {
    userName: faker.internet.userName(),
    password: faker.internet.password(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    movieIds: [{title: faker.name.title(), moviePoster: faker.image.imageUrl(), movieId: faker.random.number()}]
  };
}

// Add some data to test with=========================================
// ===================================================================
function seedUsers() {
  console.log('Creating user data');
  const data = [];
  for (let i = 0; i < 10; i++) {
    data.push(generateUser());
  }
  return User.insertMany(data);
}

// Remove test data===================================================
// ===================================================================
function removeUserData() {
  console.warn('Deleting Database');
  return mongoose.connection.dropDatabase();
}

// TESTS==============================================================
// ===================================================================
describe('testing', function() {

  before(function() {
    app.request.user = generateUser();
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedUsers();
  });

  afterEach(function() {
    return removeUserData();
  });

  after(function() {
    return closeServer();
  });

  // Test that HTML is shown==========================================
  // =================================================================
  describe('HTML', function() {
    it('should return the html page and a 200 status code', function() {
      return chai.request(app)
        .get('/users/login')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.html;
        });
    });
  });

  // Test user registration===========================================
  // =================================================================
  describe('User registration', function() {
    it('should store the user in database and redirect to login page', function() {
      let password = faker.internet.password();
      let newUser = {
        username: faker.internet.userName(),
        password: password,
        password2: password,
        name: faker.name.firstName() + ' ' + faker.name.lastName(),
        email: faker.internet.email()
      };
      return chai.request(app)
      .post('/users/register')
      .send(newUser)
      .then(function(res) {
        res.should.be.html;
        return User.findOne({userName: newUser.username});
      })
      .then(function(user) {
        user.userName.should.equal(newUser.username);
        user.name.should.equal(newUser.name);
        user.movieIds.should.be.array;
        expect(user.movieIds).to.have.length(0);
        bcrypt.compare(password, user.password, function(err, match) {
          expect(match).to.be.true;
        });
      });
    });
  });

  // Test the usersearch==============================================
  // =================================================================
  describe('Usersearch', function() {
    describe('getSearchData', function() {
      let apiKey = process.env.TMDB_API_KEY;
      let tmdbApi;
      const expectedJson = {
        results: [
          {
            movie: 1
          },
          {
            movie: 2
          }
        ]
      };

      beforeEach(() => {
        tmdbApi = nock('https://api.themoviedb.org/3/search')
        .get('/movie')
        .query({
          api_key: apiKey,
          query: 'cars'
        })
        .reply(200, expectedJson);
      });
      xit('should return movie objects and a 200 status', function(done) {
        chai.request(app)
        .get('/usersearch')
        .query({usersearch: 'cars'})
        .then(function(res, err) {
          setTimeout(function() {
            res.should.have.status(200);
            expect(tmdbApi.isDone()).to.be.true;
            expect(res.body).to.deep.equal(expectedJson);
            done();
          });
        });
      });
    });
  });

  // Test Get user movie list=========================================
  // =================================================================
  describe('Get user movies', function() {
    it('should return list of movies for the specific user', function() {
      User.findOne()
      .then(function(user) {
        return chai.request(app)
        .get('/user-movies')
        .query({userName: user.userName})
        .then(function(res) {
          res.should.have.status(200);
          res.body.should.be.array;
          for (let i = 0; i < res.body.length; i++) {
            expect(res.body[i]).to.include.keys('title', 'moviePoster', 'movieId');
          }
        });
      });
    });
  });

  // Test adding a movie to user list=================================
  // =================================================================
  describe('POST to user movie list', function() {
    xit('should add a movie to users movie list and return a status 201 and the updated user', function() {
      const movie = {
        title: 'New Movie',
        moviePoster: 'poster.jpg',
        movieId: 100
      };
      User.findOne()
      .then(function(user) {
        return chai.request(app)
        .post('/user-movies')
        .send(movie)
        .then(function(res) {
          console.log(res.body);
          res.should.have.status(201);
          res.body.should.be.json;
          res.body.should.include.keys('_id', 'userName', 'password', 'firstName', 'lastName', 'movieIds');
          res.body.movieIds.should.include(movie);
        })
        .catch(function(err) {
          throw err;
        });
      });
    });
  });

  // Test removing a movie from user list=============================
  // =================================================================
  describe('Remove movie from user list', function() {
    xit('should remove a movie from the users list', function() {
      let idToDelete;
      let userName;
      User.findOne()
      .then(function(user) {
        console.log(user);
        idToDelete = user.movieIds[0].movieId;
        console.log(idToDelete);
        userName = user.userName;
        return chai.request(app)
        .put('/user-movies')
        .query({userName: user.userName})
        .send(idToDelete.toString())
        .then(function(res) {
          console.log(res.body);
          res.should.have.status(204);
          User.find({userName: userName});
        })
        .then(function(user) {
          for (var i = 0; i < user.movieIds.length; i++) {
            expect(idToDelete).to.not.equal(user.movieIds[i].movieId);
          }
        });
      });
    });
  });
});
