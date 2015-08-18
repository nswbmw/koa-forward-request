'use strict';

var app = require('koa')();
var route = require('koa-route');
var koaBody = require('koa-body');
var logger = require('koa-logger');

var forward = require('./');

forward(app, {
  debug: true
});

app.use(logger());
app.use(koaBody({
  multipart: true
}));

app.use(route.post('/', function* () {
  console.log(this.method);
  console.log(this.request.header);
  console.log(this.request.body);

  this.forward('/test');
}));

app.use(route.post('/test', function* () {
  console.log(this.method);
  console.log(this.request.header);
  console.log(this.request.body);
 
  this.status = 200;
  this.body = this.request.body;
}));

app.listen(3000);