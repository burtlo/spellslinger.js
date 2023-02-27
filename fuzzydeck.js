const Fuse = require('fuse.js');
const fs = require('fs');
var redis = require('redis');
var client = redis.createClient();
client.connect();

function loadDeckLists() {
  const allFileContents = fs.readFileSync('cardlist.txt','utf-8');

  let list = [];
  allFileContents.split(/\r?\n/).forEach(line =>  {
    list.push(line)
  });

  return list;
}

const deckList = loadDeckLists()
const fuse = new Fuse(deckList, { })

let lastResultSet = [];

const sendToSpellslinger = async (cardObject) => {
  const cardAction = cardObject.action || 'cast';
  console.log(`Sending to Spellslinger:`);
  console.log(cardObject);

  return await client.rPush(cardAction,JSON.stringify(cardObject));
}

const search = async (input,context,filename,callback) => {

  if (input.startsWith("/")) {
    const inputTerms = input.trim().split(" ");
    const commandInput = inputTerms[0];
    const commandArgs = inputTerms.slice(1);
    console.log(`Processing: (${commandInput})`)

    if (commandInput == "/cast" || commandInput == "/c") {
      console.log(`Casting the spell with arguments: ${commandArgs}`);
      const cardIndex = parseInt(commandArgs[0]) || 0;
      const timeToDisplay = parseInt(commandArgs[1]) || 8;

      let displayPosition = 'center';

      if ( commandArgs[2] == 'l' || commandArgs[2] == 'left' ) {
        displayPosition = 'left';
      } else if (commandArgs[2] == 'right' || commandArgs[2] == 'r' ) {
        displayPosition = 'right';
      } else {
        displayPosition = 'center';
      }

      const cardName = lastResultSet[cardIndex].item;
      sendToSpellslinger({ action: 'cast', cardName: cardName, timeToDisplay: timeToDisplay, displayPosition: displayPosition });
      callback(null, true);
    }

    if (commandInput == "/list" || commandInput == "/l") {
      console.log("Listing all the cast actions");
      callback(null, await client.get("cast"));
    }

    if (commandInput == "/clear") {
      console.log("Clearing the cast action queue");
      callback(null, await client.del("cast"));
    }

  } else {
    lastResultSet = fuse.search(input);

    const displayResults = lastResultSet.map((elem, index) => [index, elem.item])

    callback(null, displayResults);
  }
}

const repl = require("repl");
repl.start({ prompt: "=> ", eval: search });