const Client = require('@langovoi/upnp-device-client');

class Device {
    constructor(platform, USN, accessory = null) {
        this._platform = platform;
        this._USN = USN;
        this._accessory = accessory;

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

        this._client = new Client(location);

        this._client.getDeviceDescription((err, description) => {
            if (err) {
                this._platform.log.error(err);
                return;
            }

            let accessoryCreated = this._accessory === null;

            const accessory = this._createAccessory(description);

            if (accessoryCreated) {
                this._platform.addDevice(this);
                this._platform.addAccessory(accessory);
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

    stop() {
        throw new Error('stop must be implemented');
    }
}

module.exports = Device;
