var express = require('express');
var app = express();
var path = require('path');
var port = process.env.PORT || 8080;

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/project.html'));
});

app.use(express.static(__dirname + '/public'));

// http://localhost:8080
console.log("listening at http://localhost:8080")
app.listen(port);