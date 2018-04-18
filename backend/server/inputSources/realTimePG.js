'use strict';

const EventEmitter = require('events');
const pg = require('pg');
const _ = require('lodash');

/**
 *
 */
class RealTimePG extends EventEmitter {
    /**
     * Logs into the database
     *
     * @param {Number}  startTime   Start time in miliseconds
     * @param {Number}  batchTime   Time between batches (in miliseconds)
     * @param {String}  username    Username to connect to postgres
     * @param {String}  password    Password to connect to postgres
     * @param {String}  host        Host postgres is on
     * @param {String}  port        Port postgres listens on
     * @param {String}  db          Database where the tables are located
     */
    constructor(startTime, batchTime, username, password, host, port, db) {
        super();
        this.time = startTime;
        this.batchTime = batchTime;
        const connectionString = 'postgresql://' + username + ':' + password + '@' + host + ':' + port + '/' + db;
        this.pool = new pg.Pool({
            connectionString: connectionString,
        });

        this.intervalId = setTimeout(() => this.nextAircraftBatch(), this.batchTime);
    }

    /**
     * Gets the next batch of aircraft
     */
    nextAircraftBatch() {
        const endTime = this.time;
        const startTime = this.time - this.batchTime;
        console.log('SQL: ' + 'SELECT * FROM flights JOIN flight_data ON flights.flight_id = flight_data.flight_id INNER JOIN airports a ON a.iata_code = flights.schd_from INNER JOIN airports b ON b.iata_code = flights.schd_to WHERE snapshot_id < '+endTime+' AND snapshot_id >= '+startTime+';')
        this.pool.query('SELECT * FROM flights JOIN flight_data ON flights.flight_id = flight_data.flight_id INNER JOIN airports a ON a.iata_code = flights.schd_from INNER JOIN airports b ON b.iata_code = flights.schd_to WHERE snapshot_id < $1 AND snapshot_id >= $2;', [endTime, startTime]).then((flights) => {
            let flightObj = {};
            console.log('Found: ' + flights.rowCount + ' flights');
            _.forEach(flights.rows, (flight) => {
                if (!flightObj[flight.flight_id]) {
                    flightObj[flight.flight_id] = {
                        flight_id: flight.flight_id,
                        aircraft_id: flight.aircraft_id,
                        reg: flight.reg,
                        equip: flight.equip,
                        callsign: flight.callsign,
                        flight: flight.flight,
                        schd_from: flight.schd_from,
                        schd_to: flight.schd_to,
                        real_to: flight.real_to,
                        lat_from: a.latitude_deg,
                        long_from: a.longitude_deg ,
                        lat_to: b.latitude_deg,
                        long_to: b.longitude_deg,
                        positions: [],
                    };
                }

                flightObj[flight.flight_id].positions.push({
                    id: flight.id,
                    snapshot_id: flight.snapshot_id,
                    altitude: flight.altitude,
                    heading: flight.heading,
                    latitude: flight.latitude,
                    longitude: flight.longitude,
                    radar_id: flight.radar_id,
                    speed: flight.speed,
                    squawk: flight.squawk,
                });
            });

            _.forEach(flightObj, (flight) => {
                console.log('Emitting aircraft: ', flight);
                this.emit('aircraft', flight);
            });
        }).catch((err) => console.log(err)); // Errors are ignored
    }
}

module.exports = RealTimePG;
