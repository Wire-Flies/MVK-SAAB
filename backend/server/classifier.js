'use strict';

const fetch = require('node-fetch');
const URL = 'http://' + process.env.AI_HOST + ':' + process.env.AI_PORT;

module.exports = {
    classify: classify,
};

/**
 * Classifies a plane
 *
 * @param {Object} plane    Plane object that should be classified
 * @return {Promise}       Promise that resolves to the grade that an airplane is an anomaly
 */
function classify(plane) {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    return fetch(URL + '/classify', {
        method: 'POST',
        json: true,
        body: JSON.stringify(plane),
        headers: headers,
    }).then((res) => res.json()).then((body) => {
        return new Promise((resolve) => resolve(body.value));       
    });
}
