if (Meteor.isServer) {
    var test1test;

    Meteor.methods({
        test1: function (value1, mutatedValue2) {
            test1test.equal(value1, 3);
            test1test.equal(mutatedValue2, 1);
            return value1 + (mutatedValue2 || 0);
        }
    });

    MethodHooks.before('test1', function (options) {
        test1test.equal(options.arguments[0], 3);
        test1test.equal(options.arguments[1], 'error');
        // Mutate the arguments
        options.arguments[1] = 1;
    });

    Tinytest.add('server before', function (test) {
        test1test = test;
        var r = Meteor.call('test1', 3, 'error');

        test.equal(r, 4);
    });

    var test2test;

    Meteor.methods({
        test2: function (value1) {
            test2test.equal(value1, 3);
            return value1;
        }
    });

    MethodHooks.after('test2', function (options) {
        test2test.equal(options.arguments[0], 3);
        test2test.isUndefined(options.arguments[1]);
        // Mess with the return value
        return options.result + 1;
    });

    Tinytest.add('server after', function (test) {
        test2test = test;
        var r = Meteor.call('test2', 3);
        test.equal(r, 4);
    });

    var test3test;

    Meteor.methods({
        test3: function (a, b) {
            test3test.equal(a, 4);
            test3test.equal(b, 2);
            return a + b;
        }
    });

    MethodHooks.before('test3', function (options) {
        test3test.equal(options.arguments[0], 1);
        test3test.equal(options.arguments[1], 2);
        // Mutate the a argument
        options.arguments[0] = 4;
    });

    MethodHooks.after('test3', function (options) {
        // Check that you expect 6
        test3test.equal(options.result, 6);

        // Now return six anyways
        return 7;
    });

    Tinytest.add('server before and after', function (test) {
        test3test = test;
        var r = Meteor.call('test3', 1, 2);
        test.equal(r, 7);
    });

    Meteor.methods({
        test4: function () {
            throw new Meteor.Error(500, 'error');
        }
    });

    var test4test;

    MethodHooks.before('test4', function (options) {
        test4test.isUndefined(options.error);
        test4test.isUndefined(options.result);
    });

    MethodHooks.after('test4', function (options) {
        test4test.equal(options.error.reason, 'error');
    });

    Tinytest.add('server error', function (test) {
        test4test = test;
        var e1;

        try {
            Meteor.call('test4');
        } catch (e) {
            e1 = e;
        }

        test.equal(e1.error, 500);
        test.equal(e1.reason, 'error');
    });

    var test5test;

    Meteor.methods({
        test5: function () {
            return 1;
        }
    });

    var hook = function (options) {
        // For every hook that's processed, we've added one to the result, so we expect, start with 1, the result to
        // be teh number of hooks processed + 1
        test5test.equal(options.result, options.hooksProcessed + 1);
        // Return the previous result plus 1.
        return options.result + 1;
    };

    MethodHooks.after('test5', hook);
    MethodHooks.after('test5', hook);
    MethodHooks.after('test5', hook);

    Tinytest.add('server multiple after hooks', function (test) {
        test5test = test;
        var r = Meteor.call('test5');

        test.equal(r, 4);
    });
}