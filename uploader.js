var PinIt = require('pin-it-node');
var fs = require('fs');

var boardId = '464082005291132817';
var url = 'https://twitter.com/tickleapp';
var uploaded_path = './data/uploaded.json';
var new_upload_path = './data/new_found.json';
var uploaded_data = {};
var new_upload_data = {};


var pinIt = new PinIt({
    username: 'seal6363@gmail.com',
    userurl: 'lyrisovo',  //A user's page shows up on Pinterest as:  "http://www.pinterest.com/userurl/"
    password: 'pikachuya',
    debug: false
});


function writeFiles() {
	fs.writeFile('./data/uploaded.json', JSON.stringify(uploaded_data), (err) => {
        	if (err) throw err});
}

function pin_one(tweets, count) {
	if (tweets.length > 0) {
		console.log("-------------------------------")
		console.log("uploading one")
		console.log(tweets.length)

			var tweet = tweets.pop();
			var pin = {boardId: boardId, url: url};
			pin.description = tweet.text;
			pin.media = tweet.media_url;

			console.log(pin)
			if(pin.media != undefined && uploaded_data.ids.indexOf(tweet.id) == -1) {
				pinIt.createPin(pin, function(err, pinObj) {
				    if(err) {
				        // Uh-oh...handle the error
				        console.log(err);
				        tweets.push(tweet);
				        writeFiles();
				    }
				 
				    console.log('Success!  New pin has been added to the board.');
				    //console.log(pinObj);
				    uploaded_data.ids.push(tweet.id);
				    pin_one(tweets, count++);
				});
			} else {
				pin_one(tweets, count);
			}
	} else {
		console.log("done uploading, count: " + count);
		writeFiles();
	}
}

function upload(data) {
	var tweets = data.tweets;
	console.log("start uploading")

	pin_one(tweets, 0);
}



function prepareUploadData() {
	if (fs.existsSync(new_upload_path)) {
	        var pre = fs.readFileSync(new_upload_path, 'utf-8');
	        new_upload_data =  JSON.parse(pre);
	} else {
	        console.log("no existing file");
	        new_upload_data = {"tweets" : []};
	}

	if (fs.existsSync(uploaded_path)) {
	        var pre = fs.readFileSync(uploaded_path, 'utf-8');
	        uploaded_data =  JSON.parse(pre);

	} else {
	        console.log("no existing file");
	        uploaded_data = {"ids" : []};
	}
	upload(new_upload_data);
}

prepareUploadData();
