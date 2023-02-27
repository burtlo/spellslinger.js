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

/**
* Image
**/

// Create a texture loader so we can load our image file
var loader = new THREE.TextureLoader();

/**
* Lights
**/

// Add a point light with #fff color, .7 intensity, and 0 distance
var light = new THREE.PointLight( 0xffffff, 1, 0 );
// Specify the light's position
light.position.set(1, 1, 100 );
// Add the light to the scene
scene.add(light)

/**
* Render!
**/

let readyForNextOperation = true;

function displayCardWithName(cardObject,) {

  const cardName = cardObject.cardName;
  const secondsToDisplay = cardObject.timeToDisplay;
  const displayPosition = cardObject.displayPosition;

  Cards.byName(cardName).then(result => {
    console.log(result);

    let imageURI, backsideImageURI;

    if (result.card_faces != undefined) {
      imageURI = result.card_faces[0].image_uris.normal;
      backsideImageURI = result.card_faces[1].image_uris.normal;
    } else {
      imageURI = result.image_uris.normal;
    }

    var material = new THREE.MeshLambertMaterial({ map: loader.load(imageURI) });
    var geometry = new THREE.PlaneGeometry(2,2*1.4);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0,0,0)
    scene.add(mesh);

    const enlargedCoords = { z: 0.25, x: 0 };
    const shrinkCoords = { z: -0.25, x: 0 };

    if (displayPosition == 'left') {
      enlargedCoords.x = -0.05;
      shrinkCoords.x = 0.05;
    } else if (displayPosition == 'right') {
      enlargedCoords.x = 0.05;
      shrinkCoords.x = -0.05;
    }

    const enlargeTween = new TWEEN.Tween({ z: 0, x: 0 })
    .to(enlargedCoords, 1000)
    .onUpdate((coords) => {
      geometry.translate(coords.x,0,coords.z);
    });

    const pauseTween = new TWEEN.Tween({})
    .to({},secondsToDisplay * 1000)
    .onUpdate((coords) => {
      // No action - only waiting
    });

    const shrinkTween = new TWEEN.Tween({ z: 0, x: 0 })
    .to(shrinkCoords, 1000)
    .onUpdate((coords) => {
      geometry.translate(coords.x,0,coords.z);
    })
    .onComplete((object) => {
      scene.remove(mesh);

      fetch("http://localhost:3000/cast",{ method: 'DELETE'})
      .then(response => response.json())
      .then((response) => {
        readyForNextOperation = true;
      })
      .catch((err) => {
        console.log(err);
      });

    });

    enlargeTween.chain(pauseTween);
    pauseTween.chain(shrinkTween);
    enlargeTween.start();

  });
}

const loadNextOperation = () => {
  if (readyForNextOperation) {
    readyForNextOperation = false;
    console.log("Loading Next Operation");

    fetch("http://localhost:3000/cast")
    .then(response => response.json())
    .then((response) => {
      if (response.cardName === undefined) {

        setTimeout(() => {
          readyForNextOperation = true;
        }, 2000);

      } else {
        displayCardWithName(response);
      }
    })
    .catch((err) => {
      console.log(err);
    });
  }
}

// The main animation function that re-renders the scene each animation frame
function animate() {
  requestAnimationFrame( animate );
  // debugger

  // Reach out to the messaging service for the next operation
  loadNextOperation()

  TWEEN.update();
  renderer.render( scene, camera );
}


animate();

