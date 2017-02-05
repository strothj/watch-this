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

// Document Ready-----------------------------------------------

$(document).ready(function() {
  getAndDisplayUserMovieList();
  $('#search').on('click', function(e) {
    e.preventDefault();
    let searchKeyword = $('#user-search').val();
    console.log(searchKeyword);
    getAndDisplaySearchData(searchKeyword);
    $('#user-search').val('');
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
  function getSearchData(searchKeyword, callbackFn) {
    let search = {
      usersearch: searchKeyword
    };
    $.ajax({
      url: 'http://localhost:8080/usersearch',
      type: 'GET',
      data: search,
      success: function(data) {
        console.log(data);
        callbackFn(data);
      }
    });
  }

  function displaySearchData(data) {
    console.log(data.results);
    for (let i = 0; i < data.results.length; i++) {
      console.log('hello');
      $('.search-results-list').append(
        `<li>
          <img class="movie-poster" src="https://image.tmdb.org/t/p/w500/${data.results[i].poster_path}">
          <p class="title">${data.results[i].title}</p>
          <button class="add">Add</button>
        </li>`);
    }
  }

  function getAndDisplaySearchData(searchKeyword) {
    getSearchData(searchKeyword, displaySearchData);
  }
});
