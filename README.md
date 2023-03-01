# Spellslinger.js

This repository contains tools to enhance Magic: the Gathering games presented
over SpellTable.

## Requirements

- [OBS](https://obsproject.com) 27.2.1 (Tested)
- OBS [Move Transition](https://obsproject.com/forum/resources/move-transition.913/) 2.8.1 - [Example Setup](https://www.youtube.com/watch?v=mMrYfxo8Lnc)
- [Node](https://nodejs.org/en/) 19.6.1 (Tested)
- [Docker](https://www.docker.com) / [Redis](https://redis.io)

The command-line interface pushes cards to display to [Redis](https://redis.io). The web server reads the cards from Redis. Redis can be run as a Docker container.

## Setup

1. Install OBS
1. Import the OBS scene collection
1. Fix any filepath issues for resources. All resources for OBS should be found in the OBS directory.
1. Install Docker or Redis
1. Run Redis
1. Install Node project dependencies
1. Run the web server
2. Run the CLI

## Redis

This runs Redis in a docker container with the default Redis port.

```shell
$ docker run -d -p 6379:6379 --name myredis redis
```

## Web Server

Install the node dependencies defined in the package.json

```shell
$ npm install
```

Start the server

```shell
$ npm run server
```

Open your browser to `http://localhost:3000/`. The webpage display a white page with no content. The shell that launched the server displays:

```shell

> spellslinger.js@0.0.0 server
> node ./bin/www.cjs

GET / 304 14.957 ms - -
GET /stylesheets/style.css 304 2.497 ms - -
GET /javascripts/animator.js 304 0.801 ms - -
GET /javascripts/animator.js 304 0.620 ms - -
GET /images/magic-card-back.jpg 304 9.000 ms - -
GET /cast 304 19.128 ms - -
GET /cast 304 7.954 ms - -
GET /cast 304 6.654 ms - -
```

The client-side JavaScript pings the webserver every 1000ms and asks for a card object to display. The card objects are added through the command-line interface.

The server-side code is found in `server/app.cjs`.
The server renders the routes defined in `server/routes/index.cjs` which render the `server/views/index.html`.
The client-side code that renders the cards is found in `server/public/javascripts/animator.js`.

## Command-line Interface (CLI)

Install the node dependencies defined in the `package.json`

```shell
$ npm install
```

Run the CLI

```shell
$ npm run cli
```

The CLI code launches a Read Eval Print Loop (REPL). It supports a set of defined commands that can be discovered through the `/help` command.

```shell

> spellslinger.js@0.0.0 cli
> node ./cli/app.js

=>
```

Load a card list with a filepath to the cards. An example file can be found at `cardlist.txt`.

```shell
=> /load cardlist.txt
success
Loaded deck list files.

Loaded file at path cardlist.txt
```

Type in partial names of cards found in that list.

```shell
=> ramp
0 - Rampant Growth
1 - Razaketh, the Foulblooded
=> ramp
0 - Rampant Growth
1 - Swamp
2 - Skullclamp
3 - Vampiric Tutor
4 - Serra Paragon
5 - Gamble
6 - Welcoming Vampire
7 - Snow-Covered Swamp
8 - Vault of Champions
9 - Apocalypse Hydra
10 - Game Trail
11 - Imperial Recruiter
12 - Temple of Abandon
13 - Temple of Epiphany
14 - Temple of Mystery
15 - Razaketh, the Foulblooded
16 - Kambal, Consul of Allocation
```

The search library returns results that closely match the text you entered. The results are stored at these indexes until you search again with the local text search or through Scryfall.

Cast Rampant Growth, the card at the `0` index, to display for the default 8 seconds in the center of the screen.

```shell
=> /cast 0
Sending to Spellslinger:
{
  action: 'cast',
  timeToDisplay: 8,
  displayPosition: 'center',
  cardName: 'Rampant Growth'
}
```

The card object is sent to Redis and stored there until the server's client-side code asks the server for the card. If you have OBS open with the browser layer present set to `http://localhost:3000` or your web browser open to `http://localhost:3000` the card should begin to animate.


Cast `Welcoming Vampire`, the card at the `6` index, to display for 12 seconds in the left side of the screen.

```shell
=> /c 6 12 left
Sending to Spellslinger:
{
  action: 'cast',
  timeToDisplay: 12,
  displayPosition: 'left',
  cardName: 'Welcoming Vampire'
}
```

Search for cards named `mondrak` with Scryfall.

```shell
=> /scry mondrak
0 - Mondrak, Glory Dominus
```

The results from a Scryfall query or another local query replaces the previous list of results.

View all the cards in the Redis queue.

```shell
=> /list
```

This displays all the card objects in the Redis queue. The server's client-side code removes a card object when it finishes animating it. The queue appears empty when no cards objects have been added or server's client-side code has removed them after animation.

Clear the cards in the Redis queue.

```shell
=> /clear
```

The queue may contain cards that you do not want to display or a card in the queue may have caused the server's client-side animation code to fail. This may happen as not all cards have been tested.
