  var BASE_SPOTIFY_URL = "https://api.spotify.com/v1/tracks?market=US&ids=";
  var SLEEPY_PLAYLIST = "https://api.spotify.com/v1/users/spotify/playlists/5UMleIsaNDK5LzZRbrbcXr/tracks";
  var SPOTIFY_CLIENT_ID = "74a75faf8e044e9193c2c385dabde32f";
  var SPOTIFY_CLIENT_SECRET = "56ff8540a44a4a42b0c611a7cfc05331";
  var SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
  var AUTH = "Basic NzRhNzVmYWY4ZTA0NGU5MTkzYzJjMzg1ZGFiZGUzMmY6NTZmZjg1NDBhNDRhNGE0MmIwYzYxMWE3Y2ZjMDUzMzE=";
  var SPOTIFY_ALBUM = "https://api.spotify.com/v1/albums/";
  var ECHONEST_URL = "http://developer.echonest.com/api/v4/song/search?api_key=WVDL4YATREDEMFPC1&format=json&bucket=id:spotify&bucket=tracks";
  var TEMP = "&min_energy=0.6&min_danceability=0.6";
  var TEMP2 = "&style=rock";
  var ENERGY_ASC = "&sort=energy-asc";

  var preview_urls_to_save = [];

  // saves the alarm
  function saveAlarm(name, time, genres, songs, sleepy_music, snooze_time) {
    var largest_key = 0;
    store.forEach(function(key, val) {
      if (key > largest_key) {
        largest_key = key;
      }
    })
    largest_key = parseInt(largest_key) + 1;
    store.set(largest_key, {
      id: largest_key,
      name: name,
      time: time,
      genres: genres,
      songs: songs,
      sleepy_music: sleepy_music,
      snooze_time: snooze_time
    });
  }

  // gets one alarm
  function loadAlarm(id) {
    return store.get(id);
  }

  // gets list of existing alarms
  function getAlarms() {
    var alarms = [];
    store.forEach(function(key, val) {
      alarms = alarms.concat(val);
    });
    return alarms;
  }

  // deletes specified alarm
  function deleteAlarm(id) {
    store.remove(id);
  }

  // sends a list of previews to the callback
  function getPreviewsFromSpotifyIds(ids, callback) {
    // console.log(ids);
    console.log(ids.length);
    var url = BASE_SPOTIFY_URL + ids.slice(0, 50).join(",");
    if (endsWith(url, ",")) {
      url = url.slice(0, -1);
    }
    $.ajax(ajaxObj(url)).done(function(data) {
      callback(
        data.tracks.filter(function(track) { return (track.preview_url !== null)})
        .map(function(track) {
          // console.log(track);
          return {
            preview_url: track.preview_url,
            track_name: track.name,
            track_id: track.id,
            artist_name: track.artists[0].name,
            artist_id: track.artists[0].id,
            album_image: track.album.images[1].url,
            album_name: track.album.name,
            album_url: track.album.href
          };
        })
      );
    });
  }

  // return array of preview urls to callback
  function getTracksFromAlbumId(id, callback) {
    var url =  SPOTIFY_ALBUM + id + "/tracks?market=US";
    $.ajax(ajaxObj(url)).done(function(data) {
      var ids = data.items.map(function(item) {
        return item.id;
      });
      shuffle(ids);
      getPreviewsFromSpotifyIds(ids, callback);
    });

  }

  // get songs for going to sleep
  function getSleepySongs(callback) {
    getTracksFromAlbumId("76GPenASUzBpitFNplLJKI", callback);
  }

  // get songs for wake up
  function getWakeySongs(callback, genres) {
    var level = getRandomInt(55, 68);
    level = level/100.0;
    $.when(songGroup(level, genres), songGroup(level+0.05, genres), songGroup(level+.1, genres), songGroup(level+.15, genres), songGroup(level+.20, genres), songGroup(level+.25, genres))
    .done(function(a1, a2, a3, a4, a5, a6){
      var ids = ([a1,a2,a3,a4,a5,a6].map(function(data) {
        return getForeignIdsEchonest(data[0]);
      }));
      var merged_ids = [].concat.apply([], ids);

      getPreviewsFromSpotifyIds(merged_ids, callback);

    });
  }
  function endsWith(str, suffix) {
      return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

  // gets ids from echonest with appropriate params for wake up songs
  function getForeignIdsEchonest(data) {
    return data.response.songs
    .filter(function(song, index) { return (song.tracks.length > 0 && index < 10 && song.tracks[0].foreign_id ) })
    .map(function(song) {
      return song.tracks[0].foreign_id.split(":")[2];
    });
  }
  // one set of songs, for a certain level of energy
  function songGroup(level, genres) {
    var base_url = ECHONEST_URL + ENERGY_ASC;
    if (genres.length !== 0) {
      var genre_string = genres.join("&style=");
      base_url = base_url + "&style=" + genre_string;
    }
    var url = base_url;
    //+ "&min_danceability=" + level;
    url = url + "&min_energy=" + level;
    url = url + "&max_loudness=" + (((100-(level*100))*-1)+30);
    url = url + "&min_loudness=" + (100-(level*100))*-1;
    return $.ajax(ajaxObj(url));
  }

  // for making ajax obj w any url
  function ajaxObj(url) {
    return {
        type: 'GET',
        headers: {Accept: 'application/json'},
        url: url,
        dataType: "json",
    }
  }

  function ajaxTokenObj(url) {
    return {
        type: 'POST',
        async: true,
        headers: {
          Accept: "application/json",
          Authorization: AUTH,
        },
        url: url,
        dataType: "json",
        form: {
          grant_type: 'client_credentials'
        },
        success:function(data)
        {
          // console.log(data);
        }
      }
    }

  // get access token - returns string
  function getAccessToken(callback) {
    $.ajax(ajaxTokenObj(SPOTIFY_TOKEN_URL)).done(function(data) {
      callback(data.access_token);
    });
  }

  // your application requests authorization
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': AUTH
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };
