var express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    redis = require('redis'),
    client = redis.createClient(),
    router = express.Router(),
    Trivia = require('../models/trivia');

var jsonParser = bodyParser.json();

// Log successful redis connection & set 'right' and 'wrong key' values to 0
client.on('connect', function() {
    console.log('Redis Connected');
});

client.set('right', 0);
client.set('wrong', 0);

// GET question - returns a single trivia question
router.get('/question', jsonParser, function(req, res) {
	// Query for the current count of the documents for upper boundary limit
	Trivia.count({}, function(err, c) {
		if(err) {
			console.log('Probably no questions in the db');
			console.log(err);
		}
		else {
			var randomId = Math.floor(Math.random() *(c)+1);
			Trivia.findOne({'answerid' : randomId}, 'question', function(err, trivia) {
				if (err) throw err;
				res.json({'question': trivia.question, 'answerid': randomId});
			});
		}
	});
});

// POST question - creates a new trivia question
//   -Grabs user field data then queries database for a count of total documents in the collection
//   -Increments the document count by 1 and assigns it as answer id of the question
//   -Writes question to database
router.post('/question', function(req, res) {
	var question = req.body.question,
	    answer = req.body.answer,
	    count = 1;

  //counts the total documents in our collection
	Trivia.count({}, function(err, c) {
		  if(err) {
			  console.log(err);
		  }
		else {
			count = c + 1;
			var newTrivia = new Trivia({
				question: question,
				answer: answer,
				answerid: count
			});
			newTrivia.save(function(err) {
				if(err) throw err;
			});
			res.json('question: ' + question + 'Answer: ' + answer + 'Answer Id: '
				 + count);
		}
	});
});

// POST answer
router.post('/answer', jsonParser, function(req, res) {
	var useranswer = req.body.question, //users answer
	    answerid = req.body.id; //answerid of the question

	//Check user's answer with db answer
	Trivia.findOne({'answerid' : answerid}, 'answer', function(err, trivia) {
		if (err) throw err;
		if (useranswer == trivia.answer) {
			client.incr('right');
			res.json({'correct': 'CORRECT'});
		} else {
			client.incr('wrong');
			res.json({'correct': 'INCORRECT'});
		}
	});
});

// GET score
router.get('/score', jsonParser, function(req, res) {
	client.mget('right', 'wrong', function (err, reply) {
		if (err) {
			console.log('Redis error: ' + err);
		} else {
      res.json({'score': reply});
		}
	});
});

module.exports = router;
