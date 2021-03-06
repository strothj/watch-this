const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const should = chai.should();
const expect = chai.expect;
const mongoose = require('mongoose');
const nock = require('nock');

const {app, runServer, closeServer} = require('../server');
const User = require('../models/user');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

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

// Find a user and sign them in
function signUserIn(done) {
  let username;
  let password;
  User
    .findOne()
    .exec()
    .then(function(user) {
      console.log(user);
      username = user.userName;
      password = user.password;
      chai.request(app)
        .post('users/login')
        .field('username', username)
        .field('password', password)
    });
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
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedUsers();
  });

  // beforeEach(function() {
  //   signUserIn();
  // });

  afterEach(function() {
    return removeUserData();
  });

  after(function() {
    return closeServer();
  });

  // Test that HTML is shown==========================================
  // =================================================================
  describe('HTML', function() {
    xit('should return the html page and a 200 status code', function() {
      return chai.request(app)
        .get('/')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.html;
        });
    });
  });

  // Test user registration===========================================
  // =================================================================
  describe('User registration', function() {
    xit('should register a user returning a status of 201 and the user rep', function() {
      let newUser = {
        userName: faker.internet.userName(),
        password: faker.internet.password(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      };
      let password = newUser.password;
      return chai.request(app)
      .post('/register')
      .send(newUser)
      .then(function(res) {
        res.should.have.status(201);
        res.body.should.be.an.object;
        res.body.should.include.keys('userName', 'name');
        return User.find({userName: newUser.userName});
      })
      .then(function(user) {
        user[0].userName.should.equal(newUser.userName);
        user[0].validatePassword(password)
        .then(result => {
          result.should.be.true;
        });
        user[0].firstName.should.equal(newUser.firstName);
        user[0].lastName.should.equal(newUser.lastName);
        user[0].movieIds.should.be.array;
        expect(user[0].movieIds).to.have.length(0);
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

      beforeEach(function() {
        tmdbApi = nock('https://api.themoviedb.org')
          .get('/3/search/movie')
          .query({
            api_key: apiKey,
            query: 'undefined'
          });
      });
      xit('should return movie objects and a 200 status', function(done) {
        const api = tmdbApi.reply(200, expectedJson);
        chai.request(app)
          .get('/usersearch')
          .then(function(res, err) {
            expect(api.isDone()).to.be.true;
            expect(res.body).to.deep.equal(expectedJson);
            done();
          });
      });
    });
  });

  // Test Get user movie list=========================================
  // =================================================================
  describe('Get user movies', function() {
    xit('should return list of movies for the specific user', function() {
      return User
      .findOne()
      .exec()
      .then(function(user) {
        let userName = user.userName;
        return chai.request(app)
        .get('/user-movies')
        .query({userName: userName})
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
  // Does not work due to user auth currently hard coded==============
  // =================================================================
  describe('POST to user movie list', function() {
    xit('should add a movie to users movie list and return a status 201 and the updated user', function() {
      const movie = {
        title: 'New Movie',
        moviePoster: 'poster.jpg',
        movieId: 100
      };
      return chai.request(app)
      .post('/add-movie')
      .send(movie)
      .then(function(res) {
        res.should.have.status(201);
        res.body.should.be.json;
        res.body.should.include.keys('_id', 'userName', 'password', 'firstName', 'lastName', 'movieIds');
        res.body.movieIds.should.include(movie);
      });
    });
  });

  // Test removing a movie from user list=============================
  // =================================================================
  describe('Remove movie from user list', function() {
    xit('should remove a movie from the users list', function() {
      let userName;
      let idToDelete;
      return User
      .findOne()
      .exec()
      .then(function(user) {
        userName = user.userName;
        idToDelete = user.movieIds[0].movieId;
        return chai.request(app)
        .put('/user-movies')
        .send(idToDelete);
      })
      .then(function(res) {
        res.should.have.status(204);
        return User.find({userName: userName});
      })
        .then(function(user) {
          for (let i = 0; i < user.movieIds.length; i++) {
            expect(idToDelete).to.not.equal(user.movieIds[i].movieId);
          }
        });
    });
  });
});
