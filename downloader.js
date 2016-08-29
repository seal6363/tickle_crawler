var fs = require('fs');
var request = require('request');

var new_download_path = './data/new_found.json';
var downloaded_path = './data/downloaded.json'
var new_download_data = {};
var downloaded_data = {};


var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};



function writeFiles() {
	fs.writeFile(downloaded_path, JSON.stringify(downloaded_data), (err) => {
        if (err) throw err});
}

function start_download(data) {
	var tweets = data.tweets;
	var count = 0;
	if (tweets.length > 0) { // have new tweets
		for (var i = tweets.length - 1; i >= 0; i--) {
			console.log(new_download_data.tweets.length)
			var tweet = tweets.pop();
			console.log(tweet)
			var uri = tweet.media_url;
			var id = tweet.id;
			if (uri != undefined && downloaded_data.ids.indexOf(id) < 0) {
				download(uri, './downloaded/' + id + '.jpg', function(){
					count++;
		  			console.log(id + ' downloaded, count ' + count);
		  			downloaded_data.ids.push(id); // records downloaded tweet's id
		  			writeFiles();
				});
			}	
		}
	} else {
		console.log("no new download");
	}
}

// Gets new found tweets and previous downloaded data then starts downloading
function prepareDownloadData() {
	if (fs.existsSync(new_download_path)) {
	        var pre = fs.readFileSync(new_download_path, 'utf-8');
	        new_download_data =  JSON.parse(pre);
	} else {
	        console.log("no existing file");
	        new_download_data = {"tweets" : []};
	}

	if (fs.existsSync(downloaded_path)) {
	        var pre = fs.readFileSync(downloaded_path, 'utf-8');
	        downloaded_data =  JSON.parse(pre);

	} else {
	        console.log("no existing file");
	        downloaded_data = {"ids" : []};
	}
	start_download(new_download_data);
}


prepareDownloadData();