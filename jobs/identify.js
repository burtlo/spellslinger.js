import { Cards } from 'scryfall-api';
import Queue from 'bee-queue';

const identifyQueue = new Queue('identify');
const castQueue = new Queue('cast');

identifyQueue.process(async (job, done) => {
  console.log(`Processing job ${job.id}`);
  console.log(job.data);

  console.log(`Asking Scryfall ${job.data.cardName}`)
  let result = await Cards.byName(job.data.cardName);

  console.log("Scryfall:");

  let animateCard = {};
  animateCard.userName = job.data.userName;
  animateCard.cardName = job.data.cardName;
  animateCard.scryfallObject = result;

  console.log("Casting:");
  castQueue.createJob(animateCard).save();

  return done(null, "Job Performed");

});