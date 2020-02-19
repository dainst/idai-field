const remote = require('electron').remote;

remote.app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');