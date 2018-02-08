// firebase stuff
const email = "Saab2@blufffmail.com";
const password = "Saab2123";
var userId, anomalies, dbRef;

// initiate firebase connection
initFireBase();
signInFirebase(email, password);

// cesium stuff
/* example how to spawn an entity (from their tutorial)
var viewer = new Cesium.Viewer('cesiumContainer');
var entity = viewer.entities.add({
    position : Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706),
    model : {
        uri : '/Apps/SampleData/models/CesiumGround/Cesium_Ground.gltf'
    }
});
*/

var viewer = new Cesium.Viewer('cesiumContainer', {
    sceneMode: Cesium.SceneMode.SCENE2D,
    sceneModePicker: false
});
viewer.resolutionScale = 2;
var scene = viewer.scene;
var anomalySize = 5000;

// - todo - fix camera zoom, maybe find a better way to lock camera view?
var center = Cesium.Cartesian3.fromDegrees(18.0649, 59.33258);
viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, 5000000.0));

function spawnAnomalies() {
    // spawn anomalies
    for(var anomaly in anomalies) {
        anomaly = anomalies[anomaly];
        console.log(anomaly);
        var position = Cesium.Cartesian3.fromDegrees(
            anomaly.longitude, 
            anomaly.latitude,
            anomaly.altitude * 0.3048); // convert to meters
        var heading = Cesium.Math.toRadians(anomaly.heading);
        var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading)
    
        // - todo - add rotation! use "orientation" variable and property
        var entity = viewer.entities.add({
            position: position,
            model : {
                uri : '/Apps/SampleData/models/CesiumAir/Cesium_Air.gltf',
                color: Cesium.Color.GOLD,
                scale: anomalySize
            }
        });
        
        console.log("SPAWNED ENTITY");
    }

}

