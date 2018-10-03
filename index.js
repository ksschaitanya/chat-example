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
const multer = require('multer');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
const S3_BUCKET = process.env.S3_BUCKET;
var fd = "";
var fs = require('fs');

var app = express();

// Load the SDK and UUID
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
// Create name for uploaded object key
var keyNameDW = 'user1/hello_world1.txt';
var keyName = '';


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

/// FROM HERE S3 CALLS TEST


//MULTER CONFIG: to get file photos to temp server storage
const multerConfig = {

  //specify diskStorage (another option is memory)
  storage: multer.diskStorage({

    //specify destination
    destination: function (req, file, next) {
      next(null, './public/photo-storage');
    },

    //specify the filename to be unique
    filename: function (req, file, next) {
      console.log(file);
      //get the file mimetype ie 'image/jpeg' split and prefer the second value ie'jpeg'
      const ext = file.mimetype.split('/')[1];
      //set the file fieldname to a unique name containing the original name, current datetime and the extension.
      const savingFileName = file.fieldname + '-' + Date.now() + '.' + ext;
      next(null, savingFileName);
      // fd = '/public/photo-storage/'+savingFileName;
      // console.log(fd);
    }
  }),
  savingFileName: fd,

  // filter out and prevent non-image files.
  fileFilter: function (req, file, next) {
    if (!file) {
      next();
    }

    // only permit image mimetypes
    const image = file.mimetype.startsWith('image/');
    if (image) {
      console.log('photo uploaded');
      next(null, true);
    } else {
      console.log("file not supported")
      //TODO:  A better message response to user on failure.
      return next();
    }
  }
};

app.post('/verifyS3CALL', (req, res) => {
  
  var s3 = new AWS.S3({apiVersion: '2006-03-01'});
  const signedUrlExpireSeconds = 60 * 5;
  
  const url = s3.getSignedUrl('getObject', {
      Bucket: S3_BUCKET,
      Key: keyNameDW,
      Expires: signedUrlExpireSeconds
  });
  console.log(url);
  res.send(JSON.stringify({ "verify": url }));
});

app.post('/verifyS3UPLOADCALL', multer(multerConfig).single('photo'), function (req, res) {

  if (!req.file) return res.send('Please upload a file');

  console.log('1- ' + __dirname + '/' + req.file.path);
  console.log('2- ' + req.protocol + req.file.path);
  console.log('3- ' + req.file.path);

  keyName = req.file.path;
  var keyName2 = keyName.replace('public/photo-storage/' ,'');//('public\\photo-storage\\', '');
  console.log('keyName---' + keyName);
  console.log('keyName2---' + keyName2);
  var url = '';

  //// UPLOAD CALL ONLY
  //// Create params for putObject call

  fs.readFile(keyName, function (err, data) {
    if (err) { throw err; }

    var objectParams = { Bucket: S3_BUCKET, Key: keyName2, Body: data };
    // Create object upload promise
    var uploadPromise = new AWS.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
    uploadPromise.then(
      function (data) {
        console.log(data);
        console.log("Successfully uploaded data to " + S3_BUCKET + "/" + keyName2);
        //res.send("Successfully uploaded data to " + S3_BUCKET + "/" + keyName2);

        AWS.config.update({
          // DOWNLOAD USER
          accessKeyId: process.env.S3_DOWNLOADUSER, 
          secretAccessKey: process.env.S3_DOWNLOADUSERPAS
        });
        console.log('keyName---' + keyName2);
        var s3 = new AWS.S3({ apiVersion: '2006-03-01' });
        const signedUrlExpireSeconds = 60 * 5
        url = s3.getSignedUrl('getObject', {
          Bucket: S3_BUCKET,
          Key: keyName2,
          Expires: signedUrlExpireSeconds
        });
        console.log('------->' + url);
        res.send(url);
        //surl = url;

      }).catch(
        function (err) {
          console.error(err, err.stack);
          res.send(err + ',' + err.stack);
        });
  });

  // AWS.config.update({
  //   // DOWNLOAD USER
          // accessKeyId: process.env.S3_DOWNLOADUSER, 
          // secretAccessKey: process.env.S3_DOWNLOADUSERPAS
  // });
  // console.log('keyName---' + keyName2);
  // var s3 = new AWS.S3({apiVersion: '2006-03-01'});
  // const signedUrlExpireSeconds = 60 * 5
  // const url = s3.getSignedUrl('getObject', {
  //     Bucket: bucketName,
  //     Key: keyName2,
  //     Expires: signedUrlExpireSeconds
  // })
  // console.log(url)

  //Here is where I could add functions to then get the url of the new photo
  //And relocate that to a cloud storage solution with a callback containing its new url
  //then ideally loading that into your database solution.   Use case - user uploading an avatar...

  /// For now moving with in function

  // res.send('<img width="40" height="40" src="'+url+'"/>');
}

);


app.get('/account', (req, res) => res.render('s3upload.html'));

app.post('/sign-s3NEW', (req, res) => {
  const fileName = req.body.fileName;
  res.send(json.stringify({"result":  "ok"}));
});


app.get('/sign-s3', (req, res) => {
  //const s3 = new aws.S3();
  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  console.log(fileName);
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  // var objectParams = { Bucket: S3_BUCKET, Key: fileName, Body: 'Hello World!' };
  // // Create object upload promise
  // var uploadPromise = new aws.S3({ apiVersion: '2006-03-01' }).putObject(objectParams).promise();
  // uploadPromise.then(
  //   function (data) {
  //     console.log("Successfully uploaded data to " + S3_BUCKET + "/" + fileName);
  //   }).catch(
  //     function (err) {
  //       console.error(err, err.stack);
  //     });


  // const signedUrlExpireSeconds = 60 * 5

  // var s3 = new AWS.S3({ apiVersion: '2006-03-01' });

  // const url = s3.getSignedUrl('getObject', {
  //   Bucket: S3_BUCKET,
  //   Key: fileName,
  //   Expires: signedUrlExpireSeconds
  // })

  //res.write(JSON.stringify(url));
  res.write(json.stringify("result:worked"));
  res.end();
  // });
});

app.post('/save-details', (req, res) => {
  // TODO: Read POSTed form data and do something useful
});