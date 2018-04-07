'use strict';

module.exports.phold = (promise) => {

    promise.catch(() => {});

    return () => {

        return new Promise((resolve) => resolve(promise));
    }
};
