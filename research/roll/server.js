var express = require('express')
var app = express();

app.use('/lib', express.static('lib'))
app.use('/css', express.static('css'))
app.use('/data', express.static('data'))
app.use('/ressources', express.static('ressources'))

var path = require('path')

app.get('/index', function(req, res){
  res.sendFile(path.join(__dirname, '/html', '/index.html'))
})

var server = app.listen(8082, function(){
    var port = server.address().port;
    console.log('app listening at port ' + port)
  })