var canvas, twoD, bars;

var analyser, frequencyData, audio;

var tunnel, scene, camera, webGHRenderer, 
// Distance travelled in the tunnel by the camera
cameraTravelledStep=1, 
// Camera rotation around its z-axis (moving through the tunnel)
cameraRotationStep=0.0,
spline, cameraTravelIncrement = 0.0002, cameraRotationIncrement = 0.0025;

window.onload = function() {

    audio = document.getElementById('myAudio');
    setupAudioAnalizer(audio);

    canvas = document.getElementById('analyser_render');
    twoD = canvas.getContext('2d');

    setupTunnel();
    $(window).resize(function() {
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
    geom = createTunnelGeometry(30, 512, 30, 80);
    tunnel = createTunnelMesh(geom);
    scene.add(tunnel);

}

createTunnelGeometry = function(nbPoints, segments, radius, radiusSegments) {
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

function randomHexColor() {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
}

var currentTunnelColor = "#ffffff";
createTunnelMesh = function(geom) {
    //White
    var material = new THREE.MeshBasicMaterial({ transparent: false, opacity: 1, side: THREE.DoubleSide, wireframe: true, color: currentTunnelColor });
    //Multicolor test
    //var material = new THREE.MeshNormalMaterial({transparent: false, opacity: 1, side:THREE.DoubleSide, wireframe: true});

    return new THREE.Mesh(geom, material);
}

render = function() {

    analyser.getByteFrequencyData(frequencyData);
    twoD.clearRect(0, 0, canvas.width, canvas.height);
    var maxHeight = 0;
    var bars = frequencyData.length;
    for (var i = 0; i < bars; i++) {
        var bar_x = i * 3;
        var bar_width = 2;
        var bar_height = (frequencyData[i] / 2);
        
        twoD.fillStyle = '#00CCFF';

        if(bar_height > maxHeight){ //detect highest peaks?
            maxHeight = bar_height;
            twoD.fillStyle = '#FFCC00';
        }
        
        twoD.fillRect(bar_x, canvas.height, bar_width, -bar_height);
    }

    tunnel.material.color.setHex( 0x00ffff );
    //console.log(frequencyData);

    if (cameraTravelledStep > 1 - cameraTravelIncrement) {
        cameraTravelledStep = 0.0;
    }

    var pos1 = spline.getPointAt(cameraTravelledStep);
    var pos2 = spline.getPointAt(cameraTravelledStep + cameraTravelIncrement);
    camera.position.set(pos1.x, pos1.y, pos1.z);
    camera.lookAt(pos2);

    camera.rotation.z = -Math.PI / 2 + (Math.sin(cameraRotationStep) * Math.PI);

    cameraTravelledStep += cameraTravelIncrement;
    cameraRotationStep += cameraRotationIncrement;

    requestAnimationFrame(render.bind(this));
    webGLRenderer.render(scene, camera);
}

resize = function() {
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}