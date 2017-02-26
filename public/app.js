let apiUrl;
if (ENV.ENVIRONMENT === 'development') {
  apiUrl = 'http://localhost:8080';
} else {
  apiUrl = 'https://watch-this.herokuapp.com';
}

// Document Ready===============================================
// =============================================================

$(document).ready(function() {
  getAndDisplayUserMovieList();
  $('#search').on('click', function(e) {
    e.preventDefault();
    let searchKeyword = $('#user-search').val();
    getAndDisplaySearchData(searchKeyword);
    $('#user-search').val('');
  });

  // DECLARING FUNCTIONS========================================
  // ===========================================================

  // Get and Display User List Data=============================
  // ===========================================================
  function getUserMovieList(callbackFn) {
    const user = {
      userName: 'Steve2482'
    };
    $.ajax({
      url: apiUrl + '/user-movies',
      type: 'GET',
      data: user,
      success: function(data) {
        console.log(data);
        callbackFn(data);
      }
    });
  }

  function displayUserMovieList(data) {
    $('.user-movies-list').text('');
    for (let i = 0; i < data.length; i++) {
      $('.user-movies-list').append(
        `<li>
          <img class="movie-poster" src=${data[i].moviePoster}>
          <p class="title">${data[i].title}</p>
          <button class="remove" id="${data[i].movieId}">Remove</button>
          <button class="watched">Watched</button>
        </li>`);
    }
  }

  function getAndDisplayUserMovieList() {
    getUserMovieList(displayUserMovieList);
  }

  // Get and Display Search Data=================================
  // ============================================================
  function getSearchData(searchKeyword, callbackFn) {
    let search = {
      usersearch: searchKeyword
    };
    $.ajax({
      url: apiUrl + '/usersearch',
      type: 'GET',
      data: search,
      success: function(data) {
        callbackFn(data);
      }
    });
  }

  function displaySearchData(data) {
    if (data.results.length === 0) {
      $('.search-results-list').text('');
      $('.message').text("Sorry, we could not find what you are looking for. Please check your search entry and try again.");
    } else {
      $('.search-results-list').text('');
      $('.message').text('Results');
      for (let i = 0; i < data.results.length; i++) {
        $('.search-results-list').append(
          `<li>
            <img class="movie-poster" src="https://image.tmdb.org/t/p/w500/${data.results[i].poster_path}">
            <p class="title">${data.results[i].title}</p>
            <button class="add" id="${data.results[i].id}">Add</button>
          </li>`);
      }
    }
  }

  function getAndDisplaySearchData(searchKeyword) {
    getSearchData(searchKeyword, displaySearchData);
  }

  // To Register button event listener============================
  // =============================================================
  $('#toRegister').click(function(e) {
    e.preventDefault();
    $('.registration').show();
    $('.form').hide();
  });

  // User Registration============================================
  // =============================================================
  function addUser() {
    let user = {
      userName: $('#regUserName').val(),
      password: $('#regPassword').val(),
      firstName: $('#firstName').val(),
      lastName: $('#lastName').val()
    };
    $.ajax({
      url: apiUrl + '/register',
      type: 'POST',
      data: JSON.stringify(user),
      contentType: 'application/json',
      success: function() {
        alert(`You are now registered. Let's add some movies to your "Must Watch List"!`);
      }
    });
  }

  // Register submit button========================================
  // ==============================================================
  $('#register').click(function(e) {
    e.preventDefault();
    addUser();
    $('.registration').hide();
    $('.form').show();
  });

  // User sign in==================================================
  // ==============================================================
  // $('#sign-in').click(function(e) {
  //   e.preventDefault();
  //   let user = {
  //     userName: $('.userName').val(),
  //     password: $('.password').val()
  //   };
  //   $.ajax({
  //     url: apiUrl + '/login',
  //     type: 'GET',
  //     data: JSON.stringify(user),
  //     contentType: 'application/json',
  //     success: function() {
  //       alert('You are now signed in');
  //     }
  //   });
  // });

  // Add movie to user list========================================
  // ==============================================================
  $('.search-results-list').on('click', '.add', function(e) {
    let movie = {
      movieId: e.target.id,
      moviePoster: $(this).prevAll('img').first().attr('src'),
      title: $(this).prevAll('p').text()
    };
    $.ajax({
      url: apiUrl + '/user-movies',
      type: 'POST',
      data: JSON.stringify(movie),
      contentType: 'application/json',
      success: function() {
        alert('Movie Added');
      }
    });
    getAndDisplayUserMovieList();
  });

  // Remove movie from user list==================================
  // =============================================================
  $('.user-movies-list').on('click', '.remove', function(e) {
    let idToDelete = {
      movieId: e.target.id
    };
    $.ajax({
      url: apiUrl + '/user-movies',
      type: 'PUT',
      data: JSON.stringify(idToDelete),
      contentType: 'application/json',
      success: function() {
        alert('Movie Removed');
      }
    });
    getAndDisplayUserMovieList();
  });
});
