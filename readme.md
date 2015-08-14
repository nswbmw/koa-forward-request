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
var formidable = require('koa-formidable');
var logger = require('koa-logger');

var forward = require('./');

forward(app, {
  debug: true
});

app.use(logger());
app.use(formidable());

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
var formidable = require('koa-formidable');

var forward = require('./');

forward(app, {
  baseUrl: 'http://api.example.com'
});

app.use(formidable());
app.use(forward.all());

app.listen(3000);
```

** NB: ** If you set content-type to `multipart/form-data` for uploading file, please use `koa-formidable`.

### Options

see [request](https://github.com/request/request#requestoptions-callback).

### Example

    node --harmony example

### Test

    npm test

### License

MIT