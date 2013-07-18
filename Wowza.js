// Generated by CoffeeScript 1.6.3
(function() {
  var Wowza, crypto, digest, events, parseString, qs, querystring, rest, url, util, _;

  parseString = require('xml2js').parseString;

  digest = require('./lib/digest');

  _ = require('underscore');

  querystring = require('querystring');

  rest = require('http');

  util = require('util');

  crypto = require('crypto');

  qs = require('querystring');

  events = require('events');

  url = require('url');

  Wowza = function(config) {
    this.config = config;
    this.digest = new digest(this.config.username, this.config.password, this.config.host);
    this.timers = {
      stats: false
    };
    url = url.parse(this.config.host);
    this.config.host = url.hostname;
    this.config.port = url.port;
    this.config.path = url.path;
    Wowza.self = this;
    events.EventEmitter.call(this);
    return this;
  };

  util.inherits(Wowza, events.EventEmitter);

  Wowza.self = false;

  Wowza.recordingOptions = {
    outputPath: '/usr/local/WowzaMediaServer/content/recordings/',
    outputFile: 'liveRecording.mp4',
    format: 2,
    app: 'live',
    option: 'overwrite',
    SegmentSize: 500 * 1024 * 1024,
    SegmentDuration: 60 * 60
  };

  Wowza.prototype.startStats = function() {
    var statFn,
      _this = this;
    if (this.timers.stats) {
      return false;
    }
    statFn = function() {
      return _this.request('/connectioncounts', function(data) {
        _this.timers.stats = setTimeout(statFn, 5000);
        return parseString(data, function(err, d) {
          if (err) {
            Wowza.self.emit('error.stats', "Couldn't get stats");
            return false;
          }
          try {
            data = {
              time: new Date(),
              count: parseInt(d.WowzaMediaServer.VHost[0].Application[0].ConnectionsCurrent[0], 10)
            };
            return Wowza.self.emit('stats', data);
          } catch (_error) {
            err = _error;
            console.log('error');
            console.error(err);
            return Wowza.self.emit('error.stats', err);
          }
        });
      });
    };
    return statFn();
  };

  Wowza.prototype.stopStats = function() {
    clearTimeout(this.timers.stats);
    return true;
  };

  Wowza.prototype.startRecording = function(streamName, options) {
    var _this = this;
    if (options == null) {
      options = {};
    }
    options = _.defaults(options, Wowza.recordingOptions);
    options.action = 'startRecording';
    options.streamName = streamName;
    qs = querystring.stringify(options);
    console.log(qs);
    return this.request("/livestreamrecord?" + qs, function(data) {
      return console.log(data);
    });
  };

  Wowza.prototype.stopRecording = function() {
    var options,
      _this = this;
    options = _.defaults(options, Wowza.recordingOptions);
    options.action = 'stopRecording';
    options.streamName = streamName;
    qs = querystring.stringify(options);
    return this.request("/livestreamrecord?" + qs, function(data) {
      return console.log(data);
    });
  };

  Wowza.prototype.parse = function(response, callback) {
    var d;
    d = '';
    response.on('data', function(chunk) {
      d += chunk;
      return true;
    });
    response.on('end', function() {
      callback(d);
      return true;
    });
    return true;
  };

  Wowza.prototype.request = function(url, callback) {
    var opts, r1, self,
      _this = this;
    self = this;
    opts = {
      host: this.config.host,
      port: this.config.port,
      path: url,
      method: 'get'
    };
    r1 = rest.request(opts);
    r1.end();
    r1.on('error', function(err) {
      return util.error("Can't get stats");
    });
    return r1.on('response', function(response) {
      var headers, opts2, req;
      headers = _this.digest.render(opts.path, response.headers);
      opts2 = {
        host: _this.config.host,
        port: _this.config.port,
        path: opts.path,
        method: 'get',
        headers: headers
      };
      req = rest.request(opts2);
      req.end();
      req.on('error', function(err) {
        util.error("Wowza error:");
        return util.error(err);
      });
      return req.on('response', function(response) {
        return Wowza.self.parse(response, callback);
      });
    });
  };

  Wowza.prototype.stop = function() {
    return clearInterval(this.timer);
  };

  module.exports = Wowza;

}).call(this);
