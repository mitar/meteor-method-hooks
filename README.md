# Meteor Method Hooks

Use this package to run functions before and after methods, including Meteor builtin methods like login and reset password. It supports a simple API that has tests for the server. Client features are experimental.

### Documentation

A hook is a function you run before or after a method on the server.

It accepts a single argument, `options`, an object with four properties:

 - `result`: The result of the method being hooked. This is `undefined` in before hooks. This is mutable.
 - `error`: An error, if any, of the method being hooked. This is `undefined` in before hooks.
 - `arguments`: An array of `arguments`, i.e., `_.toArray(arguments)`. This is mutable.
 - `hooksProcessed`: A count of the hooks that have been processed so far. This also corresponds to the index in the array of hooks for a method.
 - `methodName`: The name of the method being hooked.

An after hook should return `options.result` or a new result, which will be return as the result of the method. It will also be available to subsequent methods.

```
/**
 A hook to be run before or after a method.
 @name Hook
 @function
 @param {{result: *, error: *, arguments: Array, hooksProcessed: Number, methodName: String}}
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
   console.log('method name', options.methodName);
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
MethodHooks.before('login', function(options) {
  // Lowercase the email
  var loginOptions = options.arguments[0];
  if (loginOptions.email) {
    loginOptions.email = (loginOptions.email || '').toLowerCase();
  }
});

// Throw inside befores to prevent methods from being run
MethodHooks.before('doctorpangloss:admin/admin', function(options) {
  // Maybe you don't know that my admin package supports authentication already. Do it here
  // `this` corresponds to the method's conventional `this`
  var userId = this.userId;
  var user = Meteor.users.findOne(userId,
    // Try to always specify the fields you need. Best practices :)
    {fields: {role}});
    
  if (user && user.role == 'admin') {
    return
  }
  
  // Since the role is not admin, or the user wasn't found, throw.
  // This wil short-circuit the method
  throw new Meteor.Error(403, 'Permission denied.');
});

// Meteor.after to call after
MethodHooks.after('users/update', function(options) {
  // We want to track user updates in analytics
  var update = options.argument[1];
  // Cleverly, we set the event parameters to be whatever the user set.
  var parameters = update['$set'];
  Analytics.track(this.userId, 'User Update', parameters);
  // Return the result
  return options.result;
});

// You can also pass a dictionary of Objection.<String, Hook> like typical Meteor.methods.
// The two functions are `MethodHooks.beforeMethods` and `MethodHooks.afterMethods`.
MethodHooks.afterMethods({
  resetPassword: function(options) {
    // If the reset password failed, do nothing
    // The hook will run even if the method threw an error, so you must always check for an error
    if (options.error) {
      return;
    }

    // Get a redacted version of the token used to reset the password
    var redactedToken = 'Starting with ' + options.arguments[0].slice(0,4);
    // Update the user whose password with a reset record
    var userId = options.result.userId;
    Meteor.users.update(userId,
      {$addToSet: {'security.log': {method: 'resetPassword', at: new Date(), token: redactedToken}}});

    // The result can be mutated here. Let's note that it has been logged to the client
    options.result.logged = true;

    // You should return the result at the end of an after. You will receive a warning if a result was expected.
    return options.result;
  }
});

/*
* Query a collection based on the methodName property of options
* for example methodName here is 'Collection.update'
*/
MethodHooks.beforeMethods({
  Students.update: function (options) {
    // Get the collection name from options
    var collection = options.methodName.split('.')[0];
    // Get ID from options
    var id = options.arguments[0];
    // get collection
    var result = eval(collection).findOne(id);
    if (result) {
      // push the document to arguments if found
      return options.arguments.push(result);
    }
    throw new Meteor.Error(404, `${collection} isn't found`);
  }
});
```

Caution: Using this package on the client is strictly experimental until tests are written.


## Credits

Original Concept: [Chris Hitchcott](http://github.com/hitchcott), 2014
