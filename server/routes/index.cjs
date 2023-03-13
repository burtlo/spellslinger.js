var express = require('express');
var router = express.Router();
var redis = require('redis');
var client = redis.createClient();
const Queue = require('bee-queue');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/cast', async (req, res, next) => {
  await client.connect();

  let _result = await client.lRange('cast',0,0);
  if (_result.length != 0) {
    console.log(`Returning item in queue: ${_result}`);
  }
  let parsedResults = (_result.length == 0 ? {} : JSON.parse(_result));

  await client.disconnect();

  res.json(parsedResults);
});

router.post('/identify', async (req, res, next) => {
  const cardToIdentify = req.body;

  const queue = new Queue('identify', { redis: client });
  const job = queue.createJob({ userName: 'bolasUser', cardName: cardToIdentify.cardName});
  job.save();

  res.json({ result: 'success' });
});

router.delete('/cast', async (req, res, next) => {
  await client.connect();
  let _result = await client.lPop('cast');
  console.log(JSON.parse(_result));
  await client.disconnect();

  res.json(JSON.parse(_result));
});

module.exports = router;
