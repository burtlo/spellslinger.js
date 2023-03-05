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
});

router.post('/identify', async (req, res, next) => {
  const cardToIdentify = req.body;

  if (cardToIdentify.cardName == 'Minions') {
    res.redirect('/command');
  } else {
    res.redirect('/cast');
  }
});

router.post('/cast', async (req, res, next) => {
  await client.connect();

  console.log(JSON.stringify(req.body));

  let _result = await client.rPush('cast',JSON.stringify(req.body));

  await client.disconnect();

  res.json({ result: _result });
});

router.post('/command', async (req, res, next) => {
  await client.connect();

  console.log(JSON.stringify(req.body));

  let _result = await client.rPush('cast',JSON.stringify(req.body));

  await client.disconnect();

  res.json({ result: _result });
});

router.delete('/cast', async (req, res, next) => {
  await client.connect();
  let _result = await client.lPop('cast');
  console.log(JSON.parse(_result));
  await client.disconnect();

  res.json(JSON.parse(_result));
});

module.exports = router;
