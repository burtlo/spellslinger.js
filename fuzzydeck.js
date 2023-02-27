import fs from 'fs';
import repl from 'repl';
import Fuse from 'fuse.js';
import redis from 'redis';
import { Cards } from 'scryfall-api';

/**
 * The SpellSlinger class provides the interface for managing the cards that
 * are being cast. This implementation uses a Redis backend to manage the
 * messaging between the card entry client and the animation client.
 *
 */
class SpellSlinger {

  /**
   * The Redis client connection instance.
   */
  client;

  /**
   *
   * @param {Object} clientConfiguration contains the Redis connection
   *  information
   */
  constructor(clientConfiguration) {
    this.client = redis.createClient();
    this.client.on('error', err => console.log(this.redisDependencyMessage, err));
    this.client.connect();
  }

  redisDependencyMessage() {
    return `!!! Redis Client Error !!!

Redis is an in-memory data store that this client uses to enqueue the commands
that read by the site that performs the animations.

$ docker run -d -p 6379:6379 --name myredis redis

`
  }

  /**
   * Enqueues a card for the animation client to read it.
   *
   * @param {Object} cardObject the object contains the card name and details
   *  on how it should be animated by the animation client.
   */
  async sendCard(cardObject) {
    console.log(`Sending to Spellslinger:`);
    console.log(cardObject);

    const cardAction = cardObject.action;

    return await this.client.rPush(cardAction, JSON.stringify(cardObject));
  }

  /**
   *
   * @returns the list of cards in the queue of cast cards.
   */
  async getCastCards() {
    return this.client.lRange("cast",0,-1);
  }

  /**
   *
   * @returns removes all the cards in the queue of cast cards.
   */
  async clearCastCards() {
    return this.client.del("cast");
  }

  /**
   * Cleans up and closes the connection.
   */
  close() {
    this.client.close();
  }
}

/**
 *
 * Load the contents of the deck list. The format of the deck list represents
 * each card name on single line.
 *
 * @param {string} deckFilepath the path to the deck list.
 * @returns an array of card names.
 */
function loadDeckLists(deckFilepath) {
  const list = [];

  try {
    const allFileContents = fs.readFileSync(deckFilepath,'utf-8');

    allFileContents.split(/\r?\n/).forEach(line =>  {
      list.push(line);
    });

  } catch(err) {
    console.log(`!!! Load Deck List Error !!!`, err);
  }

  return list;
}

const spellSlinger = new SpellSlinger();
const deckList = loadDeckLists('cardlist.txt');
const fuse = new Fuse(deckList, { })
let lastResultSet = [];

const loadedCommands = [];

const castCommand = {
  /**
   * Perform a cast operation when the input contains "/c" or "/cast"
   * @param {String} input
   * @returns
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (firstInputTerm == '/cast' || firstInputTerm == '/c');
  },
  perform: function(input,callback) {
    const params = this.processInput(input);
    params.cardName = lastResultSet[params.cardIndex];
    delete params.cardIndex;
    spellSlinger.sendCard(params);
    return callback(null, true);
  },
  processInput: function(input) {
    const terms = input.trim().split(" ");

    let displayPosition = this.defaultDisplayPosition;

    if ( terms[3] == 'l' || terms[3] == 'left' ) {
      displayPosition = 'left';
    } else if (terms[3] == 'right' || terms[3] == 'r' ) {
      displayPosition = 'right';
    } else {
      displayPosition = 'center';
    }

    return {
      action: 'cast',
      cardIndex: parseInt(terms[1]) || 0,
      timeToDisplay: parseInt(terms[2]) || this.defaultSecondsToAnimate,
      displayPosition: displayPosition
    }
  },
  defaultSecondsToAnimate: 8,
  defaultDisplayPosition: 'center'
}

const listCommand = {
  /**
   * Perform a list operation when the input contains "/l" or "/list"
   * @param {String} input
   * @returns
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (firstInputTerm == '/list' || firstInputTerm == '/l');
  },
  perform: async function(input,callback) {
    console.log(await spellSlinger.getCastCards());
    return callback(null, true);
  },
  processInput: function(input) {
    return {}
  }
}

const clearCommand = {
  /**
   * Perform a list operation when the input contains "/c" or "/clear"
   * @param {String} input
   * @returns
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (firstInputTerm == '/clear' || firstInputTerm == '/c');
  },
  perform: async function(input,callback) {
    await spellSlinger.clearCastCards();
    console.log('Cast cards cleared.');
    return callback(null, true);
  },
  processInput: function(input) {
    return {}
  }
}

const searchScryfallCommand = {
  /**
   * Perform a search of fuse when the input contains "/s" or "/scry"
   * @param {String} input
   * @returns
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (firstInputTerm == '/scry' || firstInputTerm == '/s');
  },
  perform: async function(input,callback) {
    const searchTerm = this.processInput(input);
    const searchQuery = Cards.search(`name:${searchTerm}`,1);
    const results = await searchQuery.get(16);

    // lastResultSet is global and stores an array of last results
    lastResultSet = results.map((result) => result.name);
    const displayResults = lastResultSet.map((result, index) => [ index, result ]);
    return callback(null, displayResults);
  },
  processInput: function(input) {
    return input.trim().split(" ").slice(1).join(" ");
  }
}

const searchFuseCommand = {
  /**
   * Perform a search of fuse that happens when not given a command.
   * @param {String} input
   * @returns
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (!firstInputTerm.startsWith('/'));
  },
  perform: async function(input,callback) {
    // lastResultSet is global and stores an array of last results
    lastResultSet = fuse.search(input).map(elem => elem.item);
    const displayResults = lastResultSet.map((elem, index) => [ index, elem ]);
    return callback(null, displayResults);
  },
  processInput: function(input) {
    return {}
  }
}

loadedCommands.push(castCommand);
loadedCommands.push(listCommand);
loadedCommands.push(clearCommand);
loadedCommands.push(searchScryfallCommand);
loadedCommands.push(searchFuseCommand);

const search = async (input,context,filename,callback) => {

  let foundCommand = loadedCommands.find(command => command.doesMatch(input));

  if (foundCommand !== undefined) {
    foundCommand.perform(input,callback)
  }
}

repl.start({ prompt: "=> ", eval: search });