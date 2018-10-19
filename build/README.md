# Release Configuration

This folder contains all of the files needed for ensuring that all releases
for this project go off without a hitch. :tada:

## File/Folder Structure
```
build
├── README.md                   // this file :)
├── returnExports.js            // used by gulpfile.js to write a UMD wrapper
├── sr-configs                  // contains the various semantic-release configurations
│   ├── local.js                // NOT run on CI, used during development
│   ├── publish.js              // run on CI, but only on master builds, publishes to npm, cdn, & GitHub
│   └── verify.js               // run on every CI build, verifies that local.js has been run
├── verify-release.sh           // does the actual verification of the files
└── write-package-version.js    // given a version number, writes into package.json and package-lock.json
```

## Workflow
> Note: this has been verified with branches on smartcar, might fail for forks
1. Developer creates branch and works on local machine.
2. Developer completes work and pushes everything up
3. Developer runs `npm run prepare-release`, this runs `semantic-release` with the `local.js` configuration. This will:
    1. write the computed version to `package.json` and `package-lock.json` (via `write-package-version.js`)
    2. run `npm run readme` to template the readme with the correctly versioned cdn link
    3. run `npm run jsdoc` to update the generated out jsdoc
4. PR/Push build on Travis CI runs `semantic-release` with the `verify.js` configuration. This will run `verify-release.sh`, which will:
    1. verify `package.json` and `package-lock.json` contain correct version
    2. verify that `README.md` has the correct version templated
    3. verify that `README.md` does NOT have the previous version number anywhere
    4. verify that the jsdoc generated on CI does not differ from the committed jsdoc
5. PR lands on master
6. Push build on Travis CI runs `semantic-release` first with `verify.js`, running all of the commands in step 4. Then, it will run `semantic-release` with the `publish.js` configuration. Doing so will:
    1. build the files for the cdn and add a umd wrapper around `sdk.js`
    2. publish umd wrapped file to `npm`
    3. publish a GitHub release with the release notes
    4. publish the files to the Smartcar CDN
