'use strict';

var koa = require('koa');
var bodyparser = require('koa-bodyparser');
var request = require('supertest');
var route = require('koa-route');
var forward = require('./');

describe('test localhost', function () {
  it('should return 200', function (done) {
    var app = koa();
    forward(app);
    app.use(route.get('/', function* () {
      this.forward('/test');
    }));
    app.use(route.get('/test', function* () {
      this.body = 'test';
    }));

    request(app.callback())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        if (res.text !== 'test') {
          return done('should return `test`!');
        }
        done();
      });
  });

  it('should return body', function (done) {
    var app = koa();
    forward(app);
    app.use(bodyparser());
    app.use(route.post('/', function* () {
      this.forward('/test');
    }));
    app.use(route.post('/test', function* () {
      this.body = this.request.body;
    }));

    request(app.callback())
      .post('/')
      .send({name: 'nswbmw'})
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        if (!res.body || res.body.name !== 'nswbmw') {
          return done("should return `{name: 'nswbmw'}`!");
        }
        done();
      });
  });

  it('should return 401', function (done) {
    var app = koa();
    forward(app);
    app.use(route.get('/', function* () {
      this.forward('/auth');
    }));
    app.use(route.get('/auth', function* () {
      this.throw(401, 'need auth');
    }));

    request(app.callback())
      .get('/')
      .expect(401)
      .end(function (err, res) {
        if (err) return done(err);
        if (!res.text || res.text !== 'need auth') {
          return done("should return `need auth`!");
        }
        done();
      });
  });
});

describe('test remote url', function () {
  it('should return image binary', function (done) {
    var app = koa();
    forward(app);
    app.use(route.get('/', function* () {
      this.forward('http://github.global.ssl.fastly.net/images/icons/emoji/+1.png?v5', {
        headers: {}
      });
    }));

    request(app.callback())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        if (!Buffer.isBuffer(res.body)) {
          return done('should return image binary!');
        }
        done();
      });
  });
});