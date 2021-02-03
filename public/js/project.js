import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from "./vendor/three/OrbitControls.js";

var camera, scene, renderer;
var line;
var count = 0;
var mouse = new THREE.Vector3();
var mesh3D;
var threeDMat;
var group;
var arrow;

var rayTrace = false;

var attributes = {
    wallColor: "#ff0000",
    segmentHeight: 35
};

var perspectiveCam;
var perspOrbit;

var positions;
var point3ds = [];
var maxPoint = 999999;

var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);	// facing us for mouse intersection
var raycaster = new THREE.Raycaster();

init();
animate();

function init() {

    // render 
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbfafa);

    // perspective camera
    perspectiveCam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    perspectiveCam.position.set(0, 0, 500);
    camera = perspectiveCam;

    // create gride lines
    var grid = new THREE.GridHelper(568, 56, 0xe6e6e6, 0xe6e6e6);
    grid.material.transparent = true;
    grid.rotateX(Math.PI / 2);
    scene.add(grid);


    group = new THREE.Group()

    mesh3D = new THREE.Mesh();


    // material for 3D object
    threeDMat = new THREE.MeshPhongMaterial({ color: 'red', side: THREE.DoubleSide });

    // line geometry and material
    var geometry = new THREE.BufferGeometry();
    var MAX_POINTS = 500;
    positions = new Float32Array(MAX_POINTS * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.LineBasicMaterial({
        color: 0xff0000,
    });

    // line
    line = new THREE.Line(geometry, material);
    line.position.z = 0;
    scene.add(line);

    lighting();
    datGui();
    modal();
    orbitCamera();

    // event listeners for buttons and user intersction
    window.addEventListener('resize', onWindowResize);
    document.addEventListener("mousemove", onMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onCanvasMouseDown, false);
    document.addEventListener('keydown', onDocumentKeyDown, false);

}

// render
function render() {
    renderer.render(scene, camera);
    
}

// animate
function animate() {
    requestAnimationFrame(animate);
    render();
}

// window rezise
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// mouse movement 
function onMouseMove() {
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) / (rect.right - rect.left) * 2 - 1;
    mouse.y = - ((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    mouse = raycaster.ray.intersectPlane(plane, mouse);

    document.getElementById("pixelsX").innerHTML = Math.round(mouse.x);
    document.getElementById("pixelsY").innerHTML = Math.round(mouse.y);
    if (count !== 0 && count < maxPoint) {
        updateLine();
    }
}

// mouse down handler
function onCanvasMouseDown(event) {
    if (count === 0) {
        addPoint();
        if(rayTrace){
            arrow = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, camera.position.z, 0xff0000) 
            group.add(arrow);
            scene.add(group);
        }
    }

    if (count < maxPoint) {
        addPoint(); 
        if(rayTrace){
            arrow = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, camera.position.z, 0xff0000) 
            group.add(arrow);
            scene.add(group);
        }
        
    }
}

// handle lighting 
function lighting() {
    var dirLight = new THREE.DirectionalLight(0xffffff, .8);
    dirLight.position.set(0, -5, 0);
    scene.add(dirLight);
    var ambientLight = new THREE.AmbientLight(0xffffff, .5);
    scene.add(ambientLight);
}

// Add points to canvas 
function addPoint(event) {
    if (count < maxPoint) {
        positions[count * 3 + 0] = mouse.x;
        positions[count * 3 + 1] = mouse.y;
        positions[count * 3 + 2] = mouse.z
        count++;
        line.geometry.setDrawRange(0, count);
        updateLine();
        point3ds.push(new THREE.Vector3(mouse.x, mouse.y, mouse.z));
    }
}

// Let user stop creating points
function onDocumentKeyDown(event) {
    switch (event.keyCode) {
        // shift key
        case 16:
            count = maxPoint;
            break;
    }
}

// Update the line 
function updateLine() {
    positions[count * 3 - 3] = mouse.x;
    positions[count * 3 - 2] = mouse.y;
    positions[count * 3 - 1] = mouse.z;
    line.geometry.attributes.position.needsUpdate = true;
}

// resets count and previous positions 
function add3D() {
    perspOrbit.enabled = false;
    // mesh3D = null;
    for (var i = 0; i < 3 * 8; i++) {
        positions[i] = 0;
    }
    count = 0;
    line.geometry.setDrawRange(0, count);
    point3ds = [];
}

// Transform segments to 3D
function create3D() {
    scene.add(mesh3D);
    var index = 1;
    point3ds.forEach(point3d => {
        if (index < point3ds.length) {
            var seg = new Segment(point3d, point3ds[index], threeDMat, attributes.segmentHeight);
            mesh3D.add(seg.mesh3D);
            index++;
        }
    });
    perspOrbit.enabled = true;
}

// Create orbit camera
function orbitCamera(){
    perspOrbit = new OrbitControls(perspectiveCam, renderer.domElement);
    perspOrbit.screenSpacePanning = true;
    perspOrbit.minPolarAngle = .7;
    perspOrbit.maxPolarAngle = 2.3;
    perspOrbit.minAzimuthAngle = -.8;
    perspOrbit.maxAzimuthAngle = .8;
    perspOrbit.minDistance = 50;
    perspOrbit.maxDistance = 1500;
    perspOrbit.enabled = false;
}

// Segment class 
class Segment {
    constructor(start, end, material, height) {
        this.start = start;
        this.end = end;
        this.height = height;
        this.material = material;
        this.mesh3D = null;
        this.create3D();
    }
    create3D() {
        if (this.start && this.end) {
            var distStartToEnd = this.start.distanceTo(this.end);
            var vec2s = [
                new THREE.Vector2(),
                new THREE.Vector2(0, this.height),
                new THREE.Vector2(distStartToEnd, this.height),
                new THREE.Vector2(distStartToEnd, 0)
            ];
            var shape = new THREE.Shape(vec2s);
            var geo = new THREE.ShapeGeometry(shape);
            geo.applyMatrix4(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(90)));
            this.mesh3D = new THREE.Mesh(geo, this.material);
            this.alignRotation();
            this.alignPosition();

        }
    }
    alignRotation() {
        var p1 = this.start.clone();
        var p2 = this.end.clone();
        var direction = new THREE.Vector3();
        direction.subVectors(p2, p1);
        direction.normalize();

        this.mesh3D.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
    }
    alignPosition() {
        if (this.mesh3D) {
            this.mesh3D.position.copy(this.start);
        } else {
            throw new Error('mesh3D null');
        }
    }
}



// GUI to fit more customization
function datGui() {
    const datGui = new dat.GUI({ autoPlace: true });

    datGui.domElement.id = 'gui'

    let folder = datGui.addFolder(`Customization`);

    folder.addColor(attributes, 'wallColor').name('Color').onChange(function () {
        threeDMat.color.set(attributes.wallColor)
    });

    folder.add(camera.position, 'z', 50, 1500).name('Zoom').onChange(function () { });


    var make3D = {
        Make3D: function () {
            create3D()
        }
    };

    datGui.add(make3D, 'Make3D');

    var addSeg = {
        AddSegments: function () {
            add3D()
        }
    };

    datGui.add(addSeg, 'AddSegments');

    var reset = {
        reset: function () {
            location.reload()
        }
    };

    var rayCast = {
        RayCast: function () {
            rayTrace = true;
            console.log("Ray cast is ON, proceed with adding segments");
            
        }
    };

    
    datGui.add(rayCast, 'RayCast');

    var removeRayCast = {
        RemoveRayCast: function () {
            rayTrace = false;
            console.log("Ray cast is OFF");
            scene.remove(group);

        }
    };

    
    datGui.add(removeRayCast, 'RemoveRayCast');

    

    datGui.add(reset, 'reset');
}

// handles the instructions pop-up
function modal() {
    const openModalButtons = document.querySelectorAll('[data-modal-target]')
    const closeModalButtons = document.querySelectorAll('[data-close-button]')
    const overlay = document.getElementById('overlay')

    openModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.querySelector(button.dataset.modalTarget)
            openModal(modal)
        })
    })

    overlay.addEventListener('click', () => {
        const modals = document.querySelectorAll('.modal.active')
        modals.forEach(modal => {
            closeModal(modal)
        })
    })

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal')
            closeModal(modal)
        })
    })

    function openModal(modal) {
        if (modal == null) return
        modal.classList.add('active')
        overlay.classList.add('active')
    }

    function closeModal(modal) {
        if (modal == null) return
        modal.classList.remove('active')
        overlay.classList.remove('active')
    }
}
