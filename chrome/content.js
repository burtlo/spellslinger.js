/* global browser */
console.log("SpellSlinger looking for play table!");

/**
 * The playTableObserver looks for the elements with the class name associated
 * with the SpellTable table that displays the four players (as opposed to the
 * login page where the input setup is configured).
 */
const playTableClasses = "flex w-full h-full";

let playTableObserver = new MutationObserver(mutations => {
  for(let mutation of mutations) {
    // console.log(mutation);

    for(let addedNode of mutation.addedNodes) {
      if (addedNode.className === playTableClasses) {
        console.log("Found a play table", addedNode);
        setupLastCardObserver(addedNode);
        setupCardHistoryObserver(addedNode);
        playTableObserver.disconnect();
      }
    }
  }
});

rootDiv = document.getElementById("root")
playTableObserver.observe(rootDiv, { childList: true, subtree: true });

function joinGameNow() {
  let buttons = document.getElementsByTagName("button");

  for (let index=0; index < buttons.length; index++) {
    if (buttons[index].innerHTML == "Join Now") {
      buttons[index].click();
    }
  }
}



let contextMenuObserver = new MutationObserver(mutations => {
  for(let mutation of mutations) {
    for(let addedNode of mutation.addedNodes) {
      // console.log("Added Node:",addedNode);
      let contextMenu = addedNode.querySelector(".bg-surface-high.rounded.text-sm.shadow-lg.py-1.w-auto");
      if ( contextMenu !== null) {
        // console.log("Context Menu FOUND");
        appendHightlightToContextMenu(contextMenu);
      }
    }
  }
})

contextMenuObserver.observe(rootDiv.parentNode, { childList: true, subtree: true });

function setupLastCardObserver(playTable) {

  let cardObserver = new MutationObserver(mutations => {
    for (let mutation of mutations) {
      // console.log(mutation);
      for(let addedNode of mutation.addedNodes) {
        console.log(addedNode);
        if (addedNode.className === "w-full flex justify-center") {
          // console.log("Found last card",addedNode);
          var cardImage = addedNode.querySelector('img');
          var cardName = cardImage.alt;

          console.log(`Last card clicked on battlefield: ${cardName}`);

          chrome.storage.local.set({ lastCardPlayed: cardName });

          var contextMenu = addedNode.getElementsByClassName("flex flex-row justify-end px-1 py-1 md:px-3")[0];

          contextMenu.addEventListener("click", () => {
            // console.log("Context menu of " + cardName + " was clicked.");
            chrome.storage.local.set({ lastContextMenuClicked: cardName });
          });
        }
      }
    }
  });

  cardObserver.observe(playTable, { childList: true, subtree: true });
}

function setupCardHistoryObserver(playTable) {

  let cardHistorySection = playTable.getElementsByClassName("py-2 flex flex-col flex-1 w-full")[0]
                            .getElementsByClassName("pr-4")[1];

  let cardObserver = new MutationObserver(mutations => {
    for (let mutation of mutations) {
      // console.log(`Card History Observer: Mutation`);
      // console.log(mutation);

      let cardImages = mutation.target.querySelectorAll("img");
      let cardHistory = [];
      let contextMenus = [];

      // Create a card history from all the images alt text.
      for (let imageIndex = 0; imageIndex < cardImages.length; imageIndex++) {
        cardHistory.unshift(cardImages[imageIndex].alt);
      }

      console.log(`The card history contains ${cardHistory.length} entries`);
      console.log(cardHistory);

      for (imageIndex = 0; imageIndex < cardImages.length; imageIndex++) {
        contextMenus.push({ cardName: cardImages[imageIndex].alt, element: cardImages[imageIndex].nextSibling });
      }

      contextMenus.forEach((contextMenu) => {
        //TODO: The event listener here is added a bunch of times. This creates many click events are fired.
        contextMenu.element.addEventListener("click", () => {
          // console.log("Context menu of " + contextMenu.cardName + " was clicked.");
          chrome.storage.local.set({ lastContextMenuClicked: contextMenu.cardName });
        });
      });

      chrome.storage.local.remove([ "cardHistory" ], () => {
        chrome.storage.local.set({ cardHistory: cardHistory }, () => {
          // no-op
        });
      });
    }
  });

  cardObserver.observe(cardHistorySection, { childList: true, subtree: true });
}

function appendHightlightToContextMenu(contextMenu) {
  if (contextMenu !== undefined) {
    // console.log(contextMenu);

    for (let x = 0; x < contextMenu.children.length; x++) {
      if (contextMenu.children[x].innerText == "Cast to Spellslinger") {
        // console.log("Cast to Spellslinger already exists");
        return;
      }
    }

    // <div class="border-t border-surface-low my-1" style="height: 1px;"></div>
    let newDivider = document.createElement("div");
    newDivider.className = "border-t border-surface-low my-1";
    newDivider.style = "height: 1px;";

    contextMenu.appendChild(newDivider);

    // <div class="px-4 cursor-pointer transition-all ease-in-out duration-200 hover:bg-surface-low hover:text-white py-1 text-xs">View on Gatherer</div>
    let newMenuItem = document.createElement("div");
    newMenuItem.className = "px-4 cursor-pointer transition-all ease-in-out duration-200 hover:bg-surface-low hover:text-white py-1 text-xs";
    newMenuItem.appendChild(document.createTextNode("Cast to Spellslinger"));

    contextMenu.appendChild(newMenuItem);

    chrome.storage.local.get([ "lastContextMenuClicked" ], (results) => {
      let cardName = results.lastContextMenuClicked;
      newMenuItem.addEventListener("click",() => {
        postCardSpotted(cardName);
        removeContextMenu();
      })
    });
  }
}
function postCardSpotted(cardName) {
  console.log("postCardSpotted:",cardName);
  chrome.storage.local.set({ highlightCard: cardName });
}

function removeContextMenu() {
  // document.querySelector(".rc-tooltip.z-1000").parentElement.parentElement.remove()
}