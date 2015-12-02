/* Your code starts here */

var app = app || {};

app.main = (function() {
	console.log('Your code starts here!');

	var person = prompt('What\'s your name?');

	//Global
	var socket;

	//initializing the socket
	var socketSetup = function(){
		socket = io.connect();

		//sent client name to server
		socket.emit('userName', person);

		//key-value pair:
		//1:the exact same string identifier as in the server
		//2:a callback function with the boject that the server
		socket.on('welcome', function(a){
			console.log(a);
		});

		//get message from server and show message to clients
		socket.on('msg-to-clients', function(data){
			$('#messages').append('<li>' + data.id + ' says: ' + data.msg + ' <img src=' + data.emoji + ' height="25px" width="25px" > ' + '</li>');	
		});

		//send message to clients someone left
		socket.on('bye', function(data){
			$('#messages').append($('<li>').text(data));
		});

		//get client's name and send the name to all clients
		socket.on('helloeveryone',function(data){
			$('#messages').append($('<li>').text(data + ' is here '));
		});
		
		//send client's name to server
		socket.emit('storeClientInfo',{customId:person});

		//get keywords and show
		// socket.on('get-keywords', function(data){
			
		// 	$('#messages').append('<li id="word">' + data + '</li>');
		// });

		//get headline and show
		socket.on('get-headline', function(data){
			var thisURL = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + data.text + '&sort=newest&api-key=705552bfb6f5d629771b99e4e00e0674:12:73581032';
			console.log(data.text);
            $.getJSON(thisURL, function(json){
                console.log('headlines received');
                var numDoc = json.response.docs.length;
                if(numDoc >=1){
                    var numHead = Math.floor(Math.random()*numDoc);
                    var headline = json.response.docs[numHead].headline.main;
               		console.log(headline);
                    $('#messages').append('<li id="word">' + headline + '</li>');
                };
            });
			
		});

		// socket.on('get-sentiment', function(data){
		// 	$('.keyWords').empty();
		// 	var size = {
		// 	  width: window.innerWidth || document.body.clientWidth,
		// 	  height: window.innerHeight || document.body.clientHeight
		// 	};
		// 	var swidth = size.width/4;
		// 	$('.keyWords').append('<img src=' + data + ' height="' + swidth +'" width="' + swidth +'"/>');
		// });

	};

	var attachEvents = function(){
		$('#m').keypress(function(e){
			if(e.keyCode == 13 && ($('#m').val().length != 0)){
				socket.emit('msg-to-server', $('#m').val());
				$('#m').val('');
			};
		});

		$('button').off('click').on('click', function(){
			if($('#m').val().length != 0){
				socket.emit('msg-to-server', $('#m').val());
				$('#m').val('');
			}
		});
		var objDiv = document.getElementById("main-container");
		objDiv.scrollTop = objDiv.scrollHeight;
	};

	var init = function(){
		console.log('Initializing app.');
		socketSetup();
		attachEvents();
	};

	return {
		init: init
	};

})();

window.addEventListener('DOMContentLoaded', app.main.init);