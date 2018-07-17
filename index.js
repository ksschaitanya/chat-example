// var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);
// var port = process.env.PORT || 3002;

// app.get('/', function(req, res){
//   //res.sendFile(__dirname + '/index.html');
//   //res.sendFile(__dirname + '/indexNewFeatures.html');
//   //res.sendFile(__dirname + '/btindexnew.html');
//   res.sendFile(__dirname + '/btindexnewV4.html');
// });

var path = require('path');
var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var dir = path.join(__dirname, 'public');

app.use(express.static(dir));

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});


io.on('connection', function(socket){
  socket.on('sendImage', function(msg){
    io.emit('sendImage', msg);
  });
});

io.on('connection', function(socket){
  socket.on('newframecode', function(msg){
    io.emit('newframecode', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
