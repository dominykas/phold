# phold
Hold promise rejection until requested

## Usage

### `phold(promise)`

Assigns an empty error handler on the `promise` to avoid `unhandledRejection` 
and returns a function that returns a promise which resolves with the original
value or rejects with the original error.

#### Example

```javascript
const { phold } = require('phold');

async function example() {
    
    // capture any rejections so you don't get the unhandledRejection warning/crash
    const giveItBack = phold(somethingThatCouldReject());
    
    // do more work
    await someOtherAsyncStuff();
    
    try {
        // resolve or reject with original result, if any
        await giveItBack();
    }
    catch (err) {
        // will be caught if somethingThatCouldReject() rejects
    }
}
```

## Use case

Suppose you have an asynchronous subscription channel, where you are waiting for a single message or a single error notification to arrive (e.g. notifications about jobs in a queue). The notification is triggered by a request. This means that you need to subscribe for the message _before_ you make the request (otherwise there is a chance you'll miss the notification if the job completes really really fast).

The subscription channel is probably an event emitter, but since we're only waiting for a single message, i.e. we have a concrete final state ("job completed" or "job failed") - a promise is a nice abstraction to use to hold the value until we need it. Your code might look something like this:

```javascript
async function queueExample() {

    const myJob = await createJob();
    
    const subscription = new Promise((resolve, reject) => {
        
        jobQueue
          .on('completed', (job) => {
    
              if (job.id === myJob.id) {
                  resolve(job);
              }
          })
          .on('error', (err) => {
              
              if (err.job.id === myJob.id) {
                  reject(err);
              }
          });
    });
    
    const started = await startJob(myJob);
    
    try {
        return await subscription;
    }
    catch (err) {
        return retry(myJob)
    }
}
```

Note how `startJob` is an async function - this means we're breaking the event loop _without_ assigning a `catch()` handler for the `subscription` promise. This means that if `error` event arrives before `startJob` completes (or if you have some other async steps before you actually need the `subscription`) - you will get this very nice warning in your console (node 6.6.0+):

```
(node:9260) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)
(node:9260) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
```

The scary part is the `DeprecationWarning` - in the future such code would crash your process - and this is absolutely _not_ what you want, because you're perfectly able to handle the rejection (e.g. by retrying the operation).

`phold` fixes this by assigning a `catch()` handler to your promise to hold the rejection until you're ready to use it.
