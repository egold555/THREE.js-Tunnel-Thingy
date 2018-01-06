'use strict';
/*jslint browser: true*/
/*global  $*/
/*global  THREE*/
/*global window*/
/*global document*/
/*global AudioContext*/
/*global Uint8Array*/
/*global requestAnimationFrame*/
/*jsint node: true */


var canvas, twoD;

var analyser, frequencyData, audio;

var tunnel, scene, camera, webGLRenderer, cameraTravelledStep = 1, // Distance travelled in the tunnel by the camera
    cameraRotationStep = 0.0, // Camera rotation around its z-axis (moving through the tunnel)
    spline, cameraTravelIncrement = 0.0002,
    cameraRotationIncrement = 0.0025;

window.onload = function () {

    audio = document.getElementById('myAudio');
    setupAudioAnalizer(audio);

    canvas = document.getElementById('analyser_render');
    twoD = canvas.getContext('2d');

    setupTunnel();



    $(window).resize(function () {
        resize();
    });

    render(); //Start tunnel movement
}



function setupAudioAnalizer(audio) {
    var ctx = new AudioContext();

    var audioSrc = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();

    // we have to connect the MediaElementSource with the analyser 
    audioSrc.connect(analyser);
    audioSrc.connect(ctx.destination);

    // frequencyBinCount tells you how many values you'll receive from the analyser
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    audio.play();
}

function setupTunnel() {

    // Creating the renderer
    webGLRenderer = new THREE.WebGLRenderer();
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    $("#webgl-tunnel").append(webGLRenderer.domElement);

    // Creating the scene
    scene = new THREE.Scene();
    // Setting up the camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Creating the tunnel and adding it to the scene
    //                         numPoints, segments, radius, radiusSegments
    var geom = createTunnelGeometry(30, 512, 30, 80);





    tunnel = createTunnelMesh(geom);

    scene.add(tunnel);

}

function createTunnelGeometry(nbPoints, segments, radius, radiusSegments) {
    // Creating an array of points that we'll use for the spline creation
    var points = [];
    var previousPoint = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < nbPoints; i++) {
        var randomX = previousPoint.x + 5 + Math.round(Math.random() * 500);
        var randomY = previousPoint.y + 5 + Math.round(Math.random() * 500);
        var randomZ = previousPoint.z + 5 + Math.round(Math.random() * 500);

        previousPoint.x = randomX;
        previousPoint.y = randomY;
        previousPoint.z = randomZ;

        points.push(new THREE.Vector3(randomX, randomY, randomZ));
    }

    // Creating a smooth 3d spline curve from our serie of points
    spline = new THREE.SplineCurve3(points);

    // Generating geometry for the tube using our spline                     //closed
    return new THREE.TubeGeometry(spline, segments, radius, radiusSegments, false);
}

function createTunnelMesh(geom) {
    //White
    var material = new THREE.MeshBasicMaterial({
        transparent: false,
        opacity: 1,
        side: THREE.DoubleSide,
        wireframe: true,
        vertexColors: THREE.FaceColors
    });

    var currentColor;
    for (var i = 0; i < geom.faces.length; i++) {
        if (i % 160 == 0) {
            currentColor = new THREE.Color(Math.random(), Math.random(), Math.random());
        }
        geom.faces[i].color = currentColor;

    }

    geom.colorsNeedUpdate = true;

    return new THREE.Mesh(geom, material);
}

var lastVol = -1;

function render() {

    analyser.getByteFrequencyData(frequencyData);
    twoD.clearRect(0, 0, canvas.width, canvas.height);
    var maxHeight = 0;
    var bars = frequencyData.length;
    for (var i = 0; i < bars; i++) {
        var bar_x = i * 3;
        var bar_width = 2;
        var bar_height = (frequencyData[i] / 2);

        twoD.fillStyle = '#00CCFF';

        /*if (bar_height > maxHeight) { //detect highest peaks?
            maxHeight = bar_height;
            twoD.fillStyle = '#FFCC00';
        }*/

        twoD.fillRect(bar_x, canvas.height, bar_width, -bar_height);
    }


    var sum = frequencyData.reduce((previous, current) => current += previous);
    var avgVolume = sum / frequencyData.length;
    avgVolume = avgVolume * 0.005;
    console.log(avgVolume);

    twoD.font = "30px Arial";
    twoD.fillStyle = '#FFCC00';
    twoD.fillText(avgVolume, 50, 50);


    if (cameraTravelledStep > 1 - cameraTravelIncrement) {
        cameraTravelledStep = 0.0;
    }

    var pos1 = spline.getPointAt(cameraTravelledStep);
    var pos2 = spline.getPointAt(cameraTravelledStep + cameraTravelIncrement);
    camera.position.set(pos1.x, pos1.y, pos1.z);
    camera.lookAt(pos2);

    camera.rotation.z = -Math.PI / 2 + (Math.sin(cameraRotationStep) * Math.PI);

    camera.zoom=avgVolume;
    //camera.fov = avgVolume + 45;
    camera.updateProjectionMatrix();

    cameraTravelledStep += cameraTravelIncrement;
    cameraRotationStep += cameraRotationIncrement;

    requestAnimationFrame(render.bind(this));
    webGLRenderer.render(scene, camera);
}

function resize() {
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
