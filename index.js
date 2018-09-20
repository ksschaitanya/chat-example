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
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;

aws.config.region = 'us-east-1';

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

io.on('connection', function (socket) {
  socket.on('chat message', function (msg) {
    io.emit('chat message', msg);
  });
});


io.on('connection', function (socket) {
  socket.on('sendImage', function (msg) {
    io.emit('sendImage', msg);
    console.log("this is from index.js file" + msg);
  });
});

io.on('connection', function (socket) {
  socket.on('newframecode', function (msg) {
    io.emit('newframecode', msg);
  });
});

io.on('connection', function (socket) {
  socket.on('rotateImage', function (msg) {
    io.emit('rotateImage', msg);
  });
});

http.listen(port, function () {
  console.log('listening on *:' + port);
});

io.on('connection', function (socket) {
  socket.on('encrypt', function (msg) {
    io.emit('encrypt', encrypt(msg));
  });
});

io.on('connection', function (socket) {
  socket.on('decrypt', function (msg) {
    io.emit('decrypt', decrypt(msg));
  });
});


function encrypt(text) {
  var cipher = crypto.createCipheriv(algorithm, password, ivstring);
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text) {
  var decipher = crypto.createDecipheriv(algorithm, password, ivstring);
  var dec = decipher.update(text, 'hex', 'utf8')
  dec += decipher.final('utf8');
  return dec;
}

var users = [
  {
    name: "xxxx",
    password: "xxxx"
  },
  {
    name: "yyyy",
    password: "yyyy"
  }
];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('./'));

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.post('/login', (req, res) => {
  var message;
  for (var user of users) {
    if (user.name != req.body.name) {
      message = "Wrong Name";
    } else {
      if (user.password != req.body.password) {
        message = "Wrong Password";
        break;
      }
      else {
        var token = jwt.sign(user, "samplesecret");
        console.log(token);
        message = "Login Successful";
        break;
      }
    }
  }
  if (token) {
    res.status(200).json({
      message,
      token
    });
  }
  else {
    res.status(403).json({
      message
    });
  }
});

// app.use((req, res, next) => {
//   // check header or url parameters or post parameters for token
//   console.log(req.body);
//   var token = req.body.token || req.query.token || req.headers['x-access-token'];
//   if (token) {
//     console.log("token");
//     jwt.verify(token, "samplesecret", (err, decod) => {
//       if (err) {
//         res.status(403).json({
//           message: "Wrong Token"
//         });
//         if (res.status(401)) {
//           res.redirect('/login.html')
//         }
//         if (res.status(403)) {
//           res.redirect('/login.html')
//         }
//       }
//       else {
//         console.log("success");
//         req.decoded = decod;
//         next();
//       }
//     });
//   }
//   else {
//     res.redirect('http://quikpic.herokuapp.com/login.html');
//     res.status(403).json({
//       message: "No Token XX"
//     });
//   }
// });

app.post('/getusers', (req, res) => {
  var user_list = [];
  console.log("here");
  users.forEach((user) => {
    user_list.push({ "name": user.name });
  })
  res.send(JSON.stringify({ users: user_list }));
});

app.post('/verifyJWT', (req, res) => {
  console.log("here verifyJWT nodejs");
  res.send(JSON.stringify({ "verify": "ok" }));
});

app.get('/account', (req, res) => res.render('s3upload.html'));

app.get('/sign-s3', (req, res) => {
  //const s3 = new aws.S3();
  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  alert(fileName);
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  var objectParams = { Bucket: S3_BUCKET, Key: fileName, Body: 'Hello World!' };
  // Create object upload promise
  var uploadPromise = new aws.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
  uploadPromise.then(
    function (data) {
      console.log("Successfully uploaded data to " + S3_BUCKET + "/" + fileName);
    }).catch(
      function (err) {
        console.error(err, err.stack);
      });


  const signedUrlExpireSeconds = 60 * 5

  var s3 = new AWS.S3({ apiVersion: '2006-03-01' });

  const url = s3.getSignedUrl('getObject', {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: signedUrlExpireSeconds
  })

  res.write(JSON.stringify(url));
  res.end();
  // });
});

app.post('/save-details', (req, res) => {
  // TODO: Read POSTed form data and do something useful
});