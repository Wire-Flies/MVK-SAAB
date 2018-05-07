const minutesToAdjust = 1;
const millisecondsPerMinute = 60000;
//const email = ;
//const password = ;
const email = 'Saab2@blufffmail.com';
const password = 'Saab2123';


// initiate firebase connection
initFireBase();
signInFirebase(email, password);

// -- CESIUM --
// properties
let anomalySize = 5000;
let res = 3;
let maxZoom = 6000000.0;
let anomalies;
let dbRef;
let newAnomalyColor = Cesium.Color.GOLD;
let oldAnomalyColor = Cesium.Color.PINK;

// interval to check if we need to remove anomalies
setInterval(() => {
    let date = new Date();
    for (anomalyId in currentAnomalies) {
        if (currentAnomalies.hasOwnProperty(anomalyId)) {
            let anomaly = currentAnomalies[anomalyId];
            console.log(anomaly);
            if (anomaly.hour === date.getHours() && anomaly.minutes === date.getMinutes()) {
                let entity = viewer.entities.getById(anomaly.flight_id);
                console.log(entity);
                viewer.entities.remove(entity);
            }
        }
    }
}, 30000);

// set up viewer
let viewer = new Cesium.Viewer('cesiumContainer', {
    sceneMode: Cesium.SceneMode.SCENE2D,
    sceneModePicker: false,
    mapProjection: new Cesium.WebMercatorProjection(),
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
});
viewer.resolutionScale = res;
let scene = viewer.scene;

// remove double click feature
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
    Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
);

// center camera and limit zoom
// - todo - maybe look at a new way to limit what the camera sees
let center = Cesium.Cartesian3.fromDegrees(18.0649, 59.33258);
viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, maxZoom));
scene.screenSpaceCameraController.maximumZoomDistance = maxZoom;
scene.screenSpaceCameraController.enableLook = false;

// create ellipse to show where data will be showed
let boundaryEllipse = viewer.entities.add({
    id: 'data-boundary',
    position: center,
    name: 'Data boundary',
    ellipse: {
        semiMinorAxis: 1000000,
        semiMajorAxis: 1000000,
        material: Cesium.Color.RED.withAlpha(0.15),
    },
});

// define the entity color change on-left-click event listener
colorHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
colorHandler.setInputAction((movement) => {
    let clickedObject = scene.pick(movement.position);
    if (Cesium.defined(clickedObject) && (clickedObject.id._id !== 'data-boundary')) {
        let entity = viewer.entities.getById(clickedObject.id._id);
        entity['model']['color'] = oldAnomalyColor;
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

/**
 * Spawns every anomaly in the 'anomalies' object based on their longitude,
 * latitude, altitude and heading.
 * @param {Object} anomalies - Object with every anomaly to spawn as property
 */
function spawnAnomalies(anomalies) {
    console.log('ANOMALIES TO SPAWN:');
    console.log(anomalies);

    // spawn anomalies
    for (let anomalyId in anomalies) {
        if (anomalies.hasOwnProperty(anomalyId)) {
            let anomaly = anomalies[anomalyId];

            // calculate entity properties
            let position = Cesium.Cartesian3.fromDegrees(
                anomaly.longitude,
                anomaly.latitude,
                anomaly.altitude * 0.3048); // convert to meters
            let heading = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(anomaly.heading), 0, 0);
            let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading);

            // fix description text
            let description = '(latitude, longitude): (' + anomaly.latitude + ', ' + anomaly.longitude + ')<br>Altitude: ' + anomaly.altitude +
                ' feet<br>Heading: ' + anomaly.heading + '°<br>Speed: ' + anomaly.speed + ' knots<br>Squawk: ' + anomaly.squawk;

            /* Check if anomaly already exists, if so modify the old one.
            Otherwise create a new one. */
            if (!viewer.entities.getById(anomalyId)) {
                console.log('SPAWNING ENTITY:');
                let entity = viewer.entities.add({
                    id: anomalyId,
                    name: anomaly.flight_id,
                    position: position,
                    orientation: orientation,
                    description: description,
                    model: {
                        uri: '/Apps/SampleData/models/CesiumAir/Cesium_Air.gltf',
                        color: newAnomalyColor,
                        scale: anomalySize,
                    },
                });
            } else {
                console.log('MODIFYING ENTITY:');
                let entity = viewer.entities.getById(anomalyId);
                entity['position'] = position;
                entity['orientation'] = orientation;
                /* -TODO- CHANGE ANOMALY COLOR WHEN REPOSITIONED? */
                entity['model']['color'] = newAnomalyColor;
            }

            console.log(anomaly);
            console.log('ENTITY FINISHED');
        }
    }
}


