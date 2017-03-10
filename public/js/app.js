let apiUrl;
if (ENV === 'development') {
  apiUrl = 'http://localhost:8080';
} else {
  apiUrl = 'https://watch-this.herokuapp.com';
}

// Document Ready===============================================
// =============================================================

$(document).ready(function() {

  // Refresh to see if user is still logged in
  function isLoggedIn() {
    return $.ajax({
      url: `${apiUrl}/logged-in`,
      type: 'GET',
      success: function(user) {
        return user.isLoggedIn;
      },
      error: function(err) {
        throw err;
      }
    });
  }

  // Redirect user on session timeout
  if (LOGGED_IN) {
    // Display user movie list
    getAndDisplayUserMovieList();
    // Display most watched list
    getAndDisplayWatchedList();

    setInterval(function() {
      isLoggedIn().done(function(user) {
        if (!user.isLoggedIn) {
          return window.location = '/users/login';
        }
      })
      .fail(function(err) {
        throw err;
      });
    }, 60 * 60 * 1000);
  }

  // Get usersearch results
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
    $.ajax({
      url: apiUrl + '/users/user-movies',
      type: 'GET',
      success: function(data) {
        callbackFn(data);
      },
      error: function(err) {
        throw err;
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
          <button class="watched" id="${data[i].movieId}">Watched</button>
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
      url: apiUrl + '/users/usersearch',
      type: 'GET',
      data: search,
      success: function(data) {
        callbackFn(data);
      },
      error: function(err) {
        throw err;
      }
    });
  }

  function displaySearchData(data) {
    if (data.results.length === 0) {
      $('.search-results-list').text('');
      $('.message').text("Sorry, we could not find what you are looking for. Please check your search entry and try again.");
    } else {
      $('.search-results-list').text('');
      $('.message').text('Your Search Results');
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

  // Get and Display Watched List Data=============================
  // ===========================================================
  function getWatchedMovieList(callbackFn) {
    $.ajax({
      url: apiUrl + '/users/watched',
      type: 'GET',
      success: function(data) {
        callbackFn(data);
      },
      error: function(err) {
        throw err;
      }
    });
  }

  function displayWatchedMovieList(data) {
    $('.most-watched-list').text('');
    for (let i = 0; i < data.length; i++) {
      $('.most-watched-list').append(
        `<li>
          <img class="movie-poster" src=${data[i].moviePoster}>
          <p class="title">${data[i].title}</p>
          <p class="watched-total">Watched ${data[i].watched} time(s)</p>
          <button class="add" id="${data[i].id}">Add</button>
        </li>`);
    }
  }

  function getAndDisplayWatchedList() {
    getWatchedMovieList(displayWatchedMovieList);
  }

  // Add movie to user list========================================
  // ==============================================================
  $('.search-results-list').on('click', '.add', function(e) {
    let movie = {
      movieId: e.target.id,
      moviePoster: $(this).prevAll('img').first().attr('src'),
      title: $(this).prevAll('p').text()
    };
    $.ajax({
      url: apiUrl + '/users/user-movies',
      type: 'POST',
      data: JSON.stringify(movie),
      contentType: 'application/json',
      success: function(data) {
        alert('Movie Added');
        getAndDisplayUserMovieList();
      }
    });
  });

  // Remove movie from user list==================================
  // =============================================================
  $('.user-movies-list').on('click', '.remove', function(e) {
    let idToDelete = {
      movieId: e.target.id
    };
    $.ajax({
      url: apiUrl + '/users/user-movies',
      type: 'PUT',
      data: JSON.stringify(idToDelete),
      contentType: 'application/json',
      success: function(data) {
        alert('Movie Removed');
        getAndDisplayUserMovieList();
      }
    });
  });

  // Mark Movie as Watched=======================================
  // ============================================================
  $('.user-movies-list').on('click', '.watched', function(e) {
    let movie = {
      movieId: e.target.id,
      moviePoster: $(this).prevAll('img').first().attr('src'),
      title: $(this).prevAll('p').text()
    };
    let watchedButton = '#' + e.target.id + '.watched';
    $.ajax({
      url: apiUrl + '/users/watched',
      type: 'post',
      data: JSON.stringify(movie),
      contentType: 'application/json',
      success: function(data) {
        alert('Movie Watched');
        getAndDisplayWatchedList();
        $(watchedButton).remove();
      },
      error: function() {
        conosle.log('error');
      }
    });
  });

  // Add movie to user list FROM MOST WATCHED LIST=================
  // ==============================================================
  $('.most-watched-list').on('click', '.add', function(e) {
    let movie = {
      movieId: e.target.id,
      moviePoster: $(this).prevAll('img').first().attr('src'),
      title: $(this).prevAll('p').text()
    };
    $.ajax({
      url: apiUrl + '/users/user-movies',
      type: 'POST',
      data: JSON.stringify(movie),
      contentType: 'application/json',
      success: function() {
        alert('Movie Added');
        getAndDisplayUserMovieList();
      }
    });
  });
});
