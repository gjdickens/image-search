var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var https = require('https');
var mongoose = require('mongoose');
var DbQuery = require('./models/DbQuery');

//set up an imgur ajax call
var imgurAuth = 'Bearer ' + process.env.IMGUR_AUTH;

var db = process.env.MONGOLAB_URI;

mongoose.connect(db);

var conn = mongoose.connection;

conn.on('error', console.error.bind(console, 'connection error:'));

conn.once('open', function() {
  console.log('database connected');
});

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

// Set Up Routes
var routerRecent = express.Router();
var routerSearch = express.Router();

// Middleware for all requests
routerSearch.use(function(req, res, next) {
  next();
});

//landing page route

app.use('/', express.static(path.join(__dirname, 'public')));


routerSearch.route('/:search_query')

  //create a new url
  .get(function(req, res) {
    var queryString = req.params.search_query;
    var dbQuery = new DbQuery();
    dbQuery.term = queryString;
    dbQuery.when = new Date();
    dbQuery.save(function(err) {
      if (err) {res.send(err)};
    });
    queryString = queryString.replace(/\s/g, '%20');
    var offset = req.query['offset'];
    var options = {
      host: 'api.imgur.com',
      path: '/3/gallery/search/' + offset + '?q=' + queryString,
      headers: {
            'Authorization': imgurAuth
        }
    };

    https.get(options, function (apiRes) {

      var body = '';
      apiRes.on('data', function (d) {
        body += d;
      });
      apiRes.on('end', function (d) {
        var parsed = JSON.parse(body);
        var finalData = [];
        for (var i = 0; i < parsed.data.length; i ++) {
          var item = parsed.data[i];
          var newItem = {
            image_url: item['link'],
            user_url: 'http://imgur.com/user/' + item['account_url'],
            title: item['title']
          };
          finalData.push(newItem);
        }
        res.json(finalData);
      });

    }).on('error', function (e)  {
      console.error(e);
      res.redirect('localhost:8080');
    });

  });

  routerRecent.route('/')
    //query last 10 search terms
    .get(function(req, res) {
      DbQuery.find({}, {term: 1, when: 1, _id: 0}).sort({when: -1}).limit(10).exec(function(err, queries) {
        if (err) {res.send(err)};
        res.json(queries);
      });

    });


// Register Routes
app.use('/search', routerSearch);
app.use('/recent', routerRecent);

// Start Server
app.listen(port);
console.log('Listening on ' + port);
