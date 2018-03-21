'use strict';
const sinon = require('sinon');
const rewire = require('rewire');
const assert = require('assert');

let classifier = rewire('../classifier.js');

let fetch = sinon.stub();
describe('app.js', function() {
    describe('fetch resolves with answer', function() {
        beforeEach(function(done) {
            fetch = sinon.stub().resolves({
                json: sinon.stub().resolves({value: 0.1})
            });
            classifier.__set__('fetch', fetch);
            classifier.classify({airplane: ':D'}).then((value) => {
                assert.equal(value, 0.1);
                done();
            }).catch((err) => done(new Error('err')));
        });
        it('calls fetch with a url and body', function() {
            sinon.assert.calledOnce(fetch);
            sinon.assert.calledWithMatch(fetch, sinon.match.string, sinon.match.object);
        });
    });
    describe('fetch rejects', function() {
        beforeEach(function(done) {
            fetch = sinon.stub().rejects(400);
            classifier.__set__('fetch', fetch);
            classifier.classify({airplane: ':D'}).then(() => done(new Error('errr'))).catch(() => done());    
        });
        it('calls fetch with a url and body', function() {
            sinon.assert.calledOnce(fetch);
            sinon.assert.calledWithMatch(fetch, sinon.match.string, sinon.match.object);
        });    
    });
});
