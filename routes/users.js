var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.put('/:id/toggleAvailability/:availability', function(req, res, next) {
  var id = req.params.id;
  var available = req.params.availability;
  res.json({id: id, available: available});
});

module.exports = router;
