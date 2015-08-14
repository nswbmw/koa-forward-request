'use strict';

var fs = require('fs');

var koa = require('koa');
var bodyparser = require('koa-bodyparser');
var request = require('supertest');
var route = require('koa-route');
var formidable = require('formidable');
var forward = require('../');

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
    forward(app, {
      debug: true
    });
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

  it('should return 404', function (done) {
    var app = koa();
    forward(app);
    app.use(route.get('/', function* () {
      this.forward('/auth');
    }));
    app.use(route.get('/test', function* () {
      this.throw(401, 'test');
    }));

    request(app.callback())
      .get('/')
      .expect(404)
      .end(done);
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

  it('should forward to http://expressjs.com', function (done) {
    var app = koa();
    forward(app, {
      baseUrl: 'http://expressjs.com',
      headers: {},
      debug: true
    });
    app.use(forward.all());

    request(app.callback())
      .get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        
        if (!res.text.match(/Fast, unopinionated, minimalist web framework/)) {
          return done('Not match `Fast, unopinionated, minimalist web framework`');
        }
        done();
      });
  });

  it('should forward to http://expressjs.com//guide/routing.html', function (done) {
    var app = koa();
    forward(app, {
      baseUrl: 'http://expressjs.com',
      headers: {},
      debug: true
    });
    app.use(forward.all());

    request(app.callback())
      .get('/guide/routing.html')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        if (!res.text.match(/Express routing/)) {
          return done('Not match `Express routing`');
        }
        done();
      });
  });

  it('should no forward and return body', function (done) {
    var app = koa();
    app.use(bodyparser());

    forward(app, {
      baseUrl: 'http://expressjs.com',
      headers: {},
      debug: true
    });
    app.use(forward.all());
    app.use(function* () {
      this.body = this.request.body;
    });

    request(app.callback())
      .post('/guide/routing.html')
      .send({ name: 'nswbmw' })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        if (res.body.name !== 'nswbmw') {
          return done('Not match name');
        }
        done();
      });
  });

  it('should no forward', function (done) {
    var app = koa();
    app.use(bodyparser());

    forward(app, {
      baseUrl: 'http://expressjs.com',
      headers: {},
      debug: true
    });
    app.use(function* () {
      this.body = this.request.body;
    });
    app.use(forward.all());

    request(app.callback())
      .post('/guide/routing.html')
      .send({ name: 'nswbmw' })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);

        if (res.body.name !== 'nswbmw') {
          return done('Not match name');
        }
        done();
      });
  });

  it('should return 404', function (done) {
    var app = koa();
    forward(app, {
      baseUrl: 'http://non-existent-url.com'
    });
    app.use(forward.all());

    request(app.callback())
      .get('/')
      .expect(404)
      .end(done);
  });

  it('should return 404', function (done) {
    var app1 = koa();
    forward(app1, {
      baseUrl: 'http://localhost:3001'
    });
    app1.use(forward.all());

    var filepath = '';
    var app2 = koa();
    app2.use(function *() {
      var form = new formidable.IncomingForm();
      form.uploadDir = __dirname;
      form.parse(this.req, function (err, fields, files) {
        if (err) throw err;
        if (!fields.name || fields.name !== 'nswbmw') {
          throw new Error('name should be nswbmw');
        }
        if (!files.avatar || files.avatar.name !== 'avatar.png') {
          throw new Error('filename should be avatar.png');
        }
        filepath = files.avatar.path;
      });
    });
    app2.listen(3001);

    request(app1.callback())
      .post('/upload')
      .field('name', 'nswbmw')
      .attach('avatar', __dirname + '/avatar.png')
      .expect(404)
      .end(function (err) {
        if (err) return done(err);
        setTimeout(function() {
          if (!fs.existsSync(filepath)) {
            return done(filepath + ' not exist!');
          }
          fs.unlinkSync(filepath);
          done();
        }, 500);
      });
  });
});