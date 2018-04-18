'use strict';

const classifier = require('./classifier');

/**
 * Class for handling input
 */
class InputHandler {
    /**
     * @param {Object} firebaseConnector    Object that can push data to firebase
     * @param {Number} cutoff               Cutoff for determining when an aircraft is an anomaly
     */
    constructor(firebaseConnector, cutoff) {
        this.firebase = firebaseConnector;
        this.cutoff = cutoff;
    }

    /**
     * Add an additional input source
     * @param {Object} source Object emitting an aircraft event
     */
    addInputSource(source) {
        source.on('aircraft', (flightId, aircraft) => handleAircraft(flightId, this.cutoff, aircraft, this.firebase));
    }
}

/**
 * @param {String} flightId Id of flight
 * @param {Number} cutoff   Cutoff when it is an anomaly
 * @param {Object} aircraft Aircraft to be classified
 * @param {Object} firebase Object that can push data to firebase
 */
function handleAircraft(flightId, cutoff, aircraft, firebase) {
    classifier.classify(aircraft).then((value) => {
        if (value > cutoff) {
            console.log(flightId + ' is being saved to firebase as an anomaly');
            return firebase.saveData(flightId, aircraft);
        }

        return new Promise((full) => full());
    }).then(() => {}).catch((err) => console.log(err));
}

module.exports = {
    InputHandler: InputHandler,
};
