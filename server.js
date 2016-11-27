// Assignment5 app.js
// Authors: Bryan Bonner & Patrick Ryan

// Dependencies found in package.json
var express = require('express'),
      expressValidator = require('express-validator'),
      bodyParser = require('body-parser'),
      mongoose = require('mongoose'),
      mongo = require('mongodb'),
      path = require('path'),
      exphbs = require('express-handlebars'),
      io = require('socket.io');

// Create our Routes & Schema vars
var routes = require('./routes/index'),
    trivia = require('./routes/trivias'),
    Trivia = require('./models/trivia');

// Initialize our Express app & socket io
var app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

// Set view path directory
app.set('views', path)
app.set('views', path.join(__dirname, 'views'));

// Set public directory
app.use(express.static(path.join(__dirname, 'public')));

// Set our view engine as handlebars - layout will be our template layout
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// Body Parser for JSON & URL-encoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// Connect to the DB
mongoose.connect('mongodb://assign4:assign4@ds017672.mlab.com:17672/assign4');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Successfully connected to Database");
});

// Set our routes
app.use('/', routes);
app.use('/trivia', trivia);

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
  socket.on('user join', function(msg){
    io.emit('user join', msg);
  });
  socket.on('game start', function(question) {
      io.emit('game start', question);
  });
  socket.on('user answers', function(msg) {
      io.emit('user answers', msg);
  });
  socket.on('user scores', function(scoreObj) {
    io.emit('user scores', scoreObj);
  });
  socket.on('get question id', function(answerId) {
    io.emit('get question id', answerId);
  });
});

// Listen @ localhost:3000
http.listen(3000, function() {
  console.log('Listening on port 3000');
});
