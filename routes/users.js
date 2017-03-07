const express = require('express');
const router = express.Router();
const fetch = require('isomorphic-fetch');
const bodyParser = require('body-parser');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const authenticationMiddleware = require('../middleware/authenticationMiddleware');
const LocalStrategy = require('passport-local').Strategy;

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const User = require('../models/user');
const Movie = require('../models/movie');

router.use(bodyParser.json());

// Render Register Page===========================================
// ===============================================================
router.get('/register', function(req, res) {
  res.render('register');
});

// Render Login Page==============================================
// ===============================================================
router.get('/login', function(req, res) {
  res.render('login');
});

// Register User==================================================
// ===============================================================
router.post('/register', function(req, res) {
  let name = req.body.name;
  let email = req.body.email;
  let username = req.body.username;
  let password = req.body.password;
  let password2 = req.body.password2;

  // Validation
  req.checkBody('name', 'Name is Required').notEmpty();
  req.checkBody('email', 'Email is Required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();

  if (errors) {
    res.render('register', {
      errors: errors
    });
  } else {
    let newUser = new User({
      name: name,
      email: email,
      userName: username,
      password: password
    });
    User.createUser(newUser, function(err, user) {
      if (err) throw err;
      console.log(user);
    });
    res.redirect('/users/login');
    req.flash('success_msg', 'You are registerd and can now login');
  }
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user) {
      if (err) {
        throw err;
      }
      if (!user) {
        return done(null, false, {message: 'Unknown user'});
      }
      User.comparePassword(password, user.password, function(err, isMatch) {
        if (err) {
          throw err;
        }
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, {message: 'Invalid password'});
        }
      });
    });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

// User Login=====================================================
// ===============================================================
router.post('/login',
  passport.authenticate('local', {successRedirect: '/', failureRedirect: '/users/login', failureFlash: true}),
  function(req, res) {
    let isLoggedIn = !!req.user;
    res.redirect('/', {loggedIn: isLoggedIn});
  });

// User Logout
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/users/login');
  req.flash('success_msg', 'You are logged out');
});

// Get user movie list============================================
// ===============================================================
router.get('/user-movies', authenticationMiddleware, jsonParser, (req, res) => {
  User
  .findOne(
    {userName: req.user.username})
  .exec()
  .then(user => {
    let data = req.user.movieIds;
    res.send(data);
  });
});

// User search call to TMDB API==================================
// ==============================================================
router.get('/usersearch', authenticationMiddleware, jsonParser, (req, res) => {
  let searchKeyword = req.query.usersearch;
  let apiKey = process.env.TMDB_API_KEY;
  fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${searchKeyword}`)
  .then(response => {
    if (response.status < 200 || response.status >= 300) {
      const error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
    return response.json();
  })
  .then(response => res.json(response))
  .catch(err => {
    return res.json(err);
  });
});

// Add movie to user list========================================
// ==============================================================
router.post('/user-movies', authenticationMiddleware, jsonParser, (req, res) => {
  let movieInstance = 0;
  let user = req.user;
  console.log(user);
  for (let i = 0; i < user.movieIds.length; i++) {
    if (user.movieIds[i].movieId === req.body.movieId) {
      movieInstance++;
    }
  }
  if (movieInstance === 0) {
    User.findOneAndUpdate(
    {userName: user.userName},
    {$push: {movieIds: req.body}},
    {safe: true, upsert: true})
    .exec()
    .then(user => {
      res.status(201).json(user);
    })
    .catch(err => {
      throw err;
    });
  } else {
    return res.status(500).json({message: 'Movie already exists in user list'});
  }
});

// Remove movie from user list====================================
// ===============================================================
router.put('/user-movies', authenticationMiddleware, jsonParser, (req, res) => {
  User
  .findOneAndUpdate(
    {userName: req.user.userName},
    {$pull: {movieIds: {movieId: req.body.movieId}}})
    .exec()
    .then(user => {
      res.status(204).json(user);
    })
    .catch(err => {
      throw err;
    });
});

// Get Most Watched List==========================================
// ===============================================================
router.get('/watched', authenticationMiddleware, jsonParser, (req, res) => {
  Movie
  .find().sort({watched: -1})
  .exec()
  .then(data => {
    res.send(data);
  });
});

// Add Movie as Watched===========================================
// ===============================================================
router.post('/watched', authenticationMiddleware, jsonParser, (req, res) => {
  return Movie
    .findOne({movieId: req.body.movieId})
    .count()
    .exec()
    .then(count => {
      if (count > 0) {
        return Movie
          .findOneAndUpdate(
            {movieId: req.body.movieId},
            {$inc: {watched: 1}})
          .then(() => {
            res.status(201).json({message: 'Movie watched'});
          });
      } else {
        let newMovie = new Movie({
          movieId: req.body.movieId,
          moviePoster: req.body.moviePoster,
          title: req.body.title,
          watched: 1
        });
        Movie.createMovie(newMovie, function(err, movie) {
          console.log('creating movie');
          if (err) {
            console.log(err);
            throw err;
          } else {
            res.status(201);
            console.log(movie);
          }
        });
      }
    });
});

module.exports = router;
