'use strict';
const firebase = require('firebase');

/*
    Firebase init credentials
*/
const email = 'Saab2@blufffmail.com';
const password = 'Saab2123';

/**
 * FirebaseConnector class, used for communicating with firebase
*/
class FirebaseConnector {
    /**
     * Constructor, initializes connection with firebase
     */
    constructor() {
        initFirebase();
    }

    /**
     * Logs in
     * @return {Promise} Resolved when logged in
     */
    login() {
        return firebaseLogin().then((usr) => {
            this.usr = usr;
            return new Promise((full) => full());
        });
    }

    /**
     * Save data to flightradar
     * @param {String} flightId     Id of flight
     * @param {Array} snapshots         Data of flight positions
     * @return {Promise}    Resolved when done saving
     */
    saveData(flightId, snapshots) {
        return saveData(this.usr, flightId, snapshots);
    }

    /**
     * Removes all anomalies
     *
     * @return {Promise}
     */
    removeAll() {
        return removeAll(this.usr);
    }
}

/**
 * Initializes firebase
 */
function initFirebase() {
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
 * Logs in to firebase
 * @return {Promise}    Resolves when done logging in
 */
function firebaseLogin() {
    return new Promise((resolve, reject) => {
        firebase.auth().signInWithEmailAndPassword(email, password).then(() => {
            const userId = firebase.auth().getUid();
            resolve(userId);
        }).catch((loginErr) => {
            firebase.auth().createUserWithEmailAndPassword(email, password).then(() => {
                const userId = firebase.auth().getUid();
                resolve(userId);
            }).catch((err) => {
                reject(err);
            });
        });
    });
}

/**
 * Save data
 *
 * @param {String} usr  User it should be saved at
 * @param {String} flightId  Id of flight
 * @param {Array} snapshots Data of flight positions
 * @return {Promise}    Resolved when done saving
 */
function saveData(usr, flightId, snapshots) {
    const position = snapshots.positions[0];
    return firebase.database().ref('users/' + usr + '/anomalies/' + flightId).set({
        flight_id: snapshots.flight_id,
        altitude: position.altitude,
        heading: position.heading,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        squawk: position.squawk,
    });
}

/**
 * @param {String} usr
 * @return {Promise}
 */
function removeAll(usr) {
    return firebase.database().ref('users/' + usr + '/anomalies').remove();
}

module.exports = {
    FirebaseConnector: FirebaseConnector,
};
