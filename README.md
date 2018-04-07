# phold
Hold promise rejection until requested

## Usage

### `phold(promise)`

Assigns an empty error handler on the `promise` to avoid `unhandledRejection` and returns a function that returns a promise which resolves with the original value or rejects with the original error.

## Example

```javascript
const { phold } = require('phold');

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
```
