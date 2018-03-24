'use strict';
const express = require('express');
const app = express();
const {FirebaseConnector} = require('./firebase.js');
const {InputHandler} = require('./inputHandler');
const CUTOFF = 0.3;

let firebaseConnector = new FirebaseConnector();
let inputHandler;

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
 * @return {Promise} Resolved when inputhandler has been created
 */
function initInputHandler() {
    inputHandler = new InputHandler(firebaseConnector, CUTOFF);
    return new Promise((full) => full());
}

/**
 * Initializes the server
 * @return {Promise} Resolved when backend has started
 */
function init() {
    return Promise.all([
        initFirebase(),
        initInputHandler(),
        startApp(),
    ]);
}
