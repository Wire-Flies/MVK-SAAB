// -- FIREBASE --
const email = "Saab2@blufffmail.com";
const password = "Saab2123";
var userId;

// initiate firebase connection
initFireBase();
signInFirebase(email, password);

// -- CESIUM --
// properties
var anomalySize = 5000;
var res = 3;
var maxZoom = 8000000.0;
var anomalies, dbRef;
var newAnomalyColor = Cesium.Color.GREEN;
var oldAnomalyColor = Cesium.Color.GOLD;

// set up viewer
var viewer = new Cesium.Viewer('cesiumContainer', {
    sceneMode: Cesium.SceneMode.SCENE2D,
    sceneModePicker: false,
    mapProjection : new Cesium.WebMercatorProjection(),
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
});
viewer.resolutionScale = res;
var scene = viewer.scene;

// remove double click feature
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

// center camera and limit zoom
// - todo - maybe look at a new way to limit what the camera sees
var center = Cesium.Cartesian3.fromDegrees(18.0649, 59.33258);
viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, maxZoom));
scene.screenSpaceCameraController.maximumZoomDistance = maxZoom;
scene.screenSpaceCameraController.enableLook = false;

// create ellipse to show where data will be showed
var boundaryEllipse = viewer.entities.add({
    id: "data-boundary",
    position: center,
    name: "Data boundary",
    ellipse: {
        semiMinorAxis: 1000000,
        semiMajorAxis: 1000000,
        material: Cesium.Color.RED.withAlpha(0.15)
    }
});

// define the entity color change on-left-click event listener
colorHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
colorHandler.setInputAction((movement) => {
    var clickedObject = scene.pick(movement.position);
    if(Cesium.defined(clickedObject) && (clickedObject.id._id !== "data-boundary")) {
        var entity = viewer.entities.getById(clickedObject.id._id);
        entity['model']['color'] = oldAnomalyColor;
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// -EXPERIMENTAL!- define our clock tick event listener
/*viewer.clock.onTick.addEventListener((clock) => {
    console.log(clock.currentTime);
});*/

/**
 * Spawns every anomaly in the 'anomalies' object based on their longitude,
 * latitude, altitude and heading.
 * @param {Object} anomalies - Object with every anomaly to spawn as property
 */
function spawnAnomalies(anomalies) {
    // spawn anomalies
    for(var anomalyId in anomalies) {
        console.log(anomalies);
        console.log("SPAWNING ENTITY:");
        var anomaly = anomalies[anomalyId];
        console.log(anomaly);

        // calculate entity properties
        var position = Cesium.Cartesian3.fromDegrees(
            anomaly.longitude, 
            anomaly.latitude,
            anomaly.altitude * 0.3048); // convert to meters
        var heading = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(anomaly.heading), 0, 0);
        var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading)

        // fix description text
        var description = "(latitude, longitude): (" + anomaly.latitude + ", " + anomaly.longitude + ")<br>Altitude: " + anomaly.altitude + 
            " feet<br>Heading: " + anomaly.heading + "°<br>Speed: " + anomaly.speed + " knots<br>Squawk: " + anomaly.squawk;

        /* Check if anomaly already exists, if so modify the old one.
         Otherwise create a new one. */
        if(!viewer.entities.getById(anomalyId)) {
            var entity = viewer.entities.add({
                id: anomalyId,
                name: anomaly.flight_id,
                position: position,
                orientation: orientation,
                description: description,
                model : {
                    uri : '/Apps/SampleData/models/CesiumAir/Cesium_Air.gltf',
                    color: newAnomalyColor,
                    scale: anomalySize
                }
            });
        } else {
            var entity = viewer.entities.getById(anomalyId);
            entity['position'] = position;
            entity['orientation'] = orientation;
            /* -TODO- CHANGE ANOMALY COLOR WHEN REPOSITIONED?
            entity['model']['color'] = newAnomalyColor;
            */
        }

        console.log("SPAWNED ENTITY"); 
    }
}


