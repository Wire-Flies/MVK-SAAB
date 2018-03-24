'use strict';
const EventEmitter = require('events');

module.exports = FakeInputSource;

/**
 *
 */
class FakeInputSource extends EventEmitter {
    /** */
    constructor() {
        super();
        this.intervalId = setInterval(this.generateAircraft, 1500);
    }

    /**
     * Generates an aircraft and emits an event
     */
    generateAircraft() {
        this.emit('aircraft', {});
    }
}
