import { Cards } from 'scryfall-api';
import Queue from 'bee-queue';

const identifyQueue = new Queue('identify');
const processQueue = new Queue('process');

identifyQueue.on('error', (err) => {
  console.log(`A queue error happened: ${err.message}`);
});

identifyQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error ${err.message}`);
});

identifyQueue.process(async (job, done) => {
  console.log(`Processing job ${job.id}`);
  console.log(job.data);

  console.log(`Search request for Scryfall: ${job.data.cardName}`)
  let result = await Cards.byName(job.data.cardName);

  let animateCard = {};
  animateCard.userName = job.data.userName;
  animateCard.cardName = job.data.cardName;
  animateCard.scryfallObject = result;

  processQueue.createJob(animateCard).save();
  console.log("Sent identified card object to Process Queue");

  return done(null, "Job Performed");

});