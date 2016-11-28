/* jshint browser: true, jquery: true, camelcase: true, indent: 2, undef: true, quotmark: single, maxlen: 80, trailing: true, curly: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, nonew: true, unused: true, strict: true */
var main = function () {
	'use strict';

	var socket = io();
	var url = 'http://localhost:3000/trivia';
	var question, score,
	    qObj = {id: null, question: null}, connectCount = 0,
	    answeredCount = 0, users = [];

	// Knockout View Model
	var TriviaViewModel = {
		userName: ko.observable(''),
		userList: ko.observableArray([]),
		question: ko.observable(''),
		userAnswer: ko.observable(''),
		userOutcome: ko.observable(''),
		rightScore: ko.observable('0'),
		wrongScore: ko.observable('0'),
		joinButton: ko.observable(true),
		startButton: ko.observable(true),
		submitButton: ko.observable(true),
		updateUsers: function() {
			TriviaViewModel.joinButton(false);
			socket.emit('user join', TriviaViewModel.userName());
		},
		updateQuestion: function() {
			retrieveQuestion();
		},
		updateAnswer: function() {
			retrieveAnswerOutcome();
		}
	};

	//Self method copied from the Knockout tutorial of collections,
	// helps with scope issues is my understanding
	function GetUserName(userName) {
		var self = this;
		self.userName = userName;
	}

	// GET a question obj from the server
	//  -emit the object in order for all clients to get
	//  the current question id
	function retrieveQuestion() {
		$.ajax({
			type: 'GET',
			url: url + '/question',
			contentType: 'application/json',
			dataType: 'json',
			data:	question,
			success: function(question) {
				socket.emit('get question id', question);
				socket.emit('game start', question);
			},
			fail: function() {
				alert('failed to retrieve question');
			}
		});
	}

	//Post user answer to the server with a reply of incorrect or correct
	// then update the view model and hide the submit button until all users
	//   have answered
	function retrieveAnswerOutcome() {
		if(TriviaViewModel.userAnswer() === '') {
			alert('Enter an answer before submitting!');
		}
		else if(TriviaViewModel.userList() === '') {
			alert('There are no active players, join competition first!');
		}
		else if(qObj.question === null && qObj.id === null) {
			alert('Start the game first');
		}
		else {
			TriviaViewModel.submitButton(false);
			qObj.question = TriviaViewModel.userAnswer();
			$.ajax({
				type: 'POST',
				url: url + '/answer',
				contentType: 'application/json',
				dataType: 'json',
				data:	(JSON.stringify(qObj)),
				success: function(response) {
					socket.emit('user answers', response);
				}
			});
		}
	}
	// Get the score and emit to all users
	function retrieveScore() {
		$.ajax({
			type: 'GET',
			url: url + '/score',
			contentType: 'application/json',
			dataType: 'json',
			data: score,
			success: function(score) {
				socket.emit('user scores', score);
			},
			fail: function() {
				alert('failed to retrieve score');
			}
		});
	}

// SOCKET IO .on
	socket.on('user join', function(msg) {
		connectCount++;
		users.push(new GetUserName(msg));
		TriviaViewModel.userList(users);
	});
	socket.on('game start', function(question) {
		TriviaViewModel.question(question.question);
		TriviaViewModel.startButton(false);
	});
	socket.on('get question id', function(question) {
		//Pass the question id to ALL clients in order to correctly POST answer
		// for each connected client
		qObj.id = question.answerid;
	});

	// Keep track of the amount of connected users who answer in order to find
	// the next question once everyone has answered
	socket.on('user answers', function(msg) {
		answeredCount++;
		TriviaViewModel.userOutcome(' ' + msg.correct);
		if(answeredCount === connectCount) {
			answeredCount = 0;
			retrieveScore();
			TriviaViewModel.updateQuestion();
			TriviaViewModel.submitButton(true);
		}
	});

	socket.on('user scores', function(scoreObj) {
		TriviaViewModel.rightScore(scoreObj.score[0]);
		TriviaViewModel.wrongScore(scoreObj.score[1]);
	});
	// END SOCKET IO

	ko.applyBindings(TriviaViewModel);
};

$(document).ready(main);
