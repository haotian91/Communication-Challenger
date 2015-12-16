/*---------- BASIC SETUP ----------*/
var express		= require('express'),
	bodyParser	= require('body-parser');	// helper for parsing HTTP requests
var app = express();						// our Express app
var PORT = 4000;

var AlchemyAPI = require('./alchemyapi');
var alchemyapi = new AlchemyAPI();
var fs = require('fs');

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));// parse application/x-www-form-urlencoded
app.use(bodyParser.json());							// parse application/json

// Express server
app.use(function(req, res, next) {
    // Setup a Cross Origin Resource sharing
    // See CORS at https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('incoming request from ---> ' + ip);
    var url = req.originalUrl;
    console.log('### requesting ---> ' + url);	// Show the URL user just hit by user
    next();
});

app.use('/', express.static(__dirname + '/public'));

/*-- socket.io setup ---*/
var server = require('http').Server(app);
var io = require('socket.io')(server);
var clients = [];

server.listen(PORT, function(){
    console.log('Express server is running at ' + PORT);
});

/*-- johnnyfive $ pixel ---*/
pixel = require("node-pixel");
five = require("johnny-five");

var board = new five.Board();


// Everything will be inside the on() function
// .on() listens to any string you create ('gabriel-entered', 'shakti-arrived',...)
// or two predefined events: 'connection' and 'disconnect'
/*-------------- APP --------------*/

    // .on(identifier, callback(data))      listens to 
    // .emit(identifier, data)              sends data to every user
    // .broadcast.emit(identifier, data)    sends data to every user,
    //                                      except the newly created
    //key-value pair;
    //1:a string that identifies the message
    //2:message(data)
    //send message to everyone;
    //socket.broadcast.emit('hey-everybody', 'hey everybody! please welcome ' + socket.id);
    

//EVERYTHING HAPPENS INSIDE OF HERE 
board.on("ready", function() {

    var strip = new pixel.Strip({
        data: 6,
        length: 30,
        board: this,
        controller: "FIRMATA",
    });

    strip.on("ready", function() {
        // do stuff with the strip here.
        strip.color("rgb(255,255,255)"); // turns entire strip red using a hex colour
        strip.show();
    });

    io.on('connection', function(socket){
        console.log('a new client has connected');

        socket.emit('welcome', 'welcome! your id is ' + socket.id);
        
        socket.on('time',function(data){
            if(board.isReady){  
                if(data<0){ data = 0 }
                // console.log(data);
                strip.color("rgb("+data+","+data+","+data+")"); 
                strip.show();                
            }; 
        });

        //get client' name from new client and send to all clients
        socket.on('userName',function(data){
            io.sockets.emit('helloeveryone',data)
        });

        //get message from clients and send message and id to all clients
        socket.on('msg-to-server', function(data){

            var myText = data;

            /*------new york times -------*/ 
            

            /*------keywords-------*/    
            alchemyapi.keywords("text", myText, {'sentiment': 1}, function(response){ 
                var keyWords = response['keywords'];
                var words = keyWords.length;
                var num = Math.floor(Math.random()*words);
                for (var i=0; i< keyWords.length; i++){
                    console.log("keywords: " + keyWords[i].text);
                };
                if(keyWords.length>=1){
                // socket.emit('get-keywords', keyWords[num].text);
                socket.emit('get-headline', keyWords[num]);
                socket.emit('get-gif', keyWords[num]);
                };
            });
            

            /*------sentiment-emoji-----*/
            alchemyapi.sentiment('text',myText,{},function(response){
                console.log("sentiment:" + response['docSentiment']['type']);
                var judge = response['docSentiment']['type'];
            

                for(var i=0; i<clients.length;i++){
                    if(clients[i].clientId == socket.id){
                        if(judge == 'positive'){
                            io.sockets.emit('msg-to-clients',{
                            id:clients[i].customId,
                            msg:data,
                            emoji:'"file/'+Math.floor((Math.random() *5) + 11)+'.png"'
                            })
                        };

                        if(judge == 'neutral'){
                            io.sockets.emit('msg-to-clients',{
                            id:clients[i].customId,
                            msg:data,
                            emoji:'"file/'+Math.floor((Math.random() *5) + 6)+'.png"'
                            })
                        };

                        if(judge == 'negative'){
                            io.sockets.emit('msg-to-clients',{
                            id:clients[i].customId,
                            msg:data,
                            emoji:'"file/'+Math.floor((Math.random() *5) + 1)+'.png"'
                            })
                        };   
                    };  
                };      
            });

        });

        //tell clients someone left
        socket.on('disconnect', function(){
            for(var i=0; i<clients.length;i++){
                if(clients[i].clientId == socket.id){
                   io.sockets.emit('bye', clients[i].customId + ' left');
                   clients.splice(i,1);
                }
            }
        });


        //store client name
        socket.on('storeClientInfo', function(data){
            var clientInfo = new Object();
            clientInfo.customId = data.customId;
            clientInfo.clientId = socket.id;
            clients.push(clientInfo);
        });

    });

});



