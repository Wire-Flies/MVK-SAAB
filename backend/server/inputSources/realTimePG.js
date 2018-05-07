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

        setTimeout(() => this.nextAircraftBatch(), 2000);
    }

    /**
     * Gets the next batch of aircraft
     */
    nextAircraftBatch() {
        const endTime = this.time;
        const startTime = this.time - this.batchTime;
        this.time += this.batchTime;
        console.log('SQL: ' + 'SELECT * FROM flights JOIN flight_data ON flights.flight_id = flight_data.flight_id INNER JOIN (select iata_code as iata_from, latitude_deg as lat_from, longitude_deg as long_from from airports) a ON a.iata_from = flights.schd_from INNER JOIN airports b ON b.iata_code = flights.schd_to WHERE snapshot_id <= '+endTime+' AND snapshot_id >= '+startTime+' AND a.iata_from is not null AND b.iata_code is not null;');
        this.pool.query('SELECT * FROM flights JOIN flight_data ON flights.flight_id = flight_data.flight_id INNER JOIN (select iata_code as iata_from, latitude_deg as lat_from, longitude_deg as long_from from airports) a ON a.iata_from = flights.schd_from INNER JOIN airports b ON b.iata_code = flights.schd_to WHERE lat_from IS NOT NULL AND long_from IS NOT NULL AND latitude_deg IS NOT NULL AND longitude_deg IS NOT NULL AND snapshot_id <= $1 AND snapshot_id >= $2 AND a.iata_from is not null AND b.iata_code is not null;', [endTime, startTime]).then((flights) => {
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
                        lat_from: flight.lat_from,
                        long_from: flight.long_from,
                        lat_to: flight.latitude_deg,
                        long_to: flight.longitude_deg,
                        positions: [],
                    };
                }
                //console.log('FLIGHT: ', flightObj[flight.flight_id]);

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

            stagger(this.batchTime * 2.5 / 3, _.map(flightObj, (flight) => () => this.emit('aircraft', flight.flight_id, flight)));

            setTimeout(() => this.nextAircraftBatch(), this.batchTime);
        }).catch((err) => console.log(err)); // Errors are ignored
    }
}

/**
 *
 * @param {Number} time
 * @param {[Function]} funcs
 */
function stagger(time, funcs) {
    Promise.all(_.map(funcs, (func) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                func();
                resolve();
            }, Math.random() * time);
        });
    })).then(()=>{}).catch((err) => console.log(err));
}

module.exports = RealTimePG;
