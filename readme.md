## koa-forward-request

Forward request for koa.

### Install

    npm i koa-forward-request --save

### Usage

```
'use strict';

var app = require('koa')();
var route = require('koa-route');
var logger = require('koa-logger');

var forward = require('./');

forward(app, {
  debug: true
});

app.use(logger());

app.use(route.get('/', function* () {
  this.forward('/test');
}));

app.use(route.get('/test', function* () {
  this.body = 'test';
}));

app.listen(3000);
```
or

```
'use strict';

var app = require('koa')();
var route = require('koa-route');
var bodyparser = require('koa-bodyparser');
var logger = require('koa-logger');

var forward = require('./');

forward(app, {
  debug: true
});

app.use(logger());
app.use(bodyparser());

app.use(route.post('/', function* () {
  this.forward('/test');
}));

app.use(route.post('/test', function* () {
  this.body = 'test';
}));

app.listen(3000);
```

or

```
'use strict';

var app = require('koa')();
var route = require('koa-route');
var bodyparser = require('koa-bodyparser');

var forward = require('./');

forward(app, {
  baseUrl: 'http://api.example.com'
});

app.use(bodyparser());
app.use(forward.all());

app.listen(3000);
```

### Options

see [request](https://github.com/request/request#requestoptions-callback).

### Example

    node --harmony example

### Test

    npm test

### License

MIT