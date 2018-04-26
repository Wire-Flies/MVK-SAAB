// -- FIREBASE --
const email = 'Saab2@blufffmail.com';
const password = 'Saab2123';
let userId;
let currentAnomalies = {};
let minutesToAdjust = 1;
const millisecondsPerMinute = 60000;

// initiate firebase connection
initFireBase();
signInFirebase(email, password);

// -- CESIUM --
// properties
const anomalySize = 5000;
const res = 1;
const maxZoom = 10000000.0;
let anomalies;
let currentTarget = null;
let waypoints = [];
let dbRef;
const newAnomalyColor = Cesium.Color.GOLD;
const oldAnomalyColor = Cesium.Color.PINK;
let amountOfNewAnomalies = 0;

let animationId = null;
let originalEntity = null;
let currentWaypoint = 0;
let previousWaypoint = 0;
let amountOfWaypoints = 0;

let frame = 0;
let frameCap = 0;

// interval to check if we need to remove anomalies
setInterval(() => {
    let date = new Date();
    for (anomalyId in currentAnomalies) {
        if (currentAnomalies.hasOwnProperty(anomalyId)) {
            let anomaly = currentAnomalies[anomalyId];
            if (anomaly.new === false) {
                if (anomaly.hour === date.getHours() && anomaly.minutes === date.getMinutes()) {
                    // check if the anomaly that is selected is the one being removed
                    if (currentTarget != null) {
                        if (currentTarget.id === anomaly.id) {
                            // remove old waypoints
                            for (let i = 0; i < waypoints.length; i++) {
                                viewer.entities.remove(waypoints[i]);
                            }
                        }
                    }

                    let entity = viewer.entities.getById(anomaly.flight_id);
                    if (originalEntity != null) {
                        if (originalEntity.id != entity.id && animationId != null) {
                            Cesium.cancelAnimationFrame(animationId);
                        }
                    }

                    delete currentAnomalies[anomalyId];
                    viewer.entities.remove(entity);
                    updateCount();
                    viewer.scene.requestRender();
                }
            }
        }
    }
}, 30000);

Cesium.BingMapsApi.defaultKey = null;
// set up viewer
let viewer = new Cesium.Viewer('cesiumContainer', {
    sceneMode: Cesium.SceneMode.SCENE2D,
    sceneModePicker: false,
    mapProjection: new Cesium.WebMercatorProjection(),
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    timeline: false,
    animation: false,
    fullscreenButton: false,
    geocoder: false,
    requestRenderMode: true,
});
viewer.resolutionScale = res;
let scene = viewer.scene;
scene.maximumAliasedLineWidth = 5.0;

// remove double click feature
viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

// center camera and limit zoom
// - todo - maybe look at a new way to limit what the camera sees
let center = Cesium.Cartesian3.fromDegrees(18.0649, 59.33258);
viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, maxZoom));
scene.screenSpaceCameraController.maximumZoomDistance = maxZoom;
scene.screenSpaceCameraController.enableLook = false;

// create ellipse to show where data will be showed
let boundaryRectangle = viewer.entities.add({
    id: 'data-boundary',
    name: 'Data boundary',
    rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(0.1, 51, 35, 68.5),
        height: 0,
        fill: false,
        outline: true,
        outlineColor: Cesium.Color.WHITE,
    },
});

// define the entity color change and waypoints on-left-click event listener
entityHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
entityHandler.setInputAction((movement) => {
    selectAnomaly(movement);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

entityHandler.setInputAction((movement) => {
    viewer.scene.requestRender();
}, Cesium.ScreenSpaceEventType.WHEEL);

/**
 * Called whenever an anomaly should become selected
 * @param {object/int} input - Object or input depending on what triggered this event
 */
function selectAnomaly(input) {
    // remove old waypoints
    for (let i = 0; i < waypoints.length; i++) {
        viewer.entities.remove(waypoints[i]);
    }

    // reset animation
    if (originalEntity != null) {
        originalEntity['model']['color'] = oldAnomalyColor;
    }
    Cesium.cancelAnimationFrame(animationId);
    frame = 0;
    viewer.scene.requestRender();

    let anomaly = null;
    let entity = null;

    // check if we got position of a click or a callsign
    if (typeof input === 'object') {
        let clickedObject = scene.pick(input.position);
        if (Cesium.defined(clickedObject)) {
            if (clickedObject.id._id === 'data-boundary') { // we don't allow the user to select the
                viewer.selectedEntity = null;
                return;
            }

            // get the anomaly entity that was selected
            entity = viewer.entities.getById(clickedObject.id._id);
            anomaly = currentAnomalies[entity.id];
        } else {
            return;
        }
    } else { // incase we're only looking for a callsign
        for (anomalyId in currentAnomalies) { // go through all anomalies to see if the callsign exists
            if (currentAnomalies.hasOwnProperty(anomalyId)) {
                let currentAnomaly = currentAnomalies[anomalyId];

                if (currentAnomaly.flight_id == input) {
                    anomaly = currentAnomaly;
                    entity = viewer.entities.getById(anomaly.flight_id);
                    viewer.selectedEntity = entity;
                }
            }
        }

        // return if we didn't find the callsign
        if (anomaly === null) {
            $('#error').show();
            return;
        } else {
            $('#error').hide();
        }
    }
    // start animation
    animationId = Cesium.requestAnimationFrame(tick);

    // check if the anomaly entity has been selected previously, if not decrease amount of new anomalies
    if (anomaly.new === true) {
        anomaly.new = false;
        amountOfNewAnomalies--;
        updateCount();
        removeNewAnomaly(anomaly.flight_id);

        // add lifespan
        let date = new Date();
        const modifiedDate = new Date(date.valueOf() + (minutesToAdjust * millisecondsPerMinute));
        anomaly.hour = modifiedDate.getHours();
        anomaly.minutes = modifiedDate.getMinutes();
    }

    // set the variables that will keep track of where we are in our animation
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
        let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading);

        waypoints[i] = viewer.entities.add({
            id: i,
            name: anomaly.flight_id,
            position: position,
            orientation: orientation,
            model: {
                uri: '/Apps/SampleData/models/CesiumAir/Cesium_Air.gltf',
                color: oldAnomalyColor.withAlpha(0.5),
                scale: anomalySize,
            },
        });
    }

    entity['model']['color'] = oldAnomalyColor;
}

/**
 * Called every time the cesium clock 'ticks'
 */
function tick() {
    if (frame != frameCap) {
        frame++;
    } else {
        let waypoint = viewer.entities.getById(currentWaypoint);

        previousWaypoint['model']['color'] = oldAnomalyColor.withAlpha(0.5);
        waypoint['model']['color'] = oldAnomalyColor;
        previousWaypoint = waypoint;
        if (currentWaypoint == 0) {
            currentWaypoint = amountOfWaypoints;
        } else {
            currentWaypoint--;
        }

        frame = 0;
        viewer.scene.requestRender();
    }

    animationId = Cesium.requestAnimationFrame(tick);
}

/**
 *  Update the amount of anomalies in our html
 */
function updateCount() {
    $('#anomalies span').text('Amount of new anomalies: ' + amountOfNewAnomalies);
}

/**
 *  Add new list element to our list of new anomalies
 * @param {Object} anomaly - Object of the anomaly we wish to put as a list element
 */
function addNewAnomaly(anomaly) {
    $('#listOfAnomalies ul').append('<li>' + anomaly.flight_id + '</li>');
}

/**
 * Remove the specific id from our list of new anomalies
 * @param {int} id - The id of the element we wish to remove (the text it shows)
 */
function removeNewAnomaly(id) {
    $('#listOfAnomalies ul').find('li:contains(' + id + ')').remove();
}

// Searches for the anomaly after button is pressed
$('#searchButton').click(() => {
    let callsign = $('#searchInput').val();

    selectAnomaly(callsign);
});

// Change lifespan of anomaly entities if lifespan select is changed
$('#lifespan').change(() => {
    minutesToAdjust = $('#lifespan option:selected').val();
});

// Change animation speed if animation speed select is changed
$('#speed').change(() => {
    frameCap = $('#speed').val();
    frame = 0;
});

// Change boundary alpha depending on if user wants to show it or not
$('#boundary').change(() => {
    if ($('#boundary').is(':checked')) {
        boundaryRectangle['rectangle']['outline'] = true;
    } else {
        boundaryRectangle['rectangle']['outline'] = false;
    }

    viewer.scene.requestRender();
});

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
            console.log(anomaly.positions[0][0]);

            // add it to our local object
            currentAnomalies[anomalyId] = anomaly;
            currentAnomalies[anomalyId].new = true;
            amountOfNewAnomalies++;

            // calculate entity properties
            let position = Cesium.Cartesian3.fromDegrees(
                anomaly.positions[0][0].longitude,
                anomaly.positions[0][0].latitude,
                anomaly.positions[0][0].altitude * 0.3048); // convert to meters
            let heading = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(anomaly.positions[0][0].heading + 90), 0, 0);
            let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, heading);

            // fix description text
            let description = '(latitude, longitude): (' + anomaly.positions[0][0].latitude + ', ' + anomaly.positions[0][0].longitude + ')<br>Altitude: ' + anomaly.positions[0][0].altitude +
                ' feet<br>Heading: ' + anomaly.positions[0][0].heading + '°<br>Speed: ' + anomaly.positions[0][0].speed + ' knots<br>Squawk: ' + anomaly.positions[0][0].squawk + '<br>From: ' + anomaly.schd_from + '<br>To: ' + anomaly.schd_to;

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

            updateCount();
            addNewAnomaly(anomaly);
            viewer.scene.requestRender();
            console.log(anomaly);
            console.log('ENTITY FINISHED');
        }
    }
}


