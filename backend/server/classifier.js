'use strict';

const fetch = require('node-fetch');
const URL = 'http://' + process.env.AI_HOST + ':';
const ports = process.env.AI_PORTS.split(',');

module.exports = {
    classify: classify,
};

let last = 0;
/**
 * Classifies a plane with round robbin load balancing between different AI instances
 *
 * @param {Object} plane    Plane object that should be classified
 * @return {Promise}       Promise that resolves to the grade that an airplane is an anomaly
 */
function classify(plane) {
    const port = ports[last];
    last = (last + 1) % ports.length;
    return classifyOnce(URL + port, plane);
}

/**
 * Classifies a plane
 *
 * @param {String} url
 * @param {Object} plane    Plane object that should be classified
 * @return {Promise}       Promise that resolves to the grade that an airplane is an anomaly
 */
function classifyOnce(url, plane) {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    return fetch(url + '/classify', {
        method: 'POST',
        json: true,
        body: JSON.stringify(plane),
        headers: headers,
    }).then((res) => res.json()).then((body) => {
        console.log(plane.flight_id + ' has anomaly value: ' + body.value);
        return new Promise((resolve) => resolve(body.value));
    });

}