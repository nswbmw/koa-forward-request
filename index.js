'use strict';

var assert = require('assert');
var request = require('request');
var merge = require('merge-descriptors');
var isUrl = require('is-url');

module.exports = function forwardRequest(app, defaultOptions) {
  defaultOptions = defaultOptions || {};

  app.context.forward = function (url, options) {
    assert('string' === typeof url, 'first parameter must be a url string.');

    options = options || {};
    options = merge(options, defaultOptions);

    if (isUrl(url)) {
      options.url = options.url || url;
    } else {
      options.url = options.url || url;
      options.baseUrl = options.baseUrl || this.protocol + '://' + this.host;
    }
    options.method = options.method || this.method;
    options.headers = options.headers || this.header;
    options.qs = options.qs || this.query;

    switch (this.is('json', 'multipart/form-data', 'urlencoded')) {
    case 'json':
      options.body = options.body || this.request.body;
      options.json = true;
      break;
    case 'multipart/form-data':
      options.formData = options.formData || this.request.body;
      break;
    case 'urlencoded':
      options.form = options.form || this.request.body;
      break;
    default:
      if (!~['HEAD', 'GET', 'DELETE'].indexOf(options.method)) {
        options.body = options.body || this.request.body;
      }
    }

    if (options.debug) {
      console.log('forward options -> %j', options);
    }
    
    var self = this;
    this.respond = false;
    request(options)
    .on('error', function (err) {
      if (err.code === 'ENOTFOUND') {
        self.res.statusCode = 404;
        self.res.end();
      } else {
        console.error(err);
        throw err;
      }
    })
    .pipe(this.res);
  };

  module.exports.all = function all () {
    assert(defaultOptions.baseUrl, 'use `all()` must set `baseUrl` in options');

    return function* (next) {
      yield* next;

      if (this.status === 404) {
        this.forward(this.originalUrl);
      }
    };
  };

  return app;
};
