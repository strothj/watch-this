const mongoose = require('mongoose');

const MovieSchema = mongoose.Schema({
  movieId: {
    type: Number
  },
  moviePoster: {
    type: String
  },
  title: {
    type: String
  },
  watched: {
    type: Number
  }
});

MovieSchema.statics.createMovie = function(newMovie, callback) {
  newMovie.save(newMovie, callback);
};

module.exports = mongoose.model('Movie', MovieSchema);
