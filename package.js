Package.describe({
    summary: 'Run functions before and after methods, inspect arguments and modify return values. Works with builtin Meteor methods.',
    version: '2.0.0',
    name: 'doctorpangloss:method-hooks',
    git: 'https://github.com/workpop/meteor-method-hooks'
});

Package.on_use(function (api) {
    api.versionsFrom('METEOR@1.0');
    api.addFiles('method-hooks.js');
    api.export('MethodHooks');
});

Package.onTest(function (api) {
    api.use(['meteor', 'webapp', 'tinytest']);
    api.addFiles('method-hooks.js');
    api.addFiles('meteor-hooks-tests.js');
    api.export('MethodHooks');
});
