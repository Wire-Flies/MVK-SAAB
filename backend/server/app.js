'use strict';
const express = require('express');
const app = express();
const {FirebaseConnector} = require('./firebase.js');

let firebaseConnector = new FirebaseConnector();

init().then(() => {
    console.log('Ready...');
}).catch((err) => {
    console.log('There was an initializing');
    console.log(err);
});

/**
 * Initialize firebaseconnector
 * @return {Promise} Resolved when login is sucessful
 */
function initFirebase() {
    return firebaseConnector.login();
}

/**
 * Starts the express server
 * @return {Promise} Resolved when server has started
 */
function startApp() {
    return new Promise((resolve, reject) => {
        app.listen(3000, '127.0.0.1', () => resolve());
    });
}

/**
 * Initializes the server
 * @return {Promise} Resolved when backend has started
 */
function init() {
    return Promise.all([
        initFirebase(),
        startApp(),
    ]);
}
