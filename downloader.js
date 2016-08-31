var fs = require('fs');
var request = require('request');

var Downloader = function() {
	this.new_download_path = './data/new_found_media.json';
	this.downloaded_path = './data/downloaded.json'
	this.new_download_data = {};
	this.downloaded_data = {};
	this.completed = false;
	this.complete_callback = function(){};
};

Downloader.prototype = {

	download: function(uri, filename, callback){
		request.head(uri, function(err, res, body){
			if (err) {
				throw err;
			}
		    console.log('content-type:', res.headers['content-type']);
		    console.log('content-length:', res.headers['content-length']);

		    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
		});
	},

	writeFiles: function(remains) {
		var self = this;
		fs.writeFile(self.downloaded_path, JSON.stringify(self.downloaded_data), (err) => {
        	if (err) throw err;
        	if (remains.length <= 0) {
			  	setTimeout(function() {self.complete();}, 5000);
			 }
        });
	},

	start_download: function(data) {
		var self = this;
		var tweets = data.tweets;
		var count = 0;
		if (tweets.length > 0) { // have new tweets
			var i = tweets.length - 1;
			setInterval(function() {
				if (i >= 0) {
					console.log(self.new_download_data.tweets.length)
					var tweet = tweets.pop();
					console.log(tweet)
					var uri = tweet.media_url;
					var id = tweet.id;
					if (uri != undefined && self.downloaded_data.ids.indexOf(id) < 0) {
						self.download(uri, './downloaded/' + id + '.jpg', function(){
							count++;
				  			console.log(id + ' downloaded, count ' + count);
				  			self.downloaded_data.ids.push(id); // records downloaded tweet's id
				  			self.writeFiles(tweets);
						});
					} 
					if (tweets.length == 1 && uri == undefined) {
						self.writeFiles(tweets);
					}
					i--;
				} else {
					self.writeFiles(tweets);
				}
			}, 18);
			
		} else {
			console.log("no new download");
			self.complete();
		}
	},

	// Gets new found tweets and previous downloaded data then starts downloading
 	initialize_execute: function(callback) {
 		var self = this;
 		self.complete_callback = callback;
		if (fs.existsSync(self.new_download_path)) {
		        var pre = fs.readFileSync(self.new_download_path, 'utf-8');
		        self.new_download_data =  JSON.parse(pre);
		} else {
		        console.log("no existing file");
		        self.new_download_data = {"tweets" : []};
		}

		if (fs.existsSync(self.downloaded_path)) {
		        var pre = fs.readFileSync(self.downloaded_path, 'utf-8');
		        self.downloaded_data =  JSON.parse(pre);

		} else {
		        console.log("no existing file");
		        self.downloaded_data = {"ids" : []};
		}
		console.log(self.new_download_data)
		self.start_download(self.new_download_data);
	},

	complete: function() {
		var self = this;
		if (!self.completed) { 
	        self.completed = true;
			console.log("downloader completes execution");
			self.complete_callback();
		}
	}


};
 

module.exports = Downloader;

