import * as THREE from 'three';
import * as TWEEN from 'tween';
import { Cards } from 'scryfall-api';

// Create the scene and a camera to view it
var scene = new THREE.Scene();
scene.background = null;

/**
* Camera
**/

// Specify the portion of the scene visible at any time (in degrees)
var fieldOfView = 75;

// Specify the camera's aspect ratio
var aspectRatio = window.innerWidth / window.innerHeight;

// Specify the near and far clipping planes. Only objects
// between those planes will be rendered in the scene
// (these values help control the number of items rendered
// at any given time)
var nearPlane = 0.1;
var farPlane = 1000;

// Use the values specified above to create a camera
var camera = new THREE.PerspectiveCamera(
  fieldOfView, aspectRatio, nearPlane, farPlane
);

// Finally, set the camera's position in the z-dimension
camera.position.z = 10;

/**
* Renderer
**/

// Create the canvas with a renderer
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setClearColor( 0xffffff, 0.0);
renderer.setClearAlpha(0.0);

// Specify the size of the canvas
renderer.setSize( window.innerWidth, window.innerHeight );

// Add the canvas to the DOM
document.body.appendChild( renderer.domElement );

// Create a texture loader so we can load our image file
var loader = new THREE.TextureLoader();

/**
* Lights
**/

var light = new THREE.AmbientLight( 0xffffff, 1.0);
// Specify the light's position
light.position.set(1, 1, 100 );
// Add the light to the scene
scene.add(light);

const cardBackMaterial = new THREE.MeshLambertMaterial({map: loader.load('/images/magic-card-back.jpg')});

/**
* Render!
**/

function castCardWithCardObject(cardObject) {

  const cardName = cardObject.cardName;
  const timeToDisplayMs = cardObject.timeToDisplay * 1000 || 8000;
  const displayPosition = cardObject.displayPosition;
  const timeToEnlargeMs = cardObject.timeToEnlarge || 1000;
  const timeToShrinkMs = cardObject.timeToShrink || 1000;
  const timeToRotateMs = cardObject.timeToRotate || 400;
  const timeToFadeMs = cardObject.timeToFade || 1000;
  let doubleFaceCard = false;

  // TODO:
  // This operation of requesting content from Scryfall would be better suited
  // as a server side operation. The server would request the image URIs and
  // then insert those values into the cardObject that is sent to this animator.
  console.log("Asking Scryfall for the card image by name");

  Cards.byName(cardName).then(result => {
    console.log(result);

    let frontSideMaterial, backSideMaterial;

    if (result.card_faces != undefined) {

      let imageURI = result.card_faces[0].image_uris.normal;
      frontSideMaterial = new THREE.MeshLambertMaterial({map: loader.load(imageURI)});
      let backImageURI = result.card_faces[1].image_uris.normal;
      backSideMaterial = new THREE.MeshLambertMaterial({map: loader.load(backImageURI)});

      doubleFaceCard = true;

    } else {
      let imageURI = result.image_uris.normal;
      frontSideMaterial = new THREE.MeshLambertMaterial({map: loader.load(imageURI)});
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

    var cardGeometry = new THREE.BoxGeometry(2,2*1.4,0.000001);
    var cardMesh = new THREE.Mesh(cardGeometry, cardMaterials);
    cardMesh.material.forEach((material) => material.transparent = true);
    scene.add(cardMesh);

    // Tween Easing Reference @see https://sole.github.io/tween.js/examples/03_graphs.html
    const enlargedCoords = { z: 0.25 * (1000 / timeToEnlargeMs), x: 0, opacity: 1.0 };
    const shrinkCoords = { z: -0.25 * (1000 / timeToShrinkMs), x: 0 };

    if (displayPosition == 'left') {
      enlargedCoords.x = -0.05;
      shrinkCoords.x = 0.05;
    } else if (displayPosition == 'right') {
      enlargedCoords.x = 0.05;
      shrinkCoords.x = -0.05;
    }

    const enlargeTween = new TWEEN.Tween({ z: 0, x: 0, opacity: 0.0 })
    .easing(TWEEN.Easing.Quartic.InOut)
    .to(enlargedCoords, timeToEnlargeMs)
    .onUpdate((coords) => {
      cardMesh.position.x = cardMesh.position.x + coords.x;
      cardMesh.position.z = cardMesh.position.z + coords.z;
      backSideMaterial.opacity = coords.opacity;
      frontSideMaterial.opacity = coords.opacity;
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

    const rotateTween = new TWEEN.Tween({ y: 0 })
    .easing(TWEEN.Easing.Quartic.InOut)
    .to({ y: 0.240 },timeToRotateMs)
    .onUpdate((coords) => {
      cardMesh.rotation.y = cardMesh.rotation.y + coords.y;
    });

    const shrinkTween = new TWEEN.Tween({ z: 0, x: 0, opacity: 1.0 })
    .to(shrinkCoords, timeToShrinkMs)
    .easing(TWEEN.Easing.Quartic.InOut)
    .onUpdate((coords) => {
      cardMesh.position.x = cardMesh.position.x + coords.x;
      cardMesh.position.z = cardMesh.position.z + coords.z;
    });

    const fadeTween = new TWEEN.Tween({ opacity: 1.0 })
    .to({ opacity: 0.0 }, timeToFadeMs)
    .onUpdate((values) => {
      backSideMaterial.opacity = values.opacity;
      frontSideMaterial.opacity = values.opacity;
    })
    .onComplete((object) => {
      scene.remove(cardMesh);
      removeCastOperation();
    });

    enlargeTween.chain(pauseTween);

    if (doubleFaceCard) {
      pauseTween.chain(rotateTween);
      rotateTween.chain(backSidePauseTween);
      backSidePauseTween.chain(shrinkTween);
    } else {
      pauseTween.chain(shrinkTween);
    }

    shrinkTween.chain(fadeTween);
    enlargeTween.start();

  });
}

const timeBetweenNextCastCheck = 1000;
let readyForNextCast = true;
let castEndpointURL = `/cast`;

const checkForNextCastOperation = () => {
  if (!readyForNextCast) {
    return;
  }

  console.log("Loading next animation operation.");
  readyForNextCast = false;

  fetch(castEndpointURL)
    .then(response => response.json())
    .then((response) => {
      if (response.cardName === undefined) {

        setTimeout(() => {
          readyForNextCast = true;
        }, timeBetweenNextCastCheck);

      } else {
        castCardWithCardObject(response);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

const removeCastOperation = () => {
  console.log("Delete the cast operation");
  fetch(castEndpointURL,{ method: 'DELETE'})
    .then(response => response.json())
    .then((response) => {
      readyForNextCast = true;
    })
    .catch((err) => {
      console.log(err);
    });
}


// The main animation function that re-renders the scene each animation frame
function animate() {
  requestAnimationFrame( animate );

  // Reach out to the messaging service for the next operation
  checkForNextCastOperation()

  TWEEN.update();
  renderer.render( scene, camera );
}


animate();

