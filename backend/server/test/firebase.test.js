'use strict';
const sinon = require('sinon');
const rewire = require('rewire');
const assert = require('assert');

let firebase = rewire('../firebase.js');

let authMock = {
    signInWithEmailAndPassword: sinon.stub(),
    createUserWithEmailAndPassword: sinon.stub()
};
let refMock = {
    push: sinon.stub()
};
let databaseMock = {
    ref: () => refMock
};
let firebaseMock = {
    initializeApp: sinon.stub(),
    database: () => databaseMock,
    auth: () => authMock
};

let firebaseConnector;
describe('firebase.js', function(){
    beforeEach(function(){
        authMock = {
            signInWithEmailAndPassword: sinon.stub().rejects(),
            createUserWithEmailAndPassword: sinon.stub().rejects()
        };
        refMock = {
            push: sinon.stub().rejects()
        };
        databaseMock = {
            ref: () => refMock
        };
        firebaseMock = {
            initializeApp: sinon.stub(),
            database: () => databaseMock,
            auth: () => authMock
        };
        firebaseConnector = new firebase.FirebaseConnector();
        firebase.__set__('firebase', firebaseMock);
    });
    describe('login()', function(){
        describe('successfull login', function(){
            beforeEach(function(){
                authMock = {
                    signInWithEmailAndPassword: sinon.stub().resolves(),
                    createUserWithEmailAndPassword: sinon.stub().rejects()
                };
                return firebaseConnector.login();
            });
            it('calls signInWithEmailAndPassword', function(){
                sinon.assert.calledOnce(authMock.signInWithEmailAndPassword);
                sinon.assert.calledWithMatch(authMock.signInWithEmailAndPassword, sinon.match.string, sinon.match.string);
            });
            it('does not call createUserWithEmailAndPassword', function(){
                sinon.assert.notCalled(authMock.createUserWithEmailAndPassword);
            });
            it('has set user to <TODO>', function(){
                assert.equal(firebaseConnector.usr, '<TODO>');
            });
        });
        describe('successfull create user', function(){
            beforeEach(function(){
                authMock = {
                    signInWithEmailAndPassword: sinon.stub().rejects(),
                    createUserWithEmailAndPassword: sinon.stub().resolves()
                };
                return firebaseConnector.login();
            });
            it('calls signInWithEmailAndPassword', function(){
                sinon.assert.calledOnce(authMock.signInWithEmailAndPassword);
                sinon.assert.calledWithMatch(authMock.signInWithEmailAndPassword, sinon.match.string, sinon.match.string);
            });
            it('calls createUserWithEmailAndPassword', function(){
                sinon.assert.calledOnce(authMock.createUserWithEmailAndPassword);
                sinon.assert.calledWithMatch(authMock.createUserWithEmailAndPassword, sinon.match.string, sinon.match.string);
            });
            it('has set user to <TODO>', function(){
                assert.equal(firebaseConnector.usr, '<TODO>');
            });
        });
        describe('unsuccessfull login', function(){
            beforeEach(function(done){
                authMock = {
                    signInWithEmailAndPassword: sinon.stub().rejects(),
                    createUserWithEmailAndPassword: sinon.stub().rejects()
                };
                firebaseConnector.login().then(() => done(new Error())).catch(() => done());
            });
            it('calls signInWithEmailAndPassword', function(){
                sinon.assert.calledOnce(authMock.signInWithEmailAndPassword);
                sinon.assert.calledWithMatch(authMock.signInWithEmailAndPassword, sinon.match.string, sinon.match.string);
            });
            it('calls createUserWithEmailAndPassword', function(){
                sinon.assert.calledOnce(authMock.createUserWithEmailAndPassword);
                sinon.assert.calledWithMatch(authMock.createUserWithEmailAndPassword, sinon.match.string, sinon.match.string);
            });
            it('has not set user to <TODO>', function(){
                assert.notEqual(firebaseConnector.usr, '<TODO>');
            });
        });
    });
    describe('saveData()', function(){
        describe('successfull save data', function(){
            beforeEach(function(){
                refMock = {
                    push: sinon.stub().resolves()
                };

                firebaseConnector.usr = 'fbuser';
                return firebaseConnector.saveData('flyid', [{},{}]);
            });
            it('calls push', function(){
                sinon.assert.calledOnce(refMock.push);
                sinon.assert.calledWithMatch(refMock.push, {
                    flight_ID: 'flyid',
                    snapShots: [{},{}]
                });
            });
        });
        describe('unsuccessful save data', function(){
            beforeEach(function(done){
                refMock = {
                    push: sinon.stub().rejects()
                };

                firebaseConnector.usr = 'fbuser';
                firebaseConnector.saveData('flyid', [{},{}]).then(() => done(new Error())).catch(() => done());
            });
            it('calls push', function(){
                sinon.assert.calledOnce(refMock.push);
                sinon.assert.calledWithMatch(refMock.push, {
                    flight_ID: 'flyid',
                    snapShots: [{},{}]
                });
            });
        });
    });
});
