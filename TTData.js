var fs = require('fs');

//Callback functions
var error = function (err, response, body) {
    console.log('ERROR [%s]', JSON.stringify(err));
};
var success = function (data) {
    getTimelineResult(data);
};

var current_query = {};
var current_type = '';
var newRoutine = true;
var nextMaxId = ''; 
var nextSinceId = '';


function writeFiles() {
            fs.writeFile('./data/' + fileName + '.json', JSON.stringify(oldData), (err) => {
                if (err) throw err});
            fs.writeFile('./data/new_found.json', JSON.stringify(oldData), function(err) {
                if (err) throw err
            });
            fs.writeFile('./data/oldIds.json', JSON.stringify({"ids" : oldData.ids}), function(err) {
                if (err) throw err
            });
}

function escapeString(str) {
    str = str.replace(/"/g, "\\\"");
    str = str.replace(/\n/g, " ");
    return str;
}


function processResult(statuses) {
        console.log("-------------------------------------");

    maxId = (current_query.max_id == null) ? '' : current_query.max_id;
        sinceId = (current_query.since_id == null) ? '' : current_query.since_id;
        // done searching
        if (newRoutine && statuses.length == 0) {

            // create json
            writeFiles();
            console.log("done searching, found " + total_new);


        } else {
            
            
            for (var i = 0; i < statuses.length; i++) {
                var status = statuses[i];

                if (oldIds.indexOf(status.id_str) < 0) {
                    var tweet = {};
                    tweet.date = status.created_at;
                    tweet.id = status.id_str;
                    tweet.text = escapeString(status.text);
                    console.log(tweet.text)
                    tweet.media_url = process_media(status.entities);
                    //tweet.user = status.user
                    tweet.hashtags = status.entities.hashtags;
                    oldData.tweets.unshift(tweet);
                    oldData.ids.unshift(tweet.id);
                    if (tweet.media_url != undefined) {
                        newData.tweets.unshift(tweet);
                    }
                    newIds.push(tweet.id);
                    total_new++;
                    console.log(status)
                    //console.log(tweet)
                } else { // found redundant
                    writeFiles();
                    console.log("redundant, found " + total_new);
                    break;
                }
            }
            if (statuses.length !== 0) {
                    nextMaxId = getDecrementMaxId(statuses[statuses.length - 1].id_str);
                    console.log("Next Max Id: " + nextMaxId);

            }

            if (statuses.length !== 0 && newRoutine) {
                    newRoutine = false;
                    nextSinceId = getIncrementSinceId(statuses[0].id_str);

                    console.log("Next Since Id: " + nextSinceId);
            }

            // search for new added
            if (statuses.length == 0 && !newRoutine) {
                console.log("its empty");
                console.log(nextSinceId);
                newRoutine = true;
                current_query.since_id = nextSinceId;

            } else if (sinceId != '') {
                current_query.since_id = sinceId;
                current_query.max_id = nextMaxId;
            } else { // keep going on searching
                current_query.max_id = nextMaxId;
            }
            twitter.getCustomApiCall(current_type, current_query, error, success);
        }

}

function getTimelineResult(data) {
        var statuses = JSON.parse(data);
        processResult(statuses);
}

function getSearchResult(data) {
        var statuses = JSON.parse(data).statuses;
        processResult(statuses);
}

function getIncrementSinceId(sinceId) {

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
    }

function getDecrementMaxId(maxIdStr) {

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
    }

var Twitter = require('twitter-node-client').Twitter;

//Get this data from your twitter apps dashboard
var config = {
    "consumerKey": "AZcZxEflWSoy3eKvDZxiBpQxB",
    "consumerSecret": "qMWhFuYnQK4Oxh1i8ruHB2vKrMHaRzeTn78ACnJRWiCg7eVNtt",
    "accessToken": "2529449622-cWSxhmvc7nWcmn7Br9Oe6Bf1RbOFF3pFmZanIsV",
    "accessTokenSecret": "iQIc23V5OmDpsHisU39QZ9qCDATZyvOMGlVzNl4dYfLXj",
    "callBackUrl": "XXX"
}

var twitter = new Twitter(config);


var date = new Date();
var fileName = date.getFullYear() + "_" + date.getMonth() + "_" + date.getDate() + "_tweets";
var oldIds = [];
var newIds = [];
var oldData = getOldData();
var newData = {"tweets" : []};
var total_new = 0;

function getOldData() {
    if (fs.existsSync('./data/oldIds.json')) {
        var pre = fs.readFileSync('./data/oldIds.json', "utf-8");
            oldIds = JSON.parse(pre).ids;
            console.log(oldIds);
    
    }

    var path = './data/' + fileName + '.json';
    console.log("load " + path)
    if (fs.existsSync(path)) {
        var pre = fs.readFileSync(path, 'utf-8');
        return JSON.parse(pre);
    } else {
        console.log("no existing file");
        return {"tweets" : [], "ids" : []};
    }
}

function process_media(entities) {
    if (entities.hasOwnProperty('media')) {
        var media = entities.media[0]
        return media.media_url;
    }
}

function searchAPI(type) {
    if (type == 'search') {
        current_query = {'q':'@tickleapp', 'count': 50};
        current_type = '/search/tweets.json';
        twitter.getCustomApiCall('/search/tweets.json', current_query, error, success);
    } else if (type == 'user_timeline') {
        current_query = {'screen_name': 'tickleapp', 'count': 1000, 'include_rts': false};
        current_type = '/statuses/user_timeline.json';
        twitter.getCustomApiCall('/statuses/user_timeline.json', current_query, error, success);
    }
}

searchAPI('user_timeline');
