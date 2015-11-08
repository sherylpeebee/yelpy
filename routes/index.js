var express = require('express');
var router = express.Router();
var secrets = require('../secrets.js');

var request_data = {
    url: 'https://api.yelp.com/v2/search/?location=San Francisco, CA',
    method: 'GET'
};

var yelp = require("yelp").createClient({
  consumer_key: secrets.CONSUMER_KEY,
  consumer_secret: secrets.CONSUMER_SECRET,
  token: secrets.TOKEN,
  token_secret: secrets.TOKEN_SECRET
});


yelp.search({term: "sports", location: "San Jose", limit: 3, radius_filter: 16000}, function(error, data) {
  //max radius is 40000 meters or 25 miles. to start i want to keep everything within 10 miles of current location
  //maybe later give option to toggle between manual location and current location
  if(error){
    console.log(error);
  }
  console.log(data);
});

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
