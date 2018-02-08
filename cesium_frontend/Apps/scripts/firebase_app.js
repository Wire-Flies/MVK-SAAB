/**
 * Initiates our firebase connection
 */
function initFireBase() {
    firebase.initializeApp({
     apiKey: "AIzaSyAWdgHMu_1yOOWZEyXJWRV_BibqNWfZQZA",
     authDomain: "mvk-saab.firebaseapp.com",
     databaseURL: "https://mvk-saab.firebaseio.com",
     projectId: "mvk-saab",
     storageBucket: "mvk-saab.appspot.com",
     messagingSenderId: "451451428506"
   })
}

/**
 * Signs the user into firebase
 * @param {String} email - Email to log in with
 * @param {String} password - Password to try
 */
function signInFirebase(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password).catch((error) => {
        console.log("An error has occured during user authentication\n Error code: " + error.code + "\n Error Message: " + error.message);
    })
    .then(() => {
        console.log("User " + email + " has been authenticated");
        userId = firebase.auth().currentUser.uid;
        dbRef = firebase.database().ref('users').child(userId);

        //Right when we succeed with authentication, get all anomalies
        getDataFirebase(userId);

        dbRef.on('value', (snap) => {
            getDataFirebase(userId);
            console.log(snap.val());
        });
    })
}

/**
 * Retrieves all anomalies from the database
 * @param {String} userId - User ID used in the firebase db 
 */
function getDataFirebase(userId) {
    firebase.database().ref('/users/' + userId).once('value')
    .then((snapshot) => {
        anomalies = snapshot.val().anomalies;
        spawnAnomalies();
        console.log(anomalies);
    });
}