var express = require('express'),
   url = require("url"),
   fs = require("fs"),
   ejs = require('ejs'),
  path = require("path");

var app = express();
app.set('view engine', 'ejs');
app.engine('.html', ejs.renderFile);

app.get('/',function(req,res){
  function videoFilter(name){
    if (name.indexOf('.mp4')<0)
      return false;
    return true;
  }
  var videos;
  fs.readdir(path.resolve(__dirname,'videos/'), function(err, data){
    if (err) throw err;
    videos = data.filter(videoFilter)
    res.render('index.html', {videos: videos});
  });
})

app.get('/stream/:id',function(req,res){
  function vttFilter(name){
    if (name.indexOf('.vtt')<0)
      return false;
    return true;
  }
  var videoId=req.params.id;
  var hostUrl = req.protocol + '://' + req.get('host');
  fs.readdir(path.resolve(__dirname,'vtts/'), function(err, data){
    if (err) throw err;
    vtts = data.filter(vttFilter);
    res.render('player.html', {hostUrl: hostUrl, videoId: videoId, vtts: vtts});
  });
})

app.get('/video/:id', function(req, res) {
  var file = path.resolve(__dirname,'videos/'+req.params.id);
  var range = req.headers.range;
  if(range){
  	var positions = range.replace(/bytes=/, "").split("-");
  	var start = parseInt(positions[0], 10);
	}
	else {
		var positions = [];
		var start = 0
	}
    fs.stat(file, function(err, stats) {
      var total = stats.size;
      var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
      var chunksize = (end - start) + 1;

      res.writeHead(206, {
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4"
      });

      var stream = fs.createReadStream(file, { start: start, end: end })
        .on("open", function() {
          stream.pipe(res);
        }).on("error", function(err) {
          res.end(err);
        });
    });
});

app.get('/vtt/:id',function(req,res){
	var file = path.resolve(__dirname,'vtts/'+req.params.id);
	var stream = fs.createReadStream(file)
        .on("open", function() {
          stream.pipe(res);
        }).on("error", function(err) {
          res.end(err);
        });
});
app.listen(4000);