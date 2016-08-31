/*
Create 
*/

var fs = require('fs');
var Twitter = require('twitter-node-client').Twitter;

// modules for upload and download
// Prototype functions, after_crawling and after_downloading, might have to be modified if below modules are changed.
var downloader = require('./downloader');
var uploader = require('./uploader');


var TT = function() {
    // Variables for processing GET request 
    // see twitter-node-client (https://github.com/BoyCook/TwitterJSClient) for more info
    this.current_query = {};
    this.current_type = ''; // 'user_timeline' or 'search'
    this.newRoutine = true; 
    this.nextMaxId = ''; // see REST API for more info
    this.nextSinceId = ''; // see REST API for more info

    // Variables for noting the data
    this.date = new Date();
    this.fileName = this.date.getFullYear() + "_" + this.date.getMonth() + "_" + this.date.getDate() + "_tweets";
    this.oldIds = [];
    this.newIds = [];
    this.oldData = {};
    this.newData = {"tweets" : []};
    this.total_new = 0;
    this.data_dir = './data/';

    //Get this data from twitter apps dashboard
    this.config = {
        "consumerKey": "AZcZxEflWSoy3eKvDZxiBpQxB",
        "consumerSecret": "qMWhFuYnQK4Oxh1i8ruHB2vKrMHaRzeTn78ACnJRWiCg7eVNtt",
        "accessToken": "2529449622-cWSxhmvc7nWcmn7Br9Oe6Bf1RbOFF3pFmZanIsV",
        "accessTokenSecret": "iQIc23V5OmDpsHisU39QZ9qCDATZyvOMGlVzNl4dYfLXj",
        "callBackUrl": "XXX"
    }

    this.twitter = new Twitter(this.config);
    this.completed = false;
};

TT.prototype = {

    // Given a callback function executed after completeing crawling
    writeFiles: function(callback) {
        var self = this;
            fs.writeFile(self.data_dir + self.fileName + '.json', JSON.stringify(self.oldData), (err) => {
                if (err) throw err});
            fs.writeFile(self.data_dir + 'new_found_media.json', JSON.stringify(self.newData), function(err) {
                if (err) throw err
            });
            fs.writeFile(self.data_dir + 'oldIds.json', JSON.stringify({"ids" : self.oldIds}), function(err) {
                if (err) throw err;
                if (self.completed) {
                    setTimeout(function() {callback.call(self);}, 1000);
                }
            });
    },

    // Escapes the tweet's description to proper format
    escapeString: function(str) {
        var self = this;
        str = str.replace(/"/g, "\\\"");
        str = str.replace(/\n/g, " ");
        return str;
    },


    processResult: function(statuses) {
        var self = this;
        console.log("-------------------------------------");

            var maxId = (self.current_query.max_id == null) ? '' : self.current_query.max_id;
            var sinceId = (self.current_query.since_id == null) ? '' : self.current_query.since_id;
            // done searching
            if (self.newRoutine && statuses.length == 0) {

                // create json
                self.completed = true;
                self.writeFiles(self.after_crawling.bind(self));
                console.log("done searching, found " + self.total_new);

            } else {

                for (var i = 0; i < statuses.length; i++) {
                    var status = statuses[i];

                    if (self.oldIds.indexOf(status.id_str) < 0) {
                        var tweet = {};
                        tweet.date = status.created_at;
                        tweet.id = status.id_str;
                        tweet.text = self.escapeString(status.text);
                        console.log(tweet.text)
                        tweet.media_url = self.process_media(status.entities);
                        //tweet.user = status.user
                        tweet.hashtags = status.entities.hashtags;
                        self.oldData.tweets.unshift(tweet);
                        self.oldData.ids.unshift(tweet.id);
                        self.oldIds.unshift(tweet.id);
                        if (tweet.media_url != undefined) {
                            self.newData.tweets.unshift(tweet);
                        }
                        self.newIds.push(tweet.id);
                        self.total_new++;
                        console.log(status)
                        //console.log(tweet)
                    } else { // found redundant
                        self.writeFiles(self.after_crawling.bind(self));
                        console.log("redundant, found " + self.total_new);
                        break;
                    }
                }
                if (statuses.length !== 0) {
                        self.nextMaxId = self.getDecrementMaxId(statuses[statuses.length - 1].id_str);
                        console.log("Next Max Id: " + self.nextMaxId);

                }

                if (statuses.length !== 0 && self.newRoutine) {
                        self.newRoutine = false;
                        self.nextSinceId = self.getIncrementSinceId(statuses[0].id_str);

                        console.log("Next Since Id: " + self.nextSinceId);
                }

                // search for new added
                if (statuses.length == 0 && !self.newRoutine) {
                    console.log("its empty");
                    console.log(self.nextSinceId);
                    self.newRoutine = true;
                    self.current_query.since_id = self.nextSinceId;
                    if (self.current_query.hasOwnProperty('max_id')) {
                        delete self.current_query['max_id'];
                    }

                } else if (sinceId != '') {
                    self.current_query.since_id = sinceId;
                    self.current_query.max_id = self.nextMaxId;
                } else { // keep going on searching
                    self.current_query.max_id = self.nextMaxId;
                    if (self.current_query.hasOwnProperty('since_id')) {
                        delete self.current_query['since_id'];
                    }
                }
                self.twitter.getCustomApiCall(self.current_type, self.current_query, self.error, self.success.bind(self));
            }

    },

    // processes result from REST API: GET statuses/user_timeline
    getTimelineResult: function(data) {
        var self = this;
            var statuses = JSON.parse(data);
            self.processResult(statuses);
    },

    // processes result from REST API: GET search/tweets
    getSearchResult: function(data) {
        var self = this;
            var statuses = JSON.parse(data).statuses;
            self.processResult(statuses);
    },

    // calculates Since ID
    getIncrementSinceId: function(sinceId) {
        var self = this;
            var i, currentDigit,
                index = 1,
                borrowDigit = true,
                length = sinceId.length;

            function setCharAt(str, index, chr) {

                if (index > str.length - 1) {
                    return str;
                }

                return str.substr(0, index) + chr + str.substr(index + 1);
            }

            while (borrowDigit) {

                i = length - index;
                currentDigit = sinceId[i];
                currentDigit = parseInt(currentDigit) + 1;

                if (currentDigit < 10) {

                    borrowDigit = false;
                    sinceId = setCharAt(sinceId, i, currentDigit.toString());

                    continue;
                }

                sinceId = setCharAt(sinceId, i, "0");
                index += 1;
            }

            return sinceId;
    },

    // calculates Max ID
    getDecrementMaxId: function(maxIdStr) {
        var self = this;
            var i, currentDigit,
                index = 1,
                borrowDigit = true,
                length = maxIdStr.length;

            function setCharAt(str, index, chr) {

                if (index > str.length - 1) {
                    return str;
                }

                return str.substr(0, index) + chr + str.substr(index + 1);
            }

            while (borrowDigit) {

                i = length - index;
                currentDigit = maxIdStr[i];
                currentDigit = parseInt(currentDigit) - 1;

                if (currentDigit >= 0) {

                    borrowDigit = false;
                    maxIdStr = setCharAt(maxIdStr, i, currentDigit.toString());

                    continue;
                }

                maxIdStr = setCharAt(maxIdStr, i, "0");
                index += 1;
            }

            return maxIdStr;
    },



    initialize_execute: function() {
        var self = this;

        // create directory for data storing if not exists
        if (!fs.existsSync(self.data_dir)){
            fs.mkdirSync(self.data_dir);
        }
        if (!fs.existsSync('./downloaded/')) {
            fs.mkdirSync('./downloaded/');
        }
        // get all IDs found previously
        if (fs.existsSync(self.data_dir + 'oldIds.json')) {
            var pre = fs.readFileSync(self.data_dir + 'oldIds.json', "utf-8");
                self.oldIds = JSON.parse(pre).ids;
                console.log(self.oldIds);
        
        }
        // get today's file if exists
        var path = self.data_dir + self.fileName + '.json';
        console.log("load " + path)
        if (fs.existsSync(path)) {
            var pre = fs.readFileSync(path, 'utf-8');
            self.oldData = JSON.parse(pre);
        } else {
            console.log("no existing file");
            self.oldData = {"tweets" : [], "ids" : []};
        }
        self.searchAPI('user_timeline');
    },

    // Returns the media url of the tweet
    process_media: function(entities) {
        var self = this;
        if (entities.hasOwnProperty('media')) {
            var media = entities.media[0]
            return media.media_url;
        }
    },

    // Excecutes GET request with the given type (user_timeline as defalut)
    searchAPI: function(type) {
        var self = this;
        if (type == 'search') {
            self.current_query = {'q':'@tickleapp', 'count': 50};
            self.current_type = '/search/tweets.json';
            self.twitter.getCustomApiCall('/search/tweets.json', self.current_query, self.error, self.getSearchResult);
        } else if (type == 'user_timeline') {
            self.current_query = {'screen_name': 'tickleapp', 'count': 1000, 'include_rts': false};
            self.current_type = '/statuses/user_timeline.json';
            self.twitter.getCustomApiCall('/statuses/user_timeline.json', self.current_query, self.error, self.success.bind(self));
        }
    },

    //Callback functions
    error: function (err, response, body) {
        console.log('ERROR [%s]', JSON.stringify(err));
    },
    success: function (data) {
        self = this;
        self.getTimelineResult.call(self, data);
    },

    // executes after obtaining all the data
    after_crawling: function() {
        var self = this;
        var Downloader = new downloader();
        Downloader.initialize_execute(self.after_downloading.bind(self));
    },

    // executes after downloading the media
    after_downloading: function() {
        var self = this;
            var Uploader = new uploader();
            Uploader.initialize_execute();
    }

}

var tt = new TT();
tt.initialize_execute();