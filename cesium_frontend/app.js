// firebase stuff
const email = "Saab2@blufffmail.com";
const password = "Saab2123";
var userId, anomalies;

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

function spawnAnomalies() {
    // spawn anomalies
}

