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

var crypto = require('crypto');

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
    console.log("this is from index.js file" + msg);
  });
});

io.on('connection', function(socket){
  socket.on('newframecode', function(msg){
    io.emit('newframecode', msg);
  });
});

io.on('connection', function(socket){
  socket.on('rotateImage', function(msg){
    io.emit('rotateImage', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

io.on('connection', function(socket){
  socket.on('encrypt', function(msg){    
    io.emit('encrypt', encrypt(msg));
  });
});

io.on('connection', function(socket){
  socket.on('decrypt', function(msg){    
    io.emit('decrypt', decrypt(msg));
  });
});

var encrypt = function(text){
  var algorithm = 'aes-256-ctr';
  var password = 'gh6ttr';
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(JSON.stringify(text),'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

var decrypt = function(text){
  var algorithm = 'aes-256-ctr';
  var password = 'gh6ttr';
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return JSON.decode(dec);
}

