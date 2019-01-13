const Client = require('@langovoi/upnp-device-client');

class Device {
    constructor(platform, USN, accessory = null) {
        this._platform = platform;
        this._USN = USN;
        this._accessory = accessory;
        this._accessoryConfigured = false;

        this._client = null;
    }

    get USN() {
        return this._USN;
    }

    hasLocation() {
        return this._client !== null;
    }

    setLocation(location) {
        if (this._client !== null) {
            if (this._client.url === location) {
                return;
            }

            this._client.unsubscribe('RenderingControl', this._handleEvent);
            this._client = null;
        }

        this._client = new Client(location, {
            customLogger: this._platform.log.debug.bind(this._platform.log)
        });
        this._client.on('error', (err) => {
            this._platform.log.error(err);
        });

        this._client.getDeviceDescription((err, description) => {
            if (err) {
                this._platform.log.error(err);
                return;
            }

            let accessoryCreated = this._accessory === null;

            if(!this._accessoryConfigured) {
                this._createAccessory(description);
                this._accessoryConfigured = true;
            } else {
                this._updateAccessory(description);
            }

            if (accessoryCreated) {
                this._platform.addDevice(this);
                this._platform.addAccessory(this.accessory);
            }
        });
    }

    get accessory() {
        return this._accessory;
    }

    onAlive() {
        throw new Error('onAlive must be implemented');
    }

    onBye() {
        throw new Error('onBye must be implemented');
    }

    _createAccessory() {
        throw new Error('_createAccessory must be implemented');
    }

    _updateAccessory() {
        throw new Error('_updateAccessory must be implemented');
    }

    stop() {
        throw new Error('stop must be implemented');
    }
}

module.exports = Device;
