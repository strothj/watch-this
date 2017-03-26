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
const Movie = require('../models/movie');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);
app.request.isAuthenticated = () => true;

// Generate a user====================================================
// ===================================================================
function generateUser() {
  return new User({
    userName: faker.internet.userName(),
    password: faker.internet.password(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    movieIds: [{title: faker.name.title(), moviePoster: faker.image.imageUrl(), movieId: faker.random.number()}]
  });
}

function generateMovie() {
  return new Movie({
    movieId: faker.random.number(),
    moviePoster: faker.image.imageUrl(),
    title: faker.name.title(),
    watched: faker.random.number()
  });
}

// Add some user data to test with====================================
// ===================================================================
function seedUsers() {
  console.log('Creating user data');
  const data = [];
  for (let i = 0; i < 10; i++) {
    data.push(generateUser());
  }
  return User.insertMany(data);
}

// Add movies to watched list=========================================
// ===================================================================
function seedMovies() {
  console.log('Creating watched movies');
  const data = [];
  for (let i = 0; i < 10; i++) {
    data.push(generateMovie());
  }
  return Movie.insertMany(data);
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
    runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    seedUsers();
    seedMovies();
  });

  afterEach(function() {
    removeUserData();
  });

  after(function() {
    closeServer();
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
      it('should return movie objects and a 200 status', function(done) {
        chai.request(app)
        .get('/users/usersearch')
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
    it('should add a movie to users movie list and return a status 201 and the updated user', function() {
      const movie = {
        title: 'New Movie',
        moviePoster: 'poster.jpg',
        movieId: 100
      };
      User.findOne()
        .then(function(user) {
          return chai.request(app)
          .post('/users/user-movies')
          .query({userName: user.userName})
          .send(movie)
          .then(function(res) {
            console.log(res);
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
    it('should remove a movie from the users list', function() {
      let idToDelete;
      let userName;
      User.findOne()
      .then(function(user) {
        idToDelete = user.movieIds[0].movieId;
        userName = user.userName;
        chai.request(app)
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

  // Test GET watched list data=======================================
  // =================================================================
  describe('GET watched list data', function() {
    xit('should get list of watched movies', function() {
      return chai.request(app)
      .get('/users/watched')
      .then(function(res) {
        console.log(res.body);
        res.body.should.be.array;
        res.body.should.have.lengthOf(10);
        // res.body[1].should.be.instanceof(Movie);
      });
    });
  });

  // Test adding movie as watched=====================================
  // =================================================================
  describe('Add movie to watched list', function() {
    xit('should add a movie to watch list if it does not exist, if it does then it should add to the watched total', function() {
      let movie = {
        title: faker.name.title(),
        moviePoster: faker.image.imageUrl(),
        movieId: faker.random.number()
      };
      return chai.request(app)
      .post('/users/watched')
      .send(movie)
      .then(function(res) {
        res.should.have.status(201);
        res.should.be.json;
        return Movie
        .findOne({movieId: movie.movieId})
        .then(function(watchedMovie) {
          watchedMovie.title.should.equal(movie.title);
          watchedMovie.moviePoster.should.equal(movie.moviePoster);
          watchedMovie.movieId.should.equal(movie.movieId);
          watchedMovie.watched.should.equal(1);
        });
      });
    });
  });
});
