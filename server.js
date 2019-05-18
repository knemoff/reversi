/***************************************************/
/*    Set up the static file server    */
/*    Include the statuic file webserver library */


/* Include the static file webserver library */
var static = require('node-static');

/*Include the http server library */
var http = require('http');

/* assume we are running on heroku */
var port = process.env.PORT;
var directory = __dirname + '/public';

/* If we aren't on heroku, then we need to readjust the port and directory
* information and we know that because port won't be set */
if(typeof port == 'undefined' || !port) {
	directory = './public';
	port = 8080;
}

/* Set up a static web server that will deliver files from the file system */
var file = new static.Server(directory);

/* Construct an http server that gets files from the file server */
var app = http.createServer(
		function(request,response){
			request.addListener('end',function(){
				file.serve(request,response);
				}
			).resume();
		}
	).listen(port);

console.log('The Server is still running!');


/***************************************************/
/*    Set up the web socket server    */


var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
	function log() {
		var array = ['****Server Log Message: '];
		for(var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
			console.log(arguments[i]);
		}
		socket.emit('log',array);
		socket.broadcast.emit('log',array);
	}

	log('A website connected to the server');


	socket.on('disconnect',function(socket) {
		log('A website DISconnected to the server');
	});
});
