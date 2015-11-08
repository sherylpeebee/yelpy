var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.put('/:id/toggleAvailability', function(req, res, next) {
  var id = req.params.id;
  var available = req.body.availability;
});

module.exports = router;
