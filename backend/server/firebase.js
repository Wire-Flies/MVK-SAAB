'use strict';
const firebase = require('firebase');

/*
Firebase init credentials
*/
let usr = '';
//Firebase user credentials
const  email = 'Saab2@blufffmail.com';
const  password = 'Saab2123';

class FirebaseConnector{
    constructor(){
        initFirebase();
    }

    login(){
        return firebaseLogin().then((usr) => {
            this.usr = usr;
            return new Promise((full) => full());
        });
    }

    saveData(flightId, snapshots){
        return saveData(this.usr, flightId, snapshots);
    }
}

function initFirebase(){
    firebase.initializeApp({
        apiKey: 'AIzaSyAWdgHMu_1yOOWZEyXJWRV_BibqNWfZQZA',
        authDomain: 'mvk-saab.firebaseapp.com',
        databaseURL: 'https://mvk-saab.firebaseio.com',
        projectId: 'mvk-saab',
        storageBucket: 'mvk-saab.appspot.com',
        messagingSenderId: '451451428506'
    });
}

//TODO: This function must return a promise with the "user id"
function firebaseLogin(){
    return new Promise((resolve, reject) => {
        firebase.auth().signInWithEmailAndPassword(email, password).then(() => {
            const userId = '';
            resolve(userId);
        }).catch((loginErr) => {
            firebase.auth().createUserWithEmailAndPassword(email, password).then(() => {
                const userId = '';
                resolve(userId);
            }).catch((err) => {
                reject(err);
            })
        });
    });
}

function saveData(usr, flightId, snapshots){
    return firebase.database().ref('users/' + usr + '/anomalies').push({
        flight_ID: flightId,
        snapShots: snapshots
    });
}

module.exports = {
    FirebaseConnector: FirebaseConnector
};
