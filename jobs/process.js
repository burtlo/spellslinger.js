import Queue from 'bee-queue';
import redis from 'redis';
import polyfill from 'polyfill';

const processQueue = new Queue('process');
const castQueue = new Queue('cast');

// let client = redis.createClient();
// await client.connect();

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
    livingCardAnimation: false
  }
}

async function findUser(queryObject) {
  return sampleUser;
}

async function getActionForCardName(user,cardName) {
  let foundCommand = user.commandCards.find((commandCard) => { return commandCard.cardName == cardName });
  if (foundCommand) {
    return foundCommand.action;
  } else {
    return 'notACommand'
  }
}

processQueue.on('error', (err) => {
  console.log(`A queue error happened: ${err.message}`);
});

processQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`);
});


processQueue.process(async (job, done) => {
  console.log(`Processing job ${job.id}`);
  // console.log(job.data);

  let user = await findUser({ userName: job.data.userName });
  let cardName = job.data.cardName;

  console.log(`Checking for card actions: ${cardName}`);

  let action = await getActionForCardName(user, cardName);

  console.log(`Processing with command: ${action}`);
  if (action == 'toggleSpellCast') {
    console.log("Toggling SpellCasting");
    user.flags.spellCast = !user.flags.spellCast;
    console.log(user.flags.spellCast);
  } else if (action == 'toggleAnimation') {
    console.log("Toggling Living Animations");
    user.flags.livingCardAnimation = !user.flags.livingCardAnimation;
    console.log(user.flags.livingCardAnimation);
  } else if (action == 'notACommand' && user.flags.spellCast) {
    console.log(`Casting: ${job.data.cardName}`);
    castQueue.createJob(job.data).save();
  }

  return done(null, "Job Performed");

});