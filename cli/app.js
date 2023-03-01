import fs from 'fs';
import repl from 'repl';
import Fuse from 'fuse.js';
import redis from 'redis';
import { Cards } from 'scryfall-api';
import colors from 'colors';

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
    this.client.on('error', err => {
      this.client.disconnect();
      // console.log(this.redisDependencyMessage(), err);
    });
    this.client.connect();
  }

  redisDependencyMessage() {
    return `
!!! Redis Client Error !!!

Redis is an in-memory data store that this client uses to enqueue the commands
that the OBS layer reads to performs the animations.

$ docker run -d -p 6379:6379 --name myredis redis\n\n`
  }

  #ensureConnection() {
    if (!this.client.isReady) {
      this.client.connect();
      return this.client.isReady;
    } else {
      return this.client.isReady
    }
  }

  async #performWithCheckedConnection(operation) {
    if (this.#ensureConnection()) {
      return operation();
    } else {
      return { status: 'error', message: this.redisDependencyMessage() }
    }
  }

  /**
   * Enqueues a card for the animation client to read it. The cardAction
   * determines the key name where the object is pushed.
   *
   * @param {Object} cardObject the object contains the card name and details
   *  on how it should be animated by the animation client.
   */
  async sendCard(cardObject) {
    const cardAction = cardObject.action;
    return this.#performWithCheckedConnection(() => this.client.rPush(cardAction, JSON.stringify(cardObject)));
  }

  /**
   *
   * @returns the list of cards in the queue of cast cards.
   */
  async getCastCards() {
    return this.#performWithCheckedConnection(() => this.client.lRange("cast",0,-1));
  }

  /**
   *
   * @returns removes all the cards in the queue of cast cards.
   */
  async clearCastCards() {
    return this.#performWithCheckedConnection(() => this.client.del("cast"));
  }

  /**
   * Cleans up and closes the connection.
   */
  close() {
    this.client.close();
  }
}

global.spellSlinger = new SpellSlinger();
global.cardList = [];
global.fuse = new Fuse(global.cardList, { })
global.lastResultSet = [];
global.loadedCommands = [];

const castCommand = {
  description: `  /cast, /c INDEX_IN_RESULTS SECONDS_TO_DISPLAY (left|right|center)\n\tCast a spell found in the last Fuse/Scryfall results.\n`,
  /**
   * Perform a cast operation when the input contains "/c" or "/cast"
   * @param {String} input
   * @returns
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (firstInputTerm == '/cast' || firstInputTerm == '/c');
  },
  perform: async function(input,callback) {
    const params = this.processInput(input);
    params.cardName = global.lastResultSet[params.cardIndex];
    delete params.cardIndex;
    console.log(`Sending to Spellslinger:`);
    console.log(params);
    let result = await spellSlinger.sendCard(params);
    return callback(null, result);
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
  description: `  /list\n\tList the card objects that are waiting to be cast.\n`,
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
    let result = await spellSlinger.getCastCards();
    return callback(null, result);
  },
  processInput: function(input) {
    return {}
  }
}

const clearCommand = {
  description: `  /c, /clear\n\tClear the card objects that have been sent to be cast.\n`,
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
    let result = await spellSlinger.clearCastCards();
    return callback(null, result);
  },
  processInput: function(input) {
    return {}
  }
}

const searchScryfallCommand = {
  description: `  /scry, /s SEARCHTERM\n\tQuery Scryfall with the given search term.\n`,
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
    const searchQuery = Cards.search(`${searchTerm}`,1);
    const results = await searchQuery.get(16);
    global.lastResultSet = results.map((result) => result.name);
    const displayResults = global.lastResultSet.map((elem, index) => `${index} - ${elem}`).join("\n");
    return callback(null, displayResults);
  },
  processInput: function(input) {
    return input.trim().split(" ").slice(1).join(" ");
  }
}

const loadCardListCommand = {
  description: `  /load FILENAME1 FILENAME2\n\tLoad card list for all the file paths\n`,
  /**
   * Load a decklist file into the global cardList object
   * @param {String} input the command `/load` followed by the filepath
   * @returns
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (firstInputTerm == '/load');
  },
  perform: function(input,callback) {
    const filePaths = this.processInput(input);

    const list = [];

    let errorFound = false;
    let errorMessage = `Unable to load the deck list files\n`;
    let successMessage = `Loaded deck list files.\n`

    filePaths.forEach((filepath) => {
      try {
        let allFileContents = fs.readFileSync(filepath,'utf-8');
        allFileContents.split(/\r?\n/).forEach(line =>  {
          list.push(line);
        });

        successMessage = `${successMessage}\nLoaded file at path ${filepath}`;
      } catch(err) {
        errorFound = true;
        errorMessage = `${errorMessage}\nUnable to load file at path ${filepath}.\n\n${err.message}`;
      }
    });

    global.cardList = [ ...new Set(global.cardList.concat(list)) ];
    global.fuse = new Fuse(global.cardList, { })

    if (errorFound) {
      return callback(null, { status: 'error', message: errorMessage });
    } else {
      return callback(null, { status: 'success', message: successMessage });
    }
  },
  /**
   *
   * @param {String} input /load or /l followed by the filepaths to load.
   * @returns the filepaths in an Array.
   */
  processInput: function(input) {
    return input.trim().split(" ").slice(1);
  }
}

const searchFuseCommand = {
  description: `  ANY INPUT\n\tSearch the locally loaded card (/load FILENAME) list with any non-command text provided.\n`,
  /**
   * Perform a search of fuse that happens when not given a command with a forward-slash
   * @param {String} input
   * @returns
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (!firstInputTerm.startsWith('/'));
  },
  perform: async function(input,callback) {
    global.lastResultSet = fuse.search(input).map(elem => elem.item);
    const displayResults = global.lastResultSet.map((elem, index) => `${index} - ${elem}`).join("\n");
    return callback(null, displayResults);
  },
  processInput: function(input) {
    return {}
  }
}

const helpCommand = {
  description: `  /?, /h, /help\n\tDisplays all the command descriptions.\n`,
  /**
   * Perform the help command to show all commands
   * @param {String} input /? or /h or /help
   * @returns true if matches, false if it does not match
   */
  doesMatch: function(input)  {
    const firstInputTerm = input.trim().split(" ")[0];
    return (firstInputTerm == '/?' || firstInputTerm == '/h' || firstInputTerm == '/help');
  },
  perform: function(input,callback) {
    const commandDescriptions = loadedCommands.map((command) => command.description);
    return callback(null,`Help\n\n${commandDescriptions.join('\n') }\n`);
  },
  processInput: function(input) {
    return {}
  }
}

loadedCommands.push(castCommand);
loadedCommands.push(listCommand);
loadedCommands.push(clearCommand);
loadedCommands.push(searchScryfallCommand);
loadedCommands.push(loadCardListCommand);
loadedCommands.push(searchFuseCommand);
loadedCommands.push(helpCommand);

const commandLoop = async (input,context,filename,callback) => {
  let foundCommand = loadedCommands.find(command => command.doesMatch(input));

  if (foundCommand !== undefined) {
    foundCommand.perform(input,callback)
  }
}

function modifyOutput(output) {
  if (output.status && output.message) {
    return `${output.status == 'error' ? output.status.red : output.status.green}\n${output.message}`
  } else {
    return output;
  }
}

repl.start({ prompt: "=> ", eval: commandLoop, writer: modifyOutput });