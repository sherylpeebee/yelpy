var express = require('express');
var router = express.Router();
var secrets = require('../secrets.js');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

/**  API SDKs  **/
var yelp = require("yelp").createClient({
  consumer_key: secrets.CONSUMER_KEY,
  consumer_secret: secrets.CONSUMER_SECRET,
  token: secrets.TOKEN,
  token_secret: secrets.TOKEN_SECRET
});

var Alchemy = require('node-alchemyapi'),
    alchemyAPI = new Alchemy(secrets.ALCHEMY_KEY);

/**  routes **/
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/scrape', function(req, res){//endpoint to test scrape implementation
  var url = 'http://www.yelp.com/biz/the-doghouse-lathrop',
      reviews,
      reviewThemes,
      tags,
      moreBusinessInfo;
  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html, {ignoreWhitespace: true});
      reviews =  $('#super-container .feed .review-list').children().text();//returns one page's worth of review text from those deemed by yelp to be most useful
      moreBusinessInfo = $('#super-container .column-beta.sidebar .bordered-rail .ylist').text();
      //^info such as 'good for', 'ambience', 'attire', etc, if any.^
      //this may or may not be available for a given search term/location.
      console.log(moreBusinessInfo);
      alchemyAPI.keywords('text', reviews, {'sentiment': 1}, function(response) {
        reviewThemes = response;
        alchemyAPI.concepts('text', reviews, {'sentiment': 1}, function(response) {
          tags = response;
          var json = {reviews: reviews, reviewThemes: reviewThemes, tags: tags, moreBusinessInfo: moreBusinessInfo};
          res.json(json);
        });
      });
    }
    else {
      console.log(error);
    }
  });
});

router.get('/yelpSearch/:latlong?', function(req, res, next) {
  if(!req.query.location && !req.params.latlong){
    res.status(400).send({error: 'We weren\'t able to determine your location. Please try again.'});
  }
  else if(req.query.location && req.params.latlong){
    res.status(400).send({error: 'Please specify a location.'});
  }
  var zoneTerm = req.params.latlong ? 'll' : 'location',
      zone = req.params.latlong ? req.params.latlong : req.query.location;
      //'ll' accepts a comma separated long and lat STRING value, e.g.: ll:'33.788022, -102.399797'
      //'term' is how yelp api recognizes search terms
  var request_data = {
    term: req.query.term ? req.query.term: null,
    accuracy: 9,
    // limit: 20,
    // offset: 20,
    radius_filter: 16000//in meters --> 20 miles; max is 40000 meters
  };
  request_data[zoneTerm] = zone;

  yelp.search(request_data, function(error, data) {
    if(error){
      console.log(error);
      res.status(500).send(error);
    }
    var businesses = data.businesses;
    /** the following block dedicated to extracting data not available in the API **/
      //1.use 'async' map to visit each business's url, and so forth
      //2.use 'cheerio' (server-side jquery) to scrape each page and get desired data
      //3.create JSON object with gleaned data
      //4.append JSON object to respective business object
    async.map(businesses, function(business, done){//1.
      var reviews,
      reviewThemes,
      tags,
      moreBusinessInfo;

      request(business.url, function(error, response, html){
          if(!error){
            var $ = cheerio.load(html, {ignoreWhitespace: true});//2.
            reviews =  $('#super-container .feed .review-list').children().text();//returns one page's worth of review text from those deemed by yelp to be most useful
            moreBusinessInfo = $('#super-container .column-beta.sidebar .bordered-rail .ylist').text();
            alchemyAPI.concepts('text', reviews, {'sentiment': 1}, function(response) {
              tags = response;
              alchemyAPI.keywords('text', reviews, {'sentiment': 1}, function(response) {
                reviewThemes = response;
                var customData = {
                  reviews: reviews,
                  reviewThemes: reviewThemes,
                  tags: tags,
                  moreBusinessInfo: moreBusinessInfo
                };//3.
                business.customData = customData;//4.
                return done(null, business);
              });
            });
          }
          else {
            console.log(error);//'request' error
          }
      });
    }, function(err, result){
      if(!error){
        console.log(result);
        res.status(200).json(result);
      }
      else {
        console.log(error);//'async' map error
      }
    });
  });
});


module.exports = router;
