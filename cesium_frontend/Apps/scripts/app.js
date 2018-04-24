// -- FIREBASE --
const email = "Saab2@blufffmail.com";
const password = "Saab2123";
let userId;
let currentAnomalies = {};
const minutesToAdjust = 1;
const millisecondsPerMinute = 60000;

// initiate firebase connection
initFireBase();
signInFirebase(email, password);

// -- CESIUM --
// properties
const anomalySize = 5000;
const res = 3;
const maxZoom = 11000000.0;
let anomalies;
let currentTarget;
let waypoints = [];
let dbRef;
const newAnomalyColor = Cesium.Color.GOLD;
const oldAnomalyColor = Cesium.Color.PINK;

let clock = new Cesium.Clock();
let animationId = null;
let originalEntity = null;
let currentWaypoint = 0;
let previousWaypoint = 0;
let amountOfWaypoints = 0;

// interval to check if we need to remove anomalies
setInterval(() => {
    let date = new Date();
    for(anomalyId in currentAnomalies) {
        let anomaly = currentAnomalies[anomalyId]
        console.log(anomaly)
        if(anomaly.hour === date.getHours() && anomaly.minutes === date.getMinutes()) {
            if (currentTarget.id === anomaly.id) {
                // remove old waypoints
                for (let i = 0; i < waypoints.length; i++) {
                    viewer.entities.remove(waypoints[i]);
                }
            }

            var entity = viewer.entities.getById(anomaly.flight_id);
            if(originalEntity != null) {
                if(originalEntity.id != entity.id && animationId != null) {
                    Cesium.cancelAnimationFrame(animationId);
                }
            }

            console.log(entity);
            viewer.entities.remove(entity);
        }
    }
}, 30000)

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
let scene = viewer.scene;

// remove double click feature
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

// center camera and limit zoom
// - todo - maybe look at a new way to limit what the camera sees
let center = Cesium.Cartesian3.fromDegrees(18.0649, 59.33258);
viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, maxZoom));
scene.screenSpaceCameraController.maximumZoomDistance = maxZoom;
scene.screenSpaceCameraController.enableLook = false;

// create ellipse to show where data will be showed
let boundaryEllipse = viewer.entities.add({
    id: "data-boundary",
    name: "Data boundary",
    rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(51, 0.1, 68.5, 35),
        material: Cesium.Color.RED.withAlpha(0.15)
    }
});

// define the entity color change and waypoints on-left-click event listener
entityHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
entityHandler.setInputAction((movement) => {
    // remove old waypoints
    for (let i = 0; i < waypoints.length; i++) {
        viewer.entities.remove(waypoints[i]);
    }

    // reset animation
    if(originalEntity != null) {
        originalEntity['model']['color'] = oldAnomalyColor;
    }
    Cesium.cancelAnimationFrame(animationId);

    let clickedObject = scene.pick(movement.position);
    if(Cesium.defined(clickedObject) && (clickedObject.id._id !== "data-boundary")) {
        // start animation
        animationId = Cesium.requestAnimationFrame(tick);

        let entity = viewer.entities.getById(clickedObject.id._id);
        let anomaly = currentAnomalies[entity.id];
        originalEntity = entity;

        currentTarget = anomaly;
        currentWaypoint = anomaly.positions[0].length - 1;
        previousWaypoint = entity;
        amountOfWaypoints = anomaly.positions[0].length - 1;
        // spawn waypoints for anomaly
        for (let i = 0; i < anomaly.positions[0].length; i++) {

            // calculate anomaly properties
            let position = Cesium.Cartesian3.fromDegrees(
                anomaly.positions[0][i].longitude, 
                anomaly.positions[0][i].latitude,
                anomaly.positions[0][i].altitude * 0.3048); // convert to meters
            let heading = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(anomaly.positions[0][i].heading + 90), 0, 0);
            let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading)

            waypoints[i] = viewer.entities.add({
                id: i,
                name: anomaly.flight_id,
                position: position,
                orientation: orientation,
                model : {
                    uri : '/Apps/SampleData/models/CesiumAir/Cesium_Air.gltf',
                    color: oldAnomalyColor.withAlpha(0.5),
                    scale: anomalySize
                }
            });
        }
        console.log(currentAnomalies[entity.id]);
        entity['model']['color'] = oldAnomalyColor;
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

/**
 * Called every time the cesium clock 'ticks'
 */
function tick() {
    clock.tick();
    animationId = Cesium.requestAnimationFrame(tick);

    let waypoint = viewer.entities.getById(currentWaypoint);

    previousWaypoint['model']['color'] = oldAnomalyColor.withAlpha(0.5);
    waypoint['model']['color'] = oldAnomalyColor;
    previousWaypoint = waypoint;
    if (currentWaypoint == 0) {
        currentWaypoint = amountOfWaypoints;
    } else {
        currentWaypoint--;
    }
}

/**
 * Spawns every anomaly in the 'anomalies' object based on their longitude,
 * latitude, altitude and heading.
 * @param {Object} anomalies - Object with every anomaly to spawn as property
 */
function spawnAnomalies(anomalies) {
    console.log("ANOMALIES TO SPAWN:");
    console.log(anomalies);
    let date = new Date();
    const modifiedDate = new Date(date.valueOf() + (minutesToAdjust * millisecondsPerMinute))

    // spawn anomalies
    for(let anomalyId in anomalies) {
        let anomaly = anomalies[anomalyId];
        console.log(anomaly.positions[0][0])

        // add it to our local object
        currentAnomalies[anomalyId] = anomaly;
        currentAnomalies[anomalyId].hour = modifiedDate.getHours();
        currentAnomalies[anomalyId].minutes = modifiedDate.getMinutes();

        // calculate entity properties
        let position = Cesium.Cartesian3.fromDegrees(
            anomaly.positions[0][0].longitude, 
            anomaly.positions[0][0].latitude,
            anomaly.positions[0][0].altitude * 0.3048); // convert to meters
        let heading = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(anomaly.positions[0][0].heading + 90), 0, 0);
        let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading)

        // fix description text
        let description = "(latitude, longitude): (" + anomaly.positions[0][0].latitude + ", " + anomaly.positions[0][0].longitude + ")<br>Altitude: " + anomaly.positions[0][0].altitude + 
            " feet<br>Heading: " + anomaly.positions[0][0].heading + "°<br>Speed: " + anomaly.positions[0][0].speed + " knots<br>Squawk: " + anomaly.positions[0][0].squawk + "<br>From: " + anomaly.schd_from + "<br>To: " + anomaly.schd_to;

        /* Check if anomaly already exists, if so modify the old one.
         Otherwise create a new one. */
        if(!viewer.entities.getById(anomalyId)) {
            console.log("SPAWNING ENTITY:");
            let entity = viewer.entities.add({
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
            console.log("MODIFYING ENTITY:");
            let entity = viewer.entities.getById(anomalyId);
            entity['position'] = position;
            entity['orientation'] = orientation;
            /* -TODO- CHANGE ANOMALY COLOR WHEN REPOSITIONED? */
            entity['model']['color'] = newAnomalyColor;
        }

        console.log(anomaly);
        console.log("ENTITY FINISHED"); 
    }
}


