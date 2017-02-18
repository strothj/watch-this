const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true},
  movieIds: {
    type: Array
  }
});

UserSchema.methods.apiRepr = function() {
  return {
    userName: this.userName || '',
    name: this.firstName + this.lastName
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const MovieSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  poster: {
    type: String
  },
  overview: {
    type: String
  },
  movieId: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', UserSchema);
const Movie = mongoose.model('Movie', MovieSchema);

module.exports = {User, Movie};
