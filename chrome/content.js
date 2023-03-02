/* global browser */
console.log("SpellSlinger looking for play table!");

rootDiv = document.getElementById("root")
// let settingsAreNotSet = true;

let playTableObserver = new MutationObserver(mutations => {
  for(let mutation of mutations) {
    // console.log(mutation);

    // if (settingsAreNotSet == true && mutation.nextSibling && mutation.nextSibling.className === "absolute bottom-0 inset-x-0 p-4 flex justify-between items-center") {
    //   let buttons = mutation.nextSibling.querySelectorAll("button");
    //   let settingsButton = buttons[2];
    //   settingsButton.click();
    // }

    for(let addedNode of mutation.addedNodes) {
      // console.log(addedNode);
      if (addedNode.className === "flex w-full h-full") {
        console.log("Found a play table", addedNode);
        setupLastCardObserver(addedNode);
        setupCardHistoryObserver(addedNode);
        playTableObserver.disconnect();
      }
    }
  }
});

playTableObserver.observe(rootDiv, { childList: true, subtree: true });

// let lobbyObserver = new MutationObserver(mutations => {
//   for(let mutation of mutations) {
//     // console.log(mutation);


//     if (settingsAreNotSet == true && mutation.target.className === "ReactModalPortal") {
//       let closeButton = mutation.target.querySelector("button");
//       console.log("Configure Inputs");

//       setTimeout(() => {
//         setCameraInput();
//         settingsAreNotSet = false;
//         setTimeout(() => {
//           closeButton.click();
//           // setTimeout(() => {
//           //   joinGameNow();
//           // },1000);
//         },1000);

//       },2000);
//       // lobbyObserver.disconnect();
//     }
//   }
// });

// lobbyObserver.observe(rootDiv.querySelector("#modal-container"), { childList: true, subtree: true });

// function setCameraInput() {
//   let defaultCameraSource = "OBS Virtual Camera (m-de:vice)";

//   let labels = document.querySelectorAll("label");
//   for (let index=0; index < labels.length; index++) {
//     if (labels[0].innerText == 'Camera source') {
//       let cameraSelect = labels[0].nextSibling.querySelector("select");
//       console.log(cameraSelect);
//       console.log(cameraSelect.value);
//       let cameraOptions = cameraSelect.querySelectorAll("option");

//       for (let camIndex = 0; camIndex < cameraOptions.length; camIndex++) {
//         console.log(cameraOptions[camIndex].innerText);
//         console.log(cameraOptions[camIndex].value);
//         if (cameraOptions[camIndex].innerText == defaultCameraSource) {
//           cameraSelect.selectedIndex = camIndex;
//           cameraSelect.dispatchEvent(new Event("didChange"));
//         }
//       }
//     }
//   }

// }

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
        console.log("Context Menu FOUND");
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
          console.log("Found last card",addedNode);
          var cardImage = addedNode.querySelector('img');
          var cardName = cardImage.alt;
          console.log("Should I cast? " + cardName);


          chrome.storage.local.set({ lastCardPlayed: cardName });

          var contextMenu = addedNode.getElementsByClassName("flex flex-row justify-end px-1 py-1 md:px-3")[0];
          console.log("Context Menu Button found:",contextMenu);
          contextMenu.addEventListener("click", () => {
            console.log("Context menu of " + cardName + " was clicked.");
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
      // console.log(mutation);

      let cardImages = mutation.target.querySelectorAll("img");
      let cardHistory = [];

      for (let imageIndex = 0; imageIndex < cardImages; imageIndex++) {
        cardHistory.unshift(cardImages[imageIndex].alt);
      }

      chrome.storage.local.remove([ "cardHistory" ], () => {
        chrome.storage.local.set({ cardHistory: cardHistory }, () => {
          var contextMenu = addedNode.getElementsByClassName("flex flex-row justify-end px-1 py-1 md:px-3")[0];
          console.log("Context Menu Button found:",contextMenu);
          contextMenu.addEventListener("click", () => {
            console.log("Context menu of " + cardName + " was clicked.");
            chrome.storage.local.set({ lastContextMenuClicked: cardName });
          });
        })
      })
    }
  });

  cardObserver.observe(cardHistorySection, { childList: true, subtree: true });
}

function appendHightlightToContextMenu(contextMenu) {
  if (contextMenu !== undefined) {
    let divider = contextMenu.getElementsByClassName("border-t")[0];
    if (divider !== undefined) {

      let newDivider = divider.cloneNode();
      contextMenu.appendChild(newDivider);

      let menuItem = contextMenu.getElementsByClassName("px-4")[0];
      if (menuItem !== undefined) {

        let newMenuItem = menuItem.cloneNode();

        newMenuItem.appendChild(document.createTextNode("Highlight"));

        chrome.storage.local.get([ "lastContextMenuClicked" ], (results) => {
          let cardName = results.lastContextMenuClicked;
          newMenuItem.addEventListener("click",() => {
            postCardSpotted(cardName);
            removeContextMenu();
          })
        });

        contextMenu.appendChild(newMenuItem)
      }
    }
  }
}
function postCardSpotted(cardName) {
  console.log("postCardSpotted:",cardName);
  chrome.storage.local.set({ highlightCard: cardName });
}

function removeContextMenu() {
  // document.querySelector(".rc-tooltip.z-1000").parentElement.parentElement.remove()
}