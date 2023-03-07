import * as THREE from 'three';
import * as TWEEN from 'tween';

const timeBetweenNextCastCheck = 1000;
let readyForNextCommand = true;
let castEndpointUrl = `/cast`;
var loader = new THREE.TextureLoader();
const cardBackMaterial = new THREE.MeshLambertMaterial({map: loader.load('/images/magic-card-back.jpg')});

function castCardWithCardObject(cardObject, scene) {

  const timeToDisplayMs = cardObject.timeToDisplay || 8000;
  const displayPosition = cardObject.displayPosition || 'center';
  const timeToEnlargeMs = cardObject.timeToEnlarge || 1000;
  const timeToShrinkMs = cardObject.timeToShrink || 1000;
  const timeToRotateMs = cardObject.timeToRotate || 600;
  const timeToFadeMs = cardObject.timeToFade || 400;
  let doubleFaceCard = cardObject.doubleFaceCard;

  let frontSideMaterial, backSideMaterial;

  frontSideMaterial = new THREE.MeshLambertMaterial({map: loader.load(cardObject.imageURI)});

  if (cardObject.backImageURI !== undefined) {
    backSideMaterial = new THREE.MeshLambertMaterial({map: loader.load(cardObject.backImageURI)});
  } else {
    backSideMaterial = cardBackMaterial;
  }

  var cardMaterials = [
    cardBackMaterial,
    cardBackMaterial,
    cardBackMaterial,
    cardBackMaterial,
    frontSideMaterial,
    backSideMaterial
  ];

  frontSideMaterial.opacity = 0;

  var cardGeometry = new THREE.BoxGeometry(2,2*1.4,0.000001);
  var cardMesh = new THREE.Mesh(cardGeometry, cardMaterials);
  cardMesh.material.forEach((material) => material.transparent = true);
  scene.add(cardMesh);

  // Tween Easing Reference @see https://sole.github.io/tween.js/examples/03_graphs.html
  // Tween Reference @see http://tweenjs.github.io/tween.js/docs/user_guide.html

  const enlargedCoords = { z: 7.5, x: 0, opacity: 1.0 };
  const shrinkCoords = { z: 0, x: 0 };

  if (displayPosition == 'left') {
    enlargedCoords.x = -1.5;
  } else if (displayPosition == 'right') {
    enlargedCoords.x = 1.5;
  }

  const enlargeTween = new TWEEN.Tween(cardMesh.position)
  .easing(TWEEN.Easing.Quartic.InOut)
  .to(enlargedCoords, timeToEnlargeMs)
  .onStart(() => {
    new TWEEN.Tween(frontSideMaterial).to({ opacity: 1.0 }, timeToFadeMs).start();
  });

  const pauseTween = new TWEEN.Tween({})
  .to({},timeToDisplayMs)
  .onUpdate((coords) => {

    // No action here at the moment in the future this could be where
    // additional animation could enhance the experience.

  });

  const backSidePauseTween = new TWEEN.Tween({})
  .to({},timeToDisplayMs)
  .onUpdate((coords) => {

    // No action here at the moment in the future this could be where
    // additional animation could enhance the experience.

  });

  const rotateTween = new TWEEN.Tween(cardMesh.rotation)
  .onStart(() => {

    new TWEEN.Tween(cardMesh.position).to({ z: 6 },400)
    .onComplete(() => {
      new TWEEN.Tween(cardMesh.position).to({ z: 7.5 },400)
        .start();
    }).start();

  })
  .easing(TWEEN.Easing.Quadratic.In)
  .to({ y: Math.PI }, timeToRotateMs);

  const shrinkTween = new TWEEN.Tween(cardMesh.position)
  .onStart(() => {
    new TWEEN.Tween(frontSideMaterial).delay(600).to({ opacity: 0.0 }, timeToFadeMs).start();
    new TWEEN.Tween(backSideMaterial).delay(600).to({ opacity: 0.0 }, timeToFadeMs).start();
  })
  .to(shrinkCoords, timeToShrinkMs)
  .easing(TWEEN.Easing.Quartic.InOut)
  .onComplete((object) => {
    scene.remove(cardMesh);
    removeCastOperation();
    // readyForNextCommand = true;
  });

  enlargeTween.chain(pauseTween);

  if (doubleFaceCard) {
    pauseTween.chain(rotateTween);
    rotateTween.chain(backSidePauseTween);
    backSidePauseTween.chain(shrinkTween);
  } else {
    pauseTween.chain(shrinkTween);
  }

  enlargeTween.start();
}

const removeCastOperation = () => {
  console.log("Delete the cast operation");
  fetch(castEndpointUrl,{ method: 'DELETE'})
    .then(response => response.json())
    .then((response) => {
      readyForNextCommand = true;
    })
    .catch((err) => {
      console.log(err);
    });
}

const checkForNextCastOperation = (scene) => {
  if (!readyForNextCommand) {
    return;
  }

  console.log("Loading next animation operation.");
  readyForNextCommand = false;

  fetch(castEndpointUrl)
    .then(response => response.json())
    .then((response) => {
      if (response.cardName === undefined) {

        setTimeout(() => {
          readyForNextCommand = true;
        }, timeBetweenNextCastCheck);

      } else {
        castCardWithCardObject(response, scene);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

export default checkForNextCastOperation;