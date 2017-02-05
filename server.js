const express = require('express');
const app = express();
const request = require('request');
const bodyParser = require('body-parser');
const jsonParser = require('body-parser').json();
require('dotenv').config();

app.use(bodyParser.json());

app.use(express.static('public'));
app.listen(process.env.PORT || 8080);

app.get('/usersearch', jsonParser, (req, res) => {
  let searchKeyword = req.query.usersearch;
  let apiKey = process.env.TMDB_API_KEY;
  request.get('https://api.themoviedb.org/3/search/movie?api_key=' + apiKey + '&query=' + searchKeyword, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.json(JSON.parse(body));
    }
  });
});
module.exports = {app};
