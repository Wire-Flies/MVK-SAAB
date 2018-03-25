'use strict';
const sinon = require('sinon');
const rewire = require('rewire');
const assert = require('assert');



let constructorFunc = sinon.stub();
let queryFunc = sinon.stub();
/** */
class Pool {
    /**
     * @param {Object}  obj    Connection info
     */
    constructor(obj) {
        constructorFunc(obj);
    }

    /**
     * @param {String} q    Query
     * @param {Array}  o    Prepared values
     * @return {Promise} Mock
     */
    query(q, o) {
        return queryFunc(q, o);
    }
}

let pg = {
    Pool: Pool,
};

let RealTimePG;
let clock;
let rtpg;
describe('realTimePG.js', function() {
    beforeEach(function() {
        clock = sinon.useFakeTimers();

        RealTimePG = rewire('../realTimePG.js');
        RealTimePG.__set__('pg', pg);
    });
    afterEach(function() {
        clock.restore();
    });
    describe('does not call query unless batchtime emits events every batchtime', function() {
        beforeEach(function(done) {
            constructorFunc = sinon.stub();
            queryFunc = sinon.stub().resolves([{flight_id: '1'}, {flight_id: '2'}, {flight_id: '1'}]);
            RealTimePG.__set__('pg', pg);
            rtpg = new RealTimePG(100000, 10000, 'usr', 'pass', 'localhost', 5432, 'db');
            clock.tick(9900);
            setTimeout(done, 10);
            clock.tick(50);
        });
        it('calls constructor with correct connection string', function() {
            sinon.assert.calledOnce(constructorFunc);
            sinon.assert.calledWithMatch(constructorFunc, {connectionString: 'postgresql://usr:pass@localhost:5432/db'});
        });
        it('does not call query', function() {
            sinon.assert.notCalled(queryFunc);
        });
    });
    describe('emits events every batchtime', function() {
        beforeEach(function(done) {
            constructorFunc = sinon.stub();
            queryFunc = sinon.stub().resolves([{flight_id: '1'}, {flight_id: '2'}, {flight_id: '1'}]);
            RealTimePG.__set__('pg', pg);
            rtpg = new RealTimePG(100000, 10000, 'usr', 'pass', 'localhost', 5432, 'db');
            let i = 0;
            rtpg.on('aircraft', () => {
                i++;
                if (i === 2) {
                    done();
                }
            });

            clock.tick(15000);
        });
        it('calls constructor with correct connection string', function() {
            sinon.assert.calledOnce(constructorFunc);
            sinon.assert.calledWithMatch(constructorFunc, {connectionString: 'postgresql://usr:pass@localhost:5432/db'});
        });
        it('does not call query', function() {
            sinon.assert.calledOnce(queryFunc);
            sinon.assert.calledWithMatch(queryFunc, 'SELECT * FROM flights JOIN flight_data ON flights.flight_id = flight_data.flight_id WHERE snapshot_id < $1 AND snapshot_id >= $2;', [100000, 90000]);
        });
    });
    describe('flights are merged correctly', function() {
        let results = {};
        beforeEach(function(done) {
            results = {};
            constructorFunc = sinon.stub();
            queryFunc = sinon.stub().resolves([{flight_id: '1', longitude: 1.2131}, {flight_id: '2', latitude: 1.20}, {flight_id: '1', longitude: 2.4}]);
            RealTimePG.__set__('pg', pg);
            rtpg = new RealTimePG(100000, 10000, 'usr', 'pass', 'localhost', 5432, 'db');
            let i = 0;
            rtpg.on('aircraft', (flight) => {
                results[flight.flight_id] = flight;
                i++;
                if (i === 2) {
                    done();
                }
            });

            clock.tick(15000);
        });
        it('get the correct results', function() {
            assert.equal(results['1'].flight_id, '1');
            assert.equal(results['1'].positions[0].longitude, 1.2131);
            assert.equal(results['1'].positions[1].longitude, 2.4);
            assert.equal(results['2'].flight_id, '2');
            assert.equal(results['2'].positions[0].latitude, 1.2);
        });
        it('calls constructor with correct connection string', function() {
            sinon.assert.calledOnce(constructorFunc);
            sinon.assert.calledWithMatch(constructorFunc, {connectionString: 'postgresql://usr:pass@localhost:5432/db'});
        });
        it('does not call query', function() {
            sinon.assert.calledOnce(queryFunc);
            sinon.assert.calledWithMatch(queryFunc, 'SELECT * FROM flights JOIN flight_data ON flights.flight_id = flight_data.flight_id WHERE snapshot_id < $1 AND snapshot_id >= $2;', [100000, 90000]);
        });
    });

});
