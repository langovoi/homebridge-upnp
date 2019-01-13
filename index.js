const homebridge = require('./homebridge');
const UPnPPlatform = require('./UPnPPlatform');

module.exports = function(bridge) {
    homebridge.initialize(bridge);

    homebridge.registerPlatform(require('./package.json').name, 'UPnP', UPnPPlatform, true);
};
