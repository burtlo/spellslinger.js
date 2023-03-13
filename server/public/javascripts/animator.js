import * as THREE from 'three';
import * as TWEEN from 'tween';
import checkForNextCastOperation from './castAnimator.js';

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
* Lights
**/

var light = new THREE.AmbientLight( 0xffffff, 1.0);
// Specify the light's position
light.position.set(1, 1, 100 );
// Add the light to the scene
scene.add(light);

/**
* Render!
**/

// The main animation function that re-renders the scene each animation frame
function animate() {
  requestAnimationFrame( animate );

  // Reach out to the messaging service for the next operation
  checkForNextCastOperation(scene);

  TWEEN.update();
  renderer.render( scene, camera );
}


animate();

