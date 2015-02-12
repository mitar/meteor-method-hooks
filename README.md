# Meteor Method Hooks

A hook is a function you run before or after a method on the server.

It accepts a single argument, `options`, an objecting with three properties:

 - `result`: The result of the method being hooked. This is `undefined` in before hooks.
 - `error`: An error, if any, of the method being hooked. This is `undefined` in before hooks.
 - `arguments`: A raw arguments object whose type is `arguments`.
 
```
/**
 A hook to be run before or after a method.
 @name Hook
 @function
 @param {{result: *, error: *, arguments: Array, hooksProcessed: Number}}
 @return {*} The result of the method
  An options parameter that has the result and error from calling the method
  and the arguments used to call that method. `result` and `error` are null
  for before hooks, since the method has not yet been called. On the client,
  after hooks are called when the method returns from the server, but before
  the callback is invoked. `hooksProcessed` gives you the number of hooks
  processed so far, since previous hooks may have mutated the arguments.

  After hooks can change the result values. Use `hooksProcessed` to keep
  track of how many modifications have been made.
 */
 
function hook(options) {
   console.log('arguments', options.arguments);
   console.log('error', options.error);
   console.log('result', options.result);
   console.log('hooks processed', options.hooksProcessed);
   // To be safe, return the options.result
   return options.result;
}
```

Hooks are called in the following order:

 - **Before** hooks.
 - The method body.
 - **After** hooks, regardless of whether or not the method body threw an error.
 - Callbacks, if any.
 
### Examples

```js
// Pass a method name and a hook function
MeteorHooks.before('login', function(options) {
  // Lowercase the email
  var loginOptions = options.arguments[0];
  if (loginOptions.email) {
    loginOptions.email = (loginOptions.email || '').toLowerCase();
  }
});

MethodHooks.afterMethods({
  resetPassword: function(options) {
    // If the reset password failed, do nothing
    if (options.error) {
      return;
    }

    // Get a redacted version of the token used to reset the password
    var redactedToken = options.arguments[0].slice(0,4) + '***********************************************'

    // Update the user whose password with a reset record
    var userId = options.result.userId;
    Meteor.users.update(userId,
      {$addToSet: {'security.log': {method: 'resetPassword', at: new Date(), token: redactedToken}}});

    // The result can be mutated here. Let's note that it has been logged to the client
    options.result.logged = true;

    // We do not have to return the result here. You cannot modify the return value, since other after functions may
    // overwrite it
  }
});
```

Caution: Using this package on the client is strictly experimental until tests are written.


## Credits

Original Concept: [Chris Hitchcott](http://github.com/hitchcott), 2014
