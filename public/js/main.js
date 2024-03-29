/* functions for general use */

function getURLParameters(whichParam)
{
	var pageURL = window.location.search.substring(1);
	var pageURLVariables = pageURL.split('&');
	for(var i = 0; i < pageURLVariables.length; i++) {
		var parameterName = pageURLVariables[i].split('=');
		if(parameterName[0] == whichParam) {
			return parameterName[1];
		}
	}


}

var username = getURLParameters('username');
if ('undefined' == typeof username || !username) {
	username = 'Anonymous_' + Math.random();
}

var chat_room = getURLParameters('game_id');
if('undefined' == typeof chat_room || !chat_room) {
	chat_room = 'lobby';
}

/* this code shows the user name is passed */
/* $('#messages').append('<h4>' + username + '</h4>'); */


/* Connect to the socket server */

var socket = io.connect();

/* What to do when the server sends me a log message */
socket.on('log',function(array) {
	console.log.apply(console,array);
});


/* What do do when the server responds that someone joined a room */

socket.on('join_room_response',function(payload) {
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}

	/* If we are being notified that we joined the room, then ignore it */
	if(payload.socket_id == socket.id) {
		return;
	}

	/* If someone joined, then add a new row to the lobby table */
	var dom_elements = $('.socket_' + payload.socket_id);

	/* If we don't already have an entry for this person */
	if(dom_elements.length == 0) {
		var nodeA = $('<div></div>');
		nodeA.addClass('socket_' + payload.socket_id);

		var nodeB = $('<div></div>');
		nodeB.addClass('socket_' + payload.socket_id);

		var nodeC = $('<div></div>');
		nodeC.addClass('socket_' + payload.socket_id);

		nodeA.addClass('w-100');
		
		nodeB.addClass('col-9 text-right');
		nodeB.append('<h4>' + payload.username + '</h4>');

		nodeC.addClass('col-3 text-left');
		var buttonC = makeInviteButton(payload.socket_id);
		nodeC.append(buttonC);

		nodeA.hide();
		nodeB.hide();
		nodeC.hide();
		$('#players').append(nodeA,nodeB,nodeC);
		nodeA.slideDown(1000);
		nodeB.slideDown(1000);
		nodeC.slideDown(1000);
	} 
	/* If we have seen the person who just joined (something weird happened) */
	else {
		uninvite(payload.socket_id);
		var buttonC = makeInviteButton();
		$('.socket_' + payload.socket_id + ' button').replaceWith(buttonC);
		dom_elements.slideDown(1000);
	}


	/* Manage the message that a new player has joined */
	var newHTML = '<p>' + payload.username + ' just entered the room!</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
	newNode.slideDown(1000);

	
});



/* What do do when the server says that someone has left */

socket.on('player_disconnected',function(payload) {
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}

	/* If we are being notified that we left the room, then ignore it */
	if(payload.socket_id == socket.id) {
		return;
	}

	/* If someone left the room, then animate out all their content */
	var dom_elements = $('.socket_' + payload.socket_id);

	/* If something exists */
	if(dom_elements.length != 0) {
		dom_elements.slideUp(1000);
	} 

	/* Manage the message that a player has left */
	var newHTML = '<p>' + payload.username + ' has left the room.</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
	newNode.slideDown(1000);

});

/* Send an invite message to the server */
function invite(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'invite\' payload: ' + JSON.stringify(payload));
	socket.emit('invite',payload);
}

/* Handle a response after sending an invite message to the server */
socket.on('invite_response',function(payload) {
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInvitedButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);

});

/* Handle a notification that we have been invited */
socket.on('invited',function(payload) {
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makePlayButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);

});



/* Send an UNinvite message to the server */
function uninvite(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'uninvite\' payload: ' + JSON.stringify(payload));
	socket.emit('uninvite',payload);
}

/* Handle a response after sending an UNinvite message to the server */
socket.on('uninvite_response',function(payload) {
	if(payload.result == 'fail'){

		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);

});

/* Handle a notification that we have been univited */
socket.on('uninvited',function(payload) {
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeInviteButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);

});



/* Send an game_start message to the server */
function game_start(who){
	var payload = {};
	payload.requested_user = who;

	console.log('*** Client Log Message: \'game_start\' payload: ' + JSON.stringify(payload));
	socket.emit('game_start',payload);
}


/* Handle a notification that we have been engaged */
socket.on('game_start_response',function(payload) {
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}
	var newNode = makeEngagedButton(payload.socket_id);
	$('.socket_'+payload.socket_id+' button').replaceWith(newNode);

	/* Jumpe to a new page */
	window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;

});


function send_message(){
	var payload = {};
	payload.room = chat_room;
	payload.message = $('#send_message_holder').val();
	console.log('*** Client Log Message: \'send_message\' payload: '+JSON.stringify(payload));
	socket.emit('send_message',payload);
	$('#send_message_holder').val('');
}


socket.on('send_message_response',function(payload) {
	if(payload.result == 'fail'){
		alert(payload.message);
		return;
	}

	var newHTML = '<p><b>'+payload.username+' says:</b> '+payload.message+'</p>';
	var newNode = $(newHTML);
	newNode.hide();
	$('#messages').prepend(newNode);
	newNode.slideDown(1000);
});


function makeInviteButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'btn btn-outline-primary\'>Invite</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		invite(socket_id);
	});
	return(newNode);
}

function makeInvitedButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'btn btn-primary\'>Invited</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		uninvite(socket_id);
	});
	return(newNode);
}

function makePlayButton(socket_id){
	var newHTML = '<button type=\'button\' class=\'btn btn-success\'>Play</button>';
	var newNode = $(newHTML);
	newNode.click(function(){
		game_start(socket_id);
	});
	return(newNode);
}

function makeEngagedButton(){
	var newHTML = '<button type=\'button\' class=\'btn btn-danger\'>Engaged</button>';
	var newNode = $(newHTML);
	return(newNode);
}



	
$(function() {
	var payload = {};
	payload.room = chat_room;
	payload.username = username;

	console.log('*** client log message: \'join_room\' payload: '+JSON.stringify(payload));
	socket.emit('join_room',payload);

	$('#quit').append('<a href="lobby.html?username=' + username + '" class="btn btn-danger btn-default active" role="button" aria-pressed="true">Quit</a>');

});


/* Code for the board specifically */
var old_board = [
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?'],
					['?','?','?','?','?','?','?','?']
				];

var my_color = ' ';
var interval_timer;
// vars below were written by Kathy
var temp_winner = ' ';
var my_theme = ' ';
var my_theme_style = '"feature evil">';
var board_style = ' ';
var my_timer = ' ';
var theme_turn = 'Evil';
var theme_winner = ' ';
var my_win_status = ' ';




/* GAME UPDATE FUNCTION */
/* GAME UPDATE FUNCTION */
/* GAME UPDATE FUNCTION */
/* GAME UPDATE FUNCTION */

socket.on('game_update',function(payload){
	//Kathy hid the line below bc it was annoying
	//console.log('*** Client Log Message: \'game_update\'\n\tpayload: ' + JSON.stringify(payload));
	/* Check for a good board update */
	if(payload.result == 'fail'){
		console.log(payload.message);
		window.location.href = 'lobby.html?username=' + username;
		return;
	}

	/* Check for a good lboard in the payload */
	var board = payload.game.board;
	if('undefined' == typeof board || !board) {
		console.log('Internal error: received a malformed board update from the server');
		return;
	}

	/* Update my color */
	if(socket.id == payload.game.player_white.socket) {
		my_color = 'white';
		my_theme = 'Good'; //this tells the user if they are Good or Evil
		my_theme_style = '"feature good">'; // this calls either the good or evil css class to color the user's theme
	}	
	else if(socket.id == payload.game.player_black.socket) {
		my_color = 'black';
		my_theme = 'Evil'; //this tells the user if they are Good or Evil
		my_theme_style = '"feature evil">'; // this calls either the good or evil css class to color the user's theme
	}
	else {
		/* Something weird is going on, like three people playing at once */
		/* send client back to the lobby */
		window.location.href = 'lobby.html?username=' + username;
		return;
	}


	/* Kathy code to declare theme color var so it will say Evil or Good for turn instead of black or white */
	if (payload.game.whose_turn === 'white') {
			theme_turn = 'Good';
	}
	else if (payload.game.whose_turn === 'black') {
			theme_turn = 'Evil';
	}



	// Original code that had my_color 
	//$('#my_color').html('<h3 id = "my_color">I am ' + my_color + '</h3>');
	$('#my_color').html(' ');
	//$('#my_theme').html('<h2>You are playing for <br><span class="feature evil">' + my_theme + '.</span></h2>');
	$('#my_theme').html('<h2>'+'You are <span class=' + my_theme_style + my_theme + '.</span></h2>');
	// line below is Don's original player and time readout
	//$('#my_color').append('<h4>It is ' + payload.game.whose_turn + '\'s turn. Elapsed time <span id="elapsed"</span></h4>');
	// hiding the line below because it helped me figure out whose turn
	//$('#my_timer').html('<h5>(my_timer)It is ' + payload.game.whose_turn + '\'s turn. Elapsed time is <span id="elapsed"</span></h5>');
	$('#my_timer2').html('<h5>It is ' + theme_turn + '\'s turn. Elapsed time is <span id="elapsed"</span></h5>');

	clearInterval(interval_timer);
	interval_timer = setInterval(function(last_time){
		return function(){
			//Do the work of updating the UI
			var d = new Date();
			var elapsedmilli = d.getTime() - last_time;
			var minutes = Math.floor(elapsedmilli / (60 * 1000));
			var seconds = Math.floor(elapsedmilli % ((60 * 1000))/1000);

			if(seconds < 10) {
				$('#elapsed').html(minutes+':0'+seconds);
			}
			else{
				$('#elapsed').html(minutes+':'+seconds);
			}
		}
	} (payload.game.last_move_time)
			, 1000);

	/* Animate changes to the board */
	
	var blacksum = 0;
	var whitesum = 0;

//moved code from below
	happy_black_token = '<img src = "assets/images/empty_to_black.gif" alt="black square" />';
	happy_white_token = '<img src = "assets/images/empty_to_white.gif" alt="white square" />';
	sad_black_token = '<img src = "assets/images/empty_to_black_sad.gif" alt="sad black square" />';
	sad_white_token = '<img src = "assets/images/empty_to_white_sad.gif" alt="sad white square" />';
	var current_white_token;
	var current_black_token;

	var row, column;
	for(row = 0; row < 8; row++){
		for(column = 0; column <8; column++){
			if(board[row][column] == 'b') {
				blacksum++;
				//console.log('in blk counter, blacksum = ' + blacksum);
			}
			if(board[row][column] == 'w') {
				whitesum++;
				//console.log('in wht counter, whitesum = ' + whitesum);
			}
		}
	}
	var scorediff = 0; //try to get this to update
	scorediff = blacksum - whitesum;
	//console.log('NEW NEW score diff = ' + scorediff);
	if(scorediff < 0) {
		temp_winner = 'white_player';		
		current_black_token = sad_black_token;
		current_white_token = happy_white_token;

	} 
	else if (scorediff > 0) {
		temp_winner = 'black_player';
		current_black_token = happy_black_token;
		current_white_token = sad_white_token;
	}
	else if (scorediff == 0) {
		temp_winner = 'nobody';
		current_black_token = happy_black_token;
		current_white_token = happy_white_token;
	}

	blacksum=0;
	whitesum=0;
	for(row = 0; row < 8; row++){
		for(column = 0; column <8; column++){
			if(board[row][column] == 'b') {
				blacksum++;
			}
			if(board[row][column] == 'w') {
				whitesum++;
			}

				// Remove Don's code below so the board refreshes every time even if there isn't a change
				// If a board space has changed 
				//if(old_board[row][column] != board [row][column]) {


					if(old_board[row][column] == '?' && board[row][column] == ' ') {
						$('#' + row + '_' + column).html('<img src = "assets/images/empty.gif" alt = "empty square"/>');
					}
					else if(old_board[row][column] == '?' && board[row][column] == 'w') {
						$('#' + row + '_' + column).html(current_white_token);
					}
					else if(old_board[row][column] == '?' && board[row][column] == 'b') {
						$('#' + row +'_' + column).html(current_black_token);
					}
					else if(old_board[row][column] == ' ' && board[row][column] == 'w') {
						$('#' + row + '_' + column).html(current_white_token);
					}
					else if(old_board[row][column] == ' ' && board[row][column] == 'b') {
						$('#' + row +'_' + column).html(current_black_token);
					}
					else if(old_board[row][column] == 'w' && board[row][column] == ' ') {
						$('#' + row + '_' + column).html('<img src = "assets/images/white_to_empty.gif" alt="empty square" />');
					}
					else if(old_board[row][column] == 'b' && board[row][column] == ' ') {
						$('#' + row + '_' + column).html('<img src = "assets/images/black_to_empty.gif" alt="empty square" />');
					}
					else if(old_board[row][column] == 'w' && board[row][column] == 'b') {
						$('#' + row +'_' + column).html(current_black_token);
					}
					else if(old_board[row][column] == 'b' && board[row][column] == 'w') {
						$('#' + row + '_' + column).html(current_white_token);
					}
					else if(old_board[row][column] == ' ' && board[row][column] == ' ') {
						$('#' + row + '_' + column).html('<img src = "assets/images/empty.gif" alt = "empty square"/>');
					}
					else if(old_board[row][column] == 'b' && board[row][column] == 'b') {
						//$('#' + row +'_' + column).html(current_black_token);
						$('#' + row +'_' + column).html(current_black_token) + '_still';
					}
					else if(old_board[row][column] == 'w' && board[row][column] == 'w') {
						//$('#' + row +'_' + column).html(current_white_token);
						$('#' + row +'_' + column).html(current_white_token) + '_still';
					}
					else {
						 $('#' + row +  '_' + column).html('<img src = "assets/images/error.gif" alt="error" />');
					}
				//}
				


				/* Set up interactivity */
				$('#' + row + '_' + column).off('click');
				$('#' + row + '_' + column).removeClass('hovered_over');

				if(payload.game.whose_turn === my_color){
					if(payload.game.legal_moves[row][column] === my_color.substr(0,1)){
						//trial
						//$('td').addClass('new_border');
						// this works, but come back after figuring out how to select for the border
						//$('#game_board').addClass('table_change'); //Kathy code
						$('#' + row + '_' + column).addClass('hovered_over');
						$('#' + row + '_' + column).click(function(r,c) {
								return function() {
									var payload = {};
									payload.row = r;
									payload.column = c;
									payload.color = my_color;
									console.log('*** Client Log Message: \'play_token\' payload: ' + JSON.stringify(payload));
									socket.emit('play_token',payload);
								};
					}(row,column));
				} else
				if (payload.game.whose_turn != my_color){
					//$('#game_board').removeClass('table_change');
				}
			}
		} 

	}

	

	//this puts the score at the top of the page
	$('#blacksum').html(blacksum);
	$('#whitesum').html(whitesum);

	//KATHY TRYING TO WRITE TO THE HTML	- THIS WORKS !!!!!!!!!!!!
	$('#scorediff').html('<h5 id = "scorediff">Score diff = ' + scorediff + '</h5>');
	$('#current_winner').html('<h5 id = "current_winner">Current winner is <b>' + temp_winner + '</b></h5>');

	$('#gametop_black_token').html(current_black_token);
	$('#gametop_white_token').html(current_white_token);
	//END KATHY CODE

	/* KATHY CODE - DOESN'T WORK */
	/* KATHY CODE - DOESN'T WORK */
	/* KATHY CODE - DOESN'T WORK */
	/* KATHY CODE - DOESN'T WORK */
	/* I'm going to try moving it into the code that sets the tokens */
		/*
		if (temp_winner === 'black_player') {
			current_black_token = happy_black_token;
			current_white_token = sad_white_token;
		} else if (temp_winner === 'white_player') {		
			current_black_token = sad_black_token;
			current_white_token = happy_white_token;
		} 
		*/


	old_board = board;
});

/* END GAME UPDATE FUNCTION - i think.....*/
/* END GAME UPDATE FUNCTION - i think.....*/
/* END GAME UPDATE FUNCTION - i think.....*/
/* END GAME UPDATE FUNCTION - i think.....*/



socket.on('play_token_response',function(payload){

	console.log('*** Client Log Message: \'play_token_response\'\n\tpayload: ' + JSON.stringify(payload));
	/* Check for a good play_token_response */
	if(payload.result == 'fail'){
		console.log(payload.message);
		alert(payload.message);
		return;
	}
});

socket.on('game_over',function(payload){

	console.log('*** Client Log Message: \'game_over\'\n\tpayload: ' + JSON.stringify(payload));
	/* Check for a good play_token_response */
	if(payload.result == 'fail'){
		console.log(payload.message);
		alert(payload.message);
		return;
	}


	/* Kathy code: if then's to change the winnder to the theme */
	if(payload.who_won === 'black') {
		theme_winner = 'Evil';
	} else
	if (payload.who_won === 'white') {
		theme_winner = 'Good';
	}


	/* Jump to a new page */
	
	// Kathy code to theme the game winner message
	$('#game_over').html('<h1>Game Over</h1><h2>' + theme_winner + ' won!</h2>');
	//$('#game_over').html('<h1>Game Over</h1><h2>' + payload.who_won + ' won!</h2>');
	$('#game_over').append('<a href="lobby.html?username=' + username + '" class="btn btn-success btn-lg active" role="button" aria-pressed="true">Return to the lobby</a>');


});














