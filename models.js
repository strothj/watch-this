const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const userSchema = mongoose.Schema({
  userName: {type: String, required: true},
  password: {type: String, required: true},
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  movieIds: {type: Array}
});

const movieSchema = mongoose.Schema({
  title: {type: String, required: true},
  poster: {type: String},
  overview: {type: String}
});

const User = mongoose.model('User', userSchema);
const Movie = mongoose.model('Movie', movieSchema);

module.exports = {User, Movie};
