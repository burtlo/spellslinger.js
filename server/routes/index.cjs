var express = require('express');
var router = express.Router();
var redis = require('redis');
var client = redis.createClient();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/cast', async (req, res, next) => {
  await client.connect();

  let _result = await client.lRange('cast',0,0);
  let parsedResults = (_result.length == 0 ? {} : JSON.parse(_result));

  await client.disconnect();

  res.json(parsedResults);
})

router.delete('/cast', async (req, res, next) => {
  await client.connect();
  let _result = await client.lPop('cast');
  console.log(JSON.parse(_result));
  await client.disconnect();

  res.json(JSON.parse(_result));
})

module.exports = router;
