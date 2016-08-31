var PinIt = require('pin-it-node');
var fs = require('fs');


var Uploader = function() {
	this.uploaded_path = './data/uploaded.json';
	this.new_upload_path = './data/new_found_media.json';
	this.uploaded_data = {};
	this.new_upload_data = {};

	// Data for Pinterest, to fill
	this.boardId = '464082005291133308';
	this.url = 'https://twitter.com/tickleapp';
	this.pinIt = new PinIt({
	    username: 'seal6363@gmail.com',
	    userurl: 'lyrisovo',  //A user's page shows up on Pinterest as:  "http://www.pinterest.com/userurl/"
	    password: 'pikachuya',
	    debug: false
	});

	this.completed = false;
	this.complete_callback = function(){process.exit();};
}

Uploader.prototype = {

	writeFiles: function(remains) {
		var self = this;
		fs.writeFile('./data/uploaded.json', JSON.stringify(self.uploaded_data), (err) => {
	    	if (err) throw err;
	    	if (remains.length <= 0) { 
			  	setTimeout(function() {self.complete();}, 3000);
			 }
		});
	},

	pin_one: function(tweets, count) {
		var self = this;
		if (tweets.length > 0) {
			console.log("-------------------------------")
			console.log("uploading one")
			console.log(tweets.length)

				var tweet = tweets.pop();
				var pin = {boardId: self.boardId, url: self.url};
				pin.description = tweet.text;
				pin.media = tweet.media_url;

				console.log(pin)
				if(pin.media != undefined && self.uploaded_data.ids.indexOf(tweet.id) == -1) {
					self.pinIt.createPin(pin, function(err, pinObj) {
					    if(err) {
					        // Uh-oh...handle the error
					        console.log(err);
					        tweets.push(tweet);
					        self.writeFiles(tweets);
					        self.pin_one(tweets, count);
					    
					    } else {
					 
						    console.log('Success!  New pin has been added to the board.');
						    //console.log(pinObj);
						    self.uploaded_data.ids.push(tweet.id);
						    self.pin_one(tweets, count++);
						}
					});
				} else {
					self.pin_one(tweets, count);
				}
		} else {
			console.log("done uploading, count: " + count);
			self.writeFiles(tweets);
		}
	},

	upload: function(data) {
		var self = this;
		var tweets = data.tweets;
		console.log("start uploading")

		self.pin_one(tweets, 0);
	},


	// Gets new found tweets and previous uploaded data then starts uploading
	initialize_execute: function() {
		var self = this;
		//self.complete_callback = callback;
		if (fs.existsSync(self.new_upload_path)) {
		        var pre = fs.readFileSync(self.new_upload_path, 'utf-8');
		        self.new_upload_data =  JSON.parse(pre);
		} else {
		        console.log("no existing file");
		        self.new_upload_data = {"tweets" : []};
		}

		if (fs.existsSync(self.uploaded_path)) {
		        var pre = fs.readFileSync(self.uploaded_path, 'utf-8');
		        self.uploaded_data =  JSON.parse(pre);

		} else {
		        console.log("no existing file");
		        self.uploaded_data = {"ids" : []};
		}
		self.upload(self.new_upload_data);
	},

	complete: function() {
		var self = this;
		if (!self.completed) { 
	        self.completed = true;
			console.log("uploader completes execution");
			self.complete_callback();
		}
	}
}

module.exports = Uploader;
