// Mock data
let MOCK_USER_MOVIE_DATA = {
  user: 'steve',
  password: '',
  movies: [
    {
      id: 1,
      title: 'Days of Thunder',
      imagePath: '/something.jpg'
    },
    {
      id: 2,
      title: 'The Secret Life of Pets',
      imagePath: '/something2.jpg'
    },
    {
      id: 3,
      title: 'The Shawshank Redemption',
      imagePath: '/something3.jpg'
    }
  ]
};

let MOCK_SEARCH_DATA = {
  results: [
    {
      id: 1,
      poster_path: '/something1.jpg',
      title: 'Movie 1'
    },
    {id: 2,
      poster_path: '/something2.jpg',
      title: 'Movie 2'},
    {id: 3,
      poster_path: '/something3.jpg',
      title: 'Movie 3'
    }]
};

$(document).ready(function() {
  getAndDisplayUserMovieList();
  $('#search').on('click', function(e) {
    e.preventDefault();
    getAndDisplaySearchData();
  });

  // DECLARING FUNCTIONS----------------------------------------

  // Get and Display User List Data-----------------------------
  function getUserMovieList(callbackFn) {
    setTimeout(function() {
      callbackFn(MOCK_USER_MOVIE_DATA);
    }, 100);
  }

  function displayUserMovieList(data) {
    for (let i = 0; i < data.movies.length; i++) {
      $('.user-movies-list').append(
        `<li>
          <img class="movie-poster" src=${data.movies[i].imagePath}>
          <p class="title">${data.movies[i].title}</p>
          <button class="remove">Remove</button>
          <button class="watched">Watched</button>
        </li>`);
    }
  }

  function getAndDisplayUserMovieList() {
    getUserMovieList(displayUserMovieList);
  }

  // Get and Display Search Data--------------------------------
  function getSearchData(callbackFn) {
    setTimeout(function() {
      callbackFn(MOCK_SEARCH_DATA);
    }, 100);
  }

  function displaySearchData(data) {
    for (let i = 0; i < data.results.length; i++) {
      console.log('hello');
      $('.search-results-list').append(
        `<li>
          <img class="movie-poster" src="${data.results[i].poster_path}">
          <p class="title">${data.results[i].title}</p>
          <button class="add">Add</button>
        </li>`);
    }
  }

  function getAndDisplaySearchData() {
    getSearchData(displaySearchData);
  }
});
