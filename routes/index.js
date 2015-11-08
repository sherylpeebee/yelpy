var express = require('express');
var router = express.Router();
var secrets = require('../secrets.js');

var yelp = require("yelp").createClient({
  consumer_key: secrets.CONSUMER_KEY,
  consumer_secret: secrets.CONSUMER_SECRET,
  token: secrets.TOKEN,
  token_secret: secrets.TOKEN_SECRET
});

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/yelpSearch/:ll?', function(req, res, next) {
  if(!req.query.location && !req.params.ll){
    res.status(400).send({error: 'We weren\'t able to determine your location. Please try again.'});
  }
  else if(req.query.location && req.params.ll){
    res.status(400).send({error: 'Please specify a location.'});
  }
  var zoneTerm = req.params.ll ? 'll' : 'location',
      zone = req.params.ll ? req.params.ll : req.query.location;
      //'ll' accepts a comma separated long and lat, e.g.: ll:'33.788022, -102.399797'
  var request_data = {
    term: req.query.term ? req.query.term: null,//may need to decode uri component here
    accuracy: 9,
    // limit: 20,
    radius_filter: 16000//in meters --> 20 miles; max is 40000 meters
  };
  request_data[zoneTerm] = zone;

  yelp.search(request_data, function(error, data) {
    if(error){
      console.log(error);
    }
    console.log(data);
    res.status(200).json(data);
  });
});


module.exports = router;
