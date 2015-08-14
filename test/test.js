'use strict';

var koa = require('koa');
var formidable = require('koa-formidable');
var request = require('supertest');
var route = require('koa-route');
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
    app.use(formidable());
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
    app.use(formidable());

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
    app.use(formidable());

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
      baseUrl: 'http://localhost:3001',
      debug: true
    });
    app1.use(formidable());
    app1.use(forward.all());

    var app2 = koa();
    app2.use(formidable());
    app2.use(function *() {
      this.body = this.request.body.name + '/' + this.request.files.avatar.name;
    });
    app2.listen(3001);

    request(app1.callback())
      .post('/upload')
      .field('name', 'nswbmw')
      .attach('avatar', __dirname + '/avatar.png')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        if (res.text !== 'nswbmw/avatar.png') {
          return done('res.text should be `nswbmw/avatar.png`');
        }
        done();
      });
  });
});