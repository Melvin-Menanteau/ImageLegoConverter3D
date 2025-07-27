/* ----------------------------------------------
    IMPORT
---------------------------------------------- */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ImageHandler } from './classes/ImageHandler';
import { LegoRoundTile } from './classes/LegoRoundTile';

/* ----------------------------------------------
    GLOBALS
---------------------------------------------- */
const SKY_COLOR = 0xB1E1FF; // Sky color for the hemisphere light
const GROUND_COLOR = 0xF5FBFF;
const SCENE_BACKGROUND_COLOR = 0xFFFFFF; // Background color of the scene

/* ----------------------------------------------
    CANVAS
---------------------------------------------- */
const canvas = document.querySelector('#threeCanvas');

/* ----------------------------------------------
    SCENE
---------------------------------------------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color().setHex(SCENE_BACKGROUND_COLOR);

/* ----------------------------------------------
    RENDERER
---------------------------------------------- */
const renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
renderer.setSize( window.innerWidth, window.innerHeight );

/* ----------------------------------------------
    CAMERA
---------------------------------------------- */
// Main camera
const mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10_000);
mainCamera.position.set(0, 0, 15);
mainCamera.lookAt(0, 0, 0);

let ACTIVE_CAMERA = mainCamera; // Set the active camera to the main camera
const ACTIVE_CAMERA_POSITION = new THREE.Vector3(0, 0, 15);
const ACTIVE_CAMERA_LOOK_AT = new THREE.Vector3(0, 0, 0);

function resetActiveCameraView() {
    ACTIVE_CAMERA.position.copy(ACTIVE_CAMERA_POSITION);
    ACTIVE_CAMERA.lookAt(ACTIVE_CAMERA_LOOK_AT);
}

document.getElementById('resetCamera').addEventListener('click', resetActiveCameraView);

/* ----------------------------------------------
    LIGHT
---------------------------------------------- */
// Ambient light
const abl_color = 0xFFFFFF;
const abl_intensity = 3;
const ambientLight = new THREE.AmbientLight(abl_color, abl_intensity);
scene.add(ambientLight);

// Hemisphere light
const hml_skyColor = SKY_COLOR;
const hml_groundColor = GROUND_COLOR;
const hml_intensity = 2;
const hemisphereLight = new THREE.HemisphereLight(hml_skyColor, hml_groundColor, hml_intensity);
scene.add(hemisphereLight);

/* ----------------------------------------------
    CONTROLS
---------------------------------------------- */
// Orbit controls for camera movement
let ORBIT_CONTROLS_ENABLED = true;

const orbitControls = new OrbitControls(mainCamera, canvas);
orbitControls.target.set(0, 0, 0);
orbitControls.enableDamping = true; // Enable damping (inertia) for smoother controls
orbitControls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation to prevent flipping

document.getElementById('toggleControls').addEventListener('click', () => {
    ORBIT_CONTROLS_ENABLED = !ORBIT_CONTROLS_ENABLED;
    orbitControls.enabled = ORBIT_CONTROLS_ENABLED;
    document.getElementById('toggleControls').classList.toggle('selected');
});

/* ----------------------------------------------
    ANIMATION
---------------------------------------------- */
function clearScene() {
    scene.remove.apply(scene, scene.children);
}

function animate() {
    renderer.render(scene, ACTIVE_CAMERA);
}

function generateGeometry(tileList) {
    clearScene();

    const geometry = new THREE.CylinderGeometry(PARAMS.TILE_DIAMETER / 2, PARAMS.TILE_DIAMETER / 2, PARAMS.TILE_HEIGHT, 32);
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const pmremTexture = pmremGenerator.fromScene(scene); // Create a PMREM from an empty scene for environment mapping

    tileList.forEach(tile => {
        const legoTile = new LegoRoundTile(tile.diameter, PARAMS.TILE_HEIGHT, tile.color);
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(legoTile.color),
            roughness: 0.5,
            metalness: 0.5,
            envMap: pmremTexture.texture // Use the PMREM texture for environment mapping
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(tile.colIndex * legoTile.diameter, 0, tile.rowIndex * legoTile.diameter);
        scene.add(mesh);
    });

    ACTIVE_CAMERA_POSITION.set(
        imageHandler.nbCols * PARAMS.TILE_DIAMETER / 2,
        (imageHandler.nbCols * PARAMS.TILE_DIAMETER / 2) * 1.6,
        imageHandler.nbRows * PARAMS.TILE_DIAMETER / 2
    );
    ACTIVE_CAMERA_LOOK_AT.set(
        imageHandler.nbCols * PARAMS.TILE_DIAMETER / 2,
        0,
        imageHandler.nbRows * PARAMS.TILE_DIAMETER / 2
    );

    resetActiveCameraView();

    orbitControls.target.set(
        imageHandler.nbCols * PARAMS.TILE_DIAMETER / 2,
        0,
        imageHandler.nbRows * PARAMS.TILE_DIAMETER / 2
    );
}

renderer.setAnimationLoop(animate);

window.addEventListener('keydown', (event) => {
    if (event.key === 'c') { // touche "c" pour changer de caméra
        ACTIVE_CAMERA = (ACTIVE_CAMERA === mainCamera) ? tennisBallCamera : mainCamera;
    }
});

const PARAMS = {
    TILE_DIAMETER: 10,
    TILE_HEIGHT: 3
};

document.getElementById('pixelationLevel').addEventListener('change', (event) => {
    PARAMS.TILE_DIAMETER = parseInt(event.target.value, 10);
    imageHandler.diameter = PARAMS.TILE_DIAMETER;
    imageHandler.pixelate();
    generateGeometry(imageHandler.toTile());
});

const imageHandler = new ImageHandler('/images/1.png', PARAMS.TILE_DIAMETER, 500, 500);

imageHandler.loadImage().then(() => {
    generateGeometry(imageHandler.toTile());
});