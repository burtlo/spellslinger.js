import Queue from 'bee-queue';
import redis from 'redis';

const castQueue = new Queue('cast');

castQueue.on('error', (err) => {
  console.log(`A queue error happened: ${err.message}`);
});

castQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`);
});

castQueue.process(async (job, done) => {
  console.log(`Processing Job ${job.id}`);

  let animateCard = job.data;
  const cardObject = job.data.scryfallObject;

  if (cardObject.card_faces != undefined) {
    animateCard.imageURI = cardObject.card_faces[0].image_uris.normal;
    animateCard.backImageURI = cardObject.card_faces[1].image_uris.normal;
    animateCard.doubleFaceCard = true;
  } else {
    animateCard.imageURI = cardObject.image_uris.normal;
    animateCard.doubleFaceCard = false;
  }

  animateCard.timeToDisplay = 8000;
  animateCard.displayPosition = 'right';
  animateCard.timeToEnlarge = 1000;
  animateCard.timeToShrink = 1000;
  animateCard.timeToRotate = 600;
  animateCard.timeToFade = 1000;

  console.log('Card ready to send to animate queue');
  let client = redis.createClient();
  console.log('Client created');
  await client.connect();
  console.log('Pushing to Redis');
  await client.rPush('cast', JSON.stringify(animateCard));
  await client.quit();

  return done(null, "Job Performed");
});

