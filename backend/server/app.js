'use strict';
const express = require("express");
const app = express();
const {FirebaseConnector} = require('./firebase.js');

let firebaseConnector = new FirebaseConnector();

init().then(() => {
    console.log('Ready...');
}).catch((err) => {
    console.log('There was an initializing');
    console.log(err);
});

function initFirebase(){
    return firebaseConnector.login();
}

function startApp(){
    return new Promise((resolve, reject) => {
        app.listen(3000, '127.0.0.1', () => resolve());
    });
}

function init(){
    return Promise.all([
        initFirebase(),
        startApp()
    ]);
}