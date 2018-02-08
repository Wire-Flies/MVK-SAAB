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
var res = 2;
var maxZoom = 5000000.0;
var anomalies, dbRef;

// set up viewer
var viewer = new Cesium.Viewer('cesiumContainer', {
    sceneMode: Cesium.SceneMode.SCENE2D,
    sceneModePicker: false,
    mapProjection : new Cesium.WebMercatorProjection()
});
viewer.resolutionScale = res;
var scene = viewer.scene;

// center camera and limit zoom
// - todo - maybe look at a new way to limit what the camera sees
var center = Cesium.Cartesian3.fromDegrees(18.0649, 59.33258);
viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, maxZoom));
scene.screenSpaceCameraController.maximumZoomDistance = maxZoom;

/**
 * Spawns every anomaly in the 'anomalies' object based on their longitude,
 * latitude, altitude and heading.
 * @param {Object} anomalies - Object with every anomaly to spawn as property
 */
function spawnAnomalies(anomalies) {
    // spawn anomalies
    for(var anomalyId in anomalies) {
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

        /* Check if anomaly already exists, if so modify the old one.
         Otherwise create a new one. */
        if(!viewer.entities.getById(anomalyId)) {
            var entity = viewer.entities.add({
                id: anomalyId,
                position: position,
                orientation: orientation,
                description: 'blablobla xD',
                model : {
                    uri : '/Apps/SampleData/models/CesiumAir/Cesium_Air.gltf',
                    color: Cesium.Color.GOLD,
                    scale: anomalySize
                }
            });
        } else {
            var entity = viewer.entities.getById(anomalyId);
            entity['position'] = position;
            entity['orientation'] = orientation;
        }

        console.log("SPAWNED ENTITY"); 
    }
}


