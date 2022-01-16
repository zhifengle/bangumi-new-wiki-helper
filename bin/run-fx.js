const webExt = require('web-ext').default;
const path = require('path');

webExt.cmd
  .run(
    {
      // These are command options derived from their CLI conterpart.
      // In this example, --source-dir is specified as sourceDir.
      firefox: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      sourceDir: path.resolve(__dirname, '../extension/'),
      // sourceDir: 'd:\\git-repos\\temp\\webextensions-examples\\borderify',
    },
    {
      // These are non CLI related options for each function.
      // You need to specify this one so that your NodeJS application
      // can continue running after web-ext is finished.
      shouldExitProgram: false,
    }
  )
  .then((extensionRunner) => {
    // The command has finished. Each command resolves its
    // promise with a different value.
    console.log(extensionRunner);
    // You can do a few things like:
    // extensionRunner.reloadAllExtensions();
    // extensionRunner.exit();
  });
