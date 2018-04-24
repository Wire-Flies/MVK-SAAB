/**
 * Initiates our firebase connection
 */
function initFireBase() {
    firebase.initializeApp({
     apiKey: 'AIzaSyAWdgHMu_1yOOWZEyXJWRV_BibqNWfZQZA',
     authDomain: 'mvk-saab.firebaseapp.com',
     databaseURL: 'https://mvk-saab.firebaseio.com',
     projectId: 'mvk-saab',
     storageBucket: 'mvk-saab.appspot.com',
     messagingSenderId: '451451428506',
   });
}

/**
 * Signs the user into firebase
 * @param {String} email - Email to log in with
 * @param {String} password - Password to try
 */
function signInFirebase(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password).catch((error) => {
        console.log('An error has occured during user authentication\n Error code: ' + error.code + '\n Error Message: ' + error.message);
    })
    .then(() => {
        console.log('User ' + email + ' has been authenticated');
        userId = firebase.auth().currentUser.uid;
        dbRef = firebase.database().ref('users').child(userId + '/anomalies');

        // Right when we succeed with authentication, get all anomalies
        getDataFirebase(userId);

        dbRef.on('child_changed', (snap) => {
            getDataFirebase(userId, snap.ref.key);
            console.log('GETTING INFO:');
            console.log(snap.ref.key);
        });
    });
}

/**
 * Retrieves one or more anomalies from the database and calls the spawn function.
 * If only one anomaly is wanted, enter the anomalyId. If you don't, all anomalies will be fetched.
 * @param {String} userId - User ID used in the firebase db
 * @param {String} anomalyId - If defined, only get the data regarding this anomaly
 */
function getDataFirebase(userId, anomalyId) {
    anomalyId = anomalyId || null;
    console.log('GETTING DATA FROM FIREBASE...');

    // if no anomaly name was given, retrieve all anomalies
    if (anomalyId == null) {
        firebase.database().ref('/users/' + userId).once('value')
        .then((snapshot) => {
            spawnAnomalies(snapshot.val().anomalies);
            console.log('FINISHED');
            console.log(snapshot.val().anomalies);
        });
    } else { // if it was given, retrieve that anomaly
        firebase.database().ref('/users/' + userId + '/anomalies/' + anomalyId).once('value')
        .then((snapshot) => {
            /*
                Didn't managed to get the anomaly object that was modified, but did manage to get
                its attributes. Since we know the key for the anomaly (as well as its attributes),
                we create a new object by combining them and sending it to our spawn function.
            */
            let anomalyObj = {};
            anomalyObj[anomalyId] = {};
            for (let attr in snapshot.val()) {
                if (snapshot.val().hasOwnProperty(attr)) {
                    anomalyObj[anomalyId][attr] = snapshot.val()[attr];
                }
            }
            spawnAnomalies(anomalyObj);
        });
    }
}
