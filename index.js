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

var crypto = require('crypto'),
algorithm = 'aes-256-ctr',
//password = crypto.randomBytes(32);
password = 'abcde12345abcde12345abcde1234511';
//var iv = new Buffer(crypto.randomBytes(16));
var iv = 'abcde12345abcde1';
var ivstring = iv.toString('hex').slice(0, 16);

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


function encrypt(text){
  var cipher = crypto.createCipheriv(algorithm,password,ivstring);
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipheriv(algorithm,password,ivstring);
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}