console.log("SpellSlinger network watcher loaded")

function postCardSpotted(cardName) {
  console.log(`postCardSpotted - casting: ${cardName}`);
  fetch("http://127.0.0.1:3000/identify", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 'cardName': cardName })
    },
  ).catch((error) => {
    console.log(error);
  })

}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes && changes.highlightCard) {
    console.log("chrome.storage.onChanged - postCardSpotted");
    postCardSpotted(changes.highlightCard.newValue);
  }
})

// Whenever SpellTable makes a web request to Scryfall we want to send that
// card name to Spellslinger as well. This means that any card clicked on
// the battlefield triggers a cast in SpellSlinger.
//
// TODO this functionality should only take action if this is configured on.
//
chrome.webRequest.onBeforeRequest.addListener( (details) => {

  var postedString = decodeURIComponent(String.fromCharCode.apply(null,
    new Uint8Array(details.requestBody.raw[0].bytes)));

  try {
    cardObject = JSON.parse(postedString);
    //console.log(cardObject);

    if ( cardObject.hasOwnProperty("name") && cardObject.name == "cardSpotted" ) {
      let cardName = cardObject.data.name;
      console.log(cardName);
      postCardSpotted(cardName);
    }

  } catch (error) {
    console.log(error);
  }

},
{
  urls: [
    'https://spelltable.api.bi.wizards.com/*'
  ],
},
["requestBody"])


