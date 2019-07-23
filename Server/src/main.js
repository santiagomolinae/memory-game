var express = require('express');
var app = express();
var cors = require('cors');
var server = require('http').Server(app);
var io = require('socket.io')(server);

//app.use(express.static('src/App.js'));

app.get('/', function(req, res){
    res.status(200);
});

app.use(cors());

io.on('connection', function(socket){
    console.log("Conected with socket");
});

server.listen(8080, function(){
    console.log("Server running on http://localhost:8080");
});