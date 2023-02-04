(function () {
    'use strict';

    function subscribe(data) {
      var inited = false;
      var inited_parse = false;
      var webos_replace = {};
      function log() {
        console.log.apply(console.log, arguments);
      }
      function getTracks() {
        var video = Lampa.PlayerVideo.video();
        return video.audioTracks || [];
      }
      function getSubs() {
        var video = Lampa.PlayerVideo.video();
        return video.textTracks || [];
      }
      log('Tracks', 'start');
      function setTracks() {
        if (inited_parse) {
          var new_tracks = [];
          var video_tracks = getTracks();
          var parse_tracks = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          });
          var minus = 1;
          log('Tracks', 'set tracks:', video_tracks.length);
          if (parse_tracks.length !== video_tracks.length) parse_tracks = parse_tracks.filter(function (a) {
            return a.codec_name !== 'dts';
          });
          parse_tracks = parse_tracks.filter(function (a) {
            return a.tags;
          });
          log('Tracks', 'filtred tracks:', parse_tracks.length);
          parse_tracks.forEach(function (track) {
            var orig = video_tracks[track.index - minus];
            var elem = {
              index: track.index - minus,
              language: track.tags.language,
              label: track.tags.title || track.tags.handler_name,
              ghost: orig ? false : true,
              selected: orig ? orig.selected == true || orig.enabled == true : false
            };
            log('Tracks', 'tracks original', orig);
            Object.defineProperty(elem, "enabled", {
              set: function set(v) {
                if (v) {
                  var aud = getTracks();
                  var trk = aud[elem.index];
                  for (var i = 0; i < aud.length; i++) {
                    aud[i].enabled = false;
                    aud[i].selected = false;
                  }
                  if (trk) {
                    trk.enabled = true;
                    trk.selected = true;
                  }
                }
              },
              get: function get() {}
            });
            new_tracks.push(elem);
          });
          if (parse_tracks.length) Lampa.PlayerPanel.setTracks(new_tracks);
        }
      }
      function setSubs() {
        if (inited_parse) {
          var new_subs = [];
          var video_subs = getSubs();
          var parse_subs = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'subtitle';
          });
          var minus = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          }).length + 1;
          log('Tracks', 'set subs:', video_subs.length);
          parse_subs = parse_subs.filter(function (a) {
            return a.tags;
          });
          log('Tracks', 'filtred subs:', parse_subs.length);
          parse_subs.forEach(function (track) {
            var orig = video_subs[track.index - minus];
            var elem = {
              index: track.index - minus,
              language: track.tags.language,
              label: track.tags.title || track.tags.handler_name,
              ghost: video_subs[track.index - minus] ? false : true,
              selected: orig ? orig.selected == true || orig.mode == 'showing' : false
            };
            log('Tracks', 'subs original', orig);
            Object.defineProperty(elem, "mode", {
              set: function set(v) {
                if (v) {
                  var txt = getSubs();
                  var sub = txt[elem.index];
                  for (var i = 0; i < txt.length; i++) {
                    txt[i].mode = 'disabled';
                    txt[i].selected = false;
                  }
                  if (sub) {
                    sub.mode = 'showing';
                    sub.selected = true;
                  }
                }
              },
              get: function get() {}
            });
            new_subs.push(elem);
          });
          if (parse_subs.length) Lampa.PlayerPanel.setSubs(new_subs);
        }
      }
      function listenTracks() {
        log('Tracks', 'tracks video event');
        setTracks();
        Lampa.PlayerVideo.listener.remove('tracks', listenTracks);
      }
      function listenSubs() {
        log('Tracks', 'subs video event');
        setSubs();
        Lampa.PlayerVideo.listener.remove('subs', listenSubs);
      }
      function canPlay() {
        log('Tracks', 'canplay video event');
        if (webos_replace.tracks) setWebosTracks(webos_replace.tracks);else setTracks();
        if (webos_replace.subs) setWebosSubs(webos_replace.subs);else setSubs();
        Lampa.PlayerVideo.listener.remove('canplay', canPlay);
      }
      function setWebosTracks(video_tracks) {
        if (inited_parse) {
          var parse_tracks = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'audio';
          });
          log('Tracks', 'webos set tracks:', video_tracks.length);
          if (parse_tracks.length !== video_tracks.length) {
            if (webOS.sdk_version < 5) parse_tracks = parse_tracks.filter(function (a) {
              return a.codec_name !== 'truehd';
            });else parse_tracks = parse_tracks.filter(function (a) {
              return a.codec_name !== 'dts' && a.codec_name !== 'truehd';
            });
          }
          parse_tracks = parse_tracks.filter(function (a) {
            return a.tags;
          });
          log('Tracks', 'webos tracks', video_tracks);
          parse_tracks.forEach(function (track, i) {
            if (video_tracks[i]) {
              video_tracks[i].language = track.tags.language;
              video_tracks[i].label = track.tags.title || track.tags.handler_name;
            }
          });
        }
      }
      function setWebosSubs(video_subs) {
        if (inited_parse) {
          var parse_subs = inited_parse.streams.filter(function (a) {
            return a.codec_type == 'subtitle';
          });
          log('Tracks', 'webos set subs:', video_subs.length);
          if (parse_subs.length !== video_subs.length - 1) parse_subs = parse_subs.filter(function (a) {
            return a.codec_name !== 'hdmv_pgs_subtitle';
          });
          parse_subs = parse_subs.filter(function (a) {
            return a.tags;
          });
          parse_subs.forEach(function (track, a) {
            var i = a + 1;
            if (video_subs[i]) {
              video_subs[i].language = track.tags.language;
              video_subs[i].label = track.tags.title || track.tags.handler_name;
            }
          });
        }
      }
      function listenWebosSubs(_data) {
        log('Tracks', 'webos subs event');
        webos_replace.subs = _data.subs;
        if (inited_parse) setWebosSubs(_data.subs);
      }
      function listenWebosTracks(_data) {
        log('Tracks', 'webos tracks event');
        webos_replace.tracks = _data.tracks;
        if (inited_parse) setWebosTracks(_data.tracks);
      }
      function parseStart() {
        inited = true;
        var parse = function parse(result) {
          try {
            inited_parse = JSON.parse(result);
          } catch (e) {}
          log('Tracks', 'parsed', inited_parse);
          if (inited) {
            if (webos_replace.subs) setWebosSubs(webos_replace.subs);else setSubs();
            if (webos_replace.tracks) setWebosTracks(webos_replace.tracks);else setTracks();
          }
        };
        {
          var net = new Lampa.Reguest();
          var url = '{localhost}/ffprobe?media=' + encodeURIComponent(data.url);
          var email = Lampa.Storage.get('account_email');
          if(email) url = Lampa.Utils.addUrlComponent(url,'account_email=' + encodeURIComponent(email));
          net.timeout(1000 * 15);
          net["native"](url, parse, false, false, {
            dataType: 'text'
          });
        }
      }
      function detectTracksAmount(e) {
        log('Tracks', 'amount', e.tracks.length);
        if (e.tracks.length > 1) {
          listenStart();
          parseStart();
        }
        Lampa.PlayerVideo.listener.remove('tracks', detectTracksAmount);
      }
      function listenStart() {
        Lampa.PlayerVideo.listener.follow('tracks', listenTracks);
        Lampa.PlayerVideo.listener.follow('subs', listenSubs);
        Lampa.PlayerVideo.listener.follow('webos_subs', listenWebosSubs);
        Lampa.PlayerVideo.listener.follow('webos_tracks', listenWebosTracks);
        Lampa.PlayerVideo.listener.follow('canplay', canPlay);
      }
      function listenDestroy() {
        inited = false;
        Lampa.Player.listener.remove('destroy', listenDestroy);
        Lampa.PlayerVideo.listener.remove('tracks', listenTracks);
        Lampa.PlayerVideo.listener.remove('subs', listenSubs);
        Lampa.PlayerVideo.listener.remove('webos_subs', listenWebosSubs);
        Lampa.PlayerVideo.listener.remove('webos_tracks', listenWebosTracks);
        Lampa.PlayerVideo.listener.remove('canplay', canPlay);
        Lampa.PlayerVideo.listener.remove('tracks', detectTracksAmount);
        log('Tracks', 'end');
      }
      Lampa.PlayerVideo.listener.follow('tracks', detectTracksAmount);
      Lampa.Player.listener.follow('destroy', listenDestroy);
    }
    Lampa.Player.listener.follow('start', function (data) {
      if (!(/.m3u8/.test(data.url) || /.mpd/.test(data.url))) subscribe(data);
    });

})();
