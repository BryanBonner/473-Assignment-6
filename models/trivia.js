var mongoose = require('mongoose');
// Use native promises
    mongoose.Promise = global.Promise;

// Create a schema
var TriviaSchema = new mongoose.Schema({
  question: String,
  answer: String,
  answerid: Number,
  correct: Boolean
});

var Trivia = module.exports = mongoose.model('Trivia', TriviaSchema);
