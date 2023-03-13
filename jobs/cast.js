import Queue from 'bee-queue';
import redis from 'redis';

let client = redis.createClient();
console.log('Client created');
await client.connect();

const sampleUser = {
  userName: 'bolasUser',
  commandCards: [
    {
      cardName: 'Spellcasting',
      action: 'toggleSpellCast'
    },
    {
      cardName: 'Angels',
      action: 'toggleAnimation'
    }
  ],
  flags: {
    spellCast: false,
    livingCardAnimation: true
  }
}

async function findUser(queryObject) {
  return sampleUser;
}

async function animationForCard(user, cardName) {
  if (cardName == 'Baleful Strix') {
    return {
      animation: 'video',
      src: '/videos/BalefulStrix_NilsHamm.mp4',
      type: 'video/mp4',
      width: 16,
      height: 9
    }
  } else if (cardName == 'Rustwing Falcon') {
    return {
      animation: 'video',
      src: '/videos/RustwingFalcon_PaulScottCanavan.mp4',
      type: 'video/mp4',
      width: 16,
      height: 9
    }
  } else {
    return undefined;
  }

}

const castQueue = new Queue('cast',{ redis: client });

castQueue.on('error', (err) => {
  console.log(`A queue error happened: ${err.message}`);
});

castQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`);
});

castQueue.process(async (job, done) => {
  console.log(`Processing Job ${job.id}`);
  let user = await findUser({ userName: job.data.userName });

  let animateCard = job.data;

  let videoAnimationObject = await animationForCard(user, animateCard.cardName);

  if (videoAnimationObject) {
    console.log(`Adding video animation for ${animateCard.cardName}`);
    await client.rPush('cast', JSON.stringify(videoAnimationObject));
  }


  const cardObject = job.data.scryfallObject;

  animateCard.animation = 'cast';

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

  console.log(`Adding cast animation for ${animateCard.cardName}`);
  await client.rPush('cast', JSON.stringify(animateCard));

  return done(null, "Job Performed");
});

