'use strict';

const { phold } = require('.');

const { expect } = require('code');
const Hoek = require('hoek');
const Sinon = require('sinon');
const Teamwork = require('teamwork');

const testResolve = async () => {

    const rejectionSpy = Sinon.spy();
    process.on('unhandledRejection', rejectionSpy);

    const unhold = phold(Promise.resolve('value'));
    const value = await unhold();

    expect(value).to.equal('value');
    expect(rejectionSpy.callCount).to.equal(0);
    process.removeListener('unhandledRejection', rejectionSpy);
};

const testReject = async () => {

    const rejectionSpy = Sinon.spy();
    process.on('unhandledRejection', rejectionSpy);

    const unhold = phold(Promise.reject(new Error('boom')));
    await Hoek.wait(); // next tick
    expect(rejectionSpy.callCount).to.equal(0);

    let caught;
    try {
        await unhold();
    }
    catch (err) {
        caught = err;
    }

    expect(caught).to.be.an.error('boom');
    process.removeListener('unhandledRejection', rejectionSpy);
};

const testReReject = async () => {

    const team = new Teamwork();
    const rejectionSpy = Sinon.spy();
    process.on('unhandledRejection', (err) => {

        expect(err).to.be.an.error('boom');
        rejectionSpy();
        team.attend();
    });

    const unhold = phold(Promise.reject(new Error('boom')));
    await Hoek.wait(); // next tick
    expect(rejectionSpy.callCount).to.equal(0);

    // create a new unhandled rejection
    setTimeout(() => unhold());

    await team.work;

    expect(rejectionSpy.callCount).to.equal(1);
};

const test = async () => {

    await testResolve();
    await testReject();
    await testReReject();

    return 'OK';
};

setTimeout(() => {

    console.error('TIMED OUT');
    process.exit(1);
}, 10000);

test()
    .then((result) => {

        expect(result).to.equal('OK');
        console.log('OK');

        process.exit();
    })
    .catch((err) => {

        console.error('FAILED', err);
        process.exit(1);
    });
