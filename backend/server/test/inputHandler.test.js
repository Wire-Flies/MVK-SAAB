'use strict';

const sinon = require('sinon');
const assert = require('assert');
const rewire = require('rewire');
const EventEmitter = require('events');

let inputHandler = rewire('../inputHandler.js');

let firebaseConnectorMock = {
    saveData: sinon.stub(),
};

let classifierMock = {
    classify: sinon.stub(),
};

/** */
class SourceMock extends EventEmitter {}

let InputHandler;
describe('inputHandler.js', function() {
    beforeEach(function() {
        classifierMock = {
            classify: sinon.stub().rejects(new Error()),
        };
        firebaseConnectorMock = {
            saveData: sinon.stub().rejects(new Error()),
        };
        
        inputHandler.__set__('classifier', classifierMock);
        InputHandler = new inputHandler.InputHandler(firebaseConnectorMock, 0);
    });
    describe('addInputSource()', function() {
        describe('cutoff greater than classifier value', function() {
            beforeEach(function(done) {
                classifierMock = {
                    classify: sinon.stub().resolves(0.3),
                };
                inputHandler.__set__('classifier', classifierMock);
                InputHandler = new inputHandler.InputHandler(firebaseConnectorMock, 0.5);
                let sourceMock = new SourceMock();
                InputHandler.addInputSource(sourceMock);
                sourceMock.emit('aircraft', 'id', {});
                setTimeout(done, 2);
            });
            it('calls classifier.classify', function() {
                sinon.assert.calledOnce(classifierMock.classify);
                sinon.assert.calledWithMatch(classifierMock.classify, {});
            });
            it('does not call firebaseConnection.saveData', function() {
                sinon.assert.notCalled(firebaseConnectorMock.saveData);
            });
        });
        describe('value greater than cutoff', function() {
            beforeEach(function(done) {
                classifierMock = {
                    classify: sinon.stub().resolves(0.3),
                };
                inputHandler.__set__('classifier', classifierMock);
                InputHandler = new inputHandler.InputHandler(firebaseConnectorMock, 0.2);
                let sourceMock = new SourceMock();
                InputHandler.addInputSource(sourceMock);
                sourceMock.emit('aircraft', 'id', {});
                setTimeout(done, 10);
            });
            it('calls classifier.classify', function() {
                sinon.assert.calledOnce(classifierMock.classify);
                sinon.assert.calledWithMatch(classifierMock.classify, {});
            });
            it('calls firebaseConnection.saveData', function() {
                sinon.assert.calledOnce(firebaseConnectorMock.saveData);
                sinon.assert.calledWithMatch(firebaseConnectorMock.saveData, 'id', {});
            });
        });
        describe('classifier.classify fails', function() {
            beforeEach(function(done) {
                classifierMock = {
                    classify: sinon.stub().rejects(new Error()),
                };
                inputHandler.__set__('classifier', classifierMock);
                InputHandler = new inputHandler.InputHandler(firebaseConnectorMock, 0.5);
                let sourceMock = new SourceMock();
                InputHandler.addInputSource(sourceMock);
                sourceMock.emit('aircraft', 'id', {});
                setTimeout(done, 10);
            });
            it('calls classifier.classify', function() {
                sinon.assert.calledOnce(classifierMock.classify);
                sinon.assert.calledWithMatch(classifierMock.classify, {});
            });
            it('does not call firebaseConnection.saveData', function() {
                sinon.assert.notCalled(firebaseConnectorMock.saveData);
            });
        });
    });
});
