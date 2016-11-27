var main = function () {
	"using strict"

	var socket = io();
	var url = "http://localhost:3000/trivia";
	var question, userAnswer, score,
	    qObj = {id: null, question: null}, connectCount = 0,
	    answeredCount = 0, usedQuestions = [], scoreObj = {}, users = [];

	// SOCKET IO .on
	socket.on('user join', function(msg) {
		connectCount++;
		users.push(new getUserName(msg));
		TriviaViewModel.userList(users);
	});

	socket.on('game start', function(question){
		//Pass the question id to ALL clients in order to correctly POST answer for
		// each connected client
		qObj.id = question.answerid;
	});

	// Keep track of the amount of connected users who answer in order to find the
	// next question once everyone has answered
	socket.on('user answers', function(msg){
		answeredCount++;
		if(answeredCount == connectCount) {
			answeredCount = 0;
			getQuestion();
		}
	});

	socket.on('user scores', function(scoreObj) {
		$('#user-score').empty();
		$('#user-score').append($('<p>').text('Correct, Incorrect Score: ' + scoreObj['score']));
	});
	// END SOCKET IO

	// Knockout View Model
	var TriviaViewModel = {
		userName: ko.observable(""),
		userList: ko.observableArray([]),
		question: ko.observable(""),
		updateUsers: function() {
			socket.emit('user join', TriviaViewModel.userName());
		}
	};
	//self method copied from knockout tutorial of collections,
	// helps with scope issues
	function getUserName(userName) {
		var self = this;
		self.userName = userName;
	}

	// GET a question & if succesful emit it to all users
	function getQuestion() {
		$.ajax({
			type: 'GET',
			url: url + '/question',
			contentType: 'application/json',
			dataType: 'json',
			data:	question,
			success: function(question) {
				socket.emit('game start', question);
			},
			fail: function(question) {
				alert('failed to retrieve question');
			}
		});
	};


	// Get the score and emit to all users
	function getScore() {
		$.ajax({
			type: 'GET',
			url: url + '/score',
			contentType: 'application/json',
			dataType: 'json',
			data: scoreObj,
			success: function(scoreObj) {
				socket.emit('user scores', scoreObj);
			},
			fail: function(scoreObj) {
				alert('failed to retrieve score');
			}
		});
	}

	// Get user name and emit that a user joined the game
	// $('#join').click(function() {
	// 	if($('#username').val() != '') {
	// 		var $userName = $('#username').val();
	// 	//	socket.emit('user join', $userName);
	// 	}
	// 	else alert("Enter username first");
	//   return false;
	// });

	//Start the game - only clicked once for each user who joins the competition
	$('#start-button').click(function() {
		//ko.applyBindings(new StartVM());
		getQuestion();
	});

	// User submits an answer to a question & emits user's response
	$('#answer').click(function() {
		if($('#useranswer').val() == '' || null) {
			alert("Enter an answer before submitting");
		}
		else {
			qObj.question = $('#useranswer').val();

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
	});
	ko.applyBindings(TriviaViewModel);
};

$(document).ready(main);
