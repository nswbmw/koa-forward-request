'use strict';

var assert = require('assert');
var fs = require('fs');

var request = require('request');
var merge = require('merge-descriptors');
var isUrl = require('is-url');
var formidable = require('formidable');

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
    if (this.header && this.header.host) {
      delete this.header.host;
    }
    options.headers = options.headers || this.header;
    options.qs = options.qs || this.query;

    switch (this.is('json', 'multipart/form-data', 'urlencoded')) {
    case 'json':
      options.body = options.body || this.request.body;
      options.json = true;
      break;
    case 'multipart/form-data':
      options.formData = options.formData;
      break;
    case 'urlencoded':
      options.form = options.form || this.request.body;
      break;
    default:
      if (!~['HEAD', 'GET', 'DELETE'].indexOf(options.method)) {
        options.body = options.body || this.request.body;
      }
    }
    
    var self = this;
    self.respond = false;

    if (this.is('multipart/form-data') && !options.formData) {
      genFormData(self.req, function (err, form) {
        if (err) throw err;
        options.formData = form;
        delete options.headers['content-length'];

        if (options.debug) {
          console.log('forward options -> %j', options);
        }
        pipeRequest();
      });
    } else {
      if (options.debug) {
        console.log('forward options -> %j', options);
      }
      pipeRequest();
    }

    function pipeRequest() {
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
      .pipe(self.res);
    }
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

function genFormData(req, cb) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) return cb(err);
    try {
      Object.keys(files).forEach(function (filename) {
        fields[filename] = {
          value: fs.createReadStream(files[filename].path),
          options: {
            filename: files[filename].name,
            contentType: files[filename].type
          }
        };
      });
    } catch (e) {
      console.warn(e);
    }
    cb(null, fields);
  });
}
