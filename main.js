/* ----------------------------------------------
    IMPORT
---------------------------------------------- */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
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
const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

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
const orbitControls = new OrbitControls(mainCamera, canvas);
orbitControls.target.set(0, 0, 0);
orbitControls.enableDamping = true; // Enable damping (inertia) for smoother controls

/* ----------------------------------------------
    ANIMATION
---------------------------------------------- */
function clearScene() {
    scene.remove.apply(scene, scene.children);
    // scene.add(axesHelper); // Re-add axes helper to the scene
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

    ACTIVE_CAMERA.position.set(
        imageHandler.nbCols * PARAMS.TILE_DIAMETER / 2,
        (imageHandler.nbCols * PARAMS.TILE_DIAMETER / 2) * 1.4,
        imageHandler.nbRows * PARAMS.TILE_DIAMETER / 2
    );
    ACTIVE_CAMERA.lookAt(
        imageHandler.nbCols * PARAMS.TILE_DIAMETER / 2,
        0,
        imageHandler.nbRows * PARAMS.TILE_DIAMETER / 2
    );
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
    TILE_DIAMETER: 5,
    TILE_HEIGHT: 3
};

const imageHandler = new ImageHandler('/images/1.png', PARAMS.TILE_DIAMETER, 500, 500);

imageHandler.loadImage().then(() => {
    generateGeometry(imageHandler.toTile());
});

/* ----------------------------------------------
    GUI
---------------------------------------------- */
const gui = new GUI();

const configurationFolder = gui.addFolder('Configuration');
configurationFolder.add(PARAMS, 'TILE_DIAMETER', 1, 20, 1).name('Tile Diameter').onFinishChange(() => {
    imageHandler.diameter = PARAMS.TILE_DIAMETER;
    imageHandler.pixelate();
    generateGeometry(imageHandler.toTile());
});