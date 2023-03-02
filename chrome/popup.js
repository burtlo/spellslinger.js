function mainLoaded() {
  console.log("popup opened");

  document.getElementById("clearCast").addEventListener('click', clearCast, false);

  browser.storage.local.get([ "lastCardPlayed", "cardsPlayed" ])
  .then((results) => {
    console.log(results);
    let cardsPlayed = results.cardsPlayed;
    let lastCardPlayed = results.lastCardPlayed;

    console.log(cardsPlayed);
    console.log("ADDING:" + lastCardPlayed);

    if (lastCardPlayed !== undefined) {
      cardsPlayed.push(lastCardPlayed);
    }

    browser.storage.local.remove([ "lastCardPlayed" ]);
    browser.storage.local.set({ cardsPlayed: cardsPlayed })

    for (let index = 0; index < cardsPlayed.length; index++) {
      populateCardToCast(cardsPlayed[index]);
    }
  });


}

function populateCardToCast(lastCardPlayed) {
  console.log("Populating card: " + lastCardPlayed);

  let cardLedger = document.getElementById("cardLedger");

  let cardEntry = document.createElement("li");
  cardEntry.className = "cardEntry";

  let cardName = document.createTextNode(lastCardPlayed);

  let castButton = document.createElement("button");
  castButton.className = "castButton";
  castButton.appendChild( document.createTextNode("cast"));
  castButton.value = lastCardPlayed;
  castButton.addEventListener('click', () => { castCardWithName(lastCardPlayed) }, false)

  cardEntry.appendChild(cardName)
  cardEntry.appendChild(castButton)

  cardLedger.prepend(cardEntry);
}

function castCardWithName(cardName) {
  console.log("Casting " + cardName);

  fetch("http://127.0.0.1:9292/cast", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 'card_name': cardName })
    },
  ).catch((error) => {
    console.log(error);
  })

}


function castCard() {
  let cardName = document.getElementById("cardToCast").value;
  console.log("Casting " + cardName);

  fetch("http://127.0.0.1:9292/cast", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 'card_name': cardName })
    },
  ).catch((error) => {
    console.log(error);
  })

}

function clearCast() {
  console.log("Clearing Casting");

  fetch("http://127.0.0.1:9292/cast", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 'card_name': '' })
    },
  ).catch((error) => {
    console.log(error);
  })

}

document.addEventListener('DOMContentLoaded', mainLoaded, false);