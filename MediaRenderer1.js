const Device = require('./Device');
const homebridge = require('./homebridge');

class MediaRenderer1 extends Device {
    constructor(platform, USN, accessory) {
        super(platform, USN, accessory);

        this._handleEvent = this._handleEvent.bind(this);
    }

    _createAccessory(description) {
        const UUID = description.UDN.substr('uuid:'.length);

        let accessory = this._accessory;

        if (!accessory) {
            accessory = new homebridge.platformAccessory(description.friendlyName, UUID);
            accessory.context.USN = this.USN;
            accessory.context.ST = 'urn:schemas-upnp-org:device:MediaRenderer:1';
            this._accessory = accessory;
        }

        const informationService = this.accessory.getService(homebridge.hap.Service.AccessoryInformation);

        if (description.friendlyName) {
            informationService.getCharacteristic(homebridge.hap.Characteristic.Manufacturer).updateValue(description.friendlyName);
        }

        if (description.manufacturer) {
            informationService.getCharacteristic(homebridge.hap.Characteristic.Manufacturer).updateValue(description.manufacturer);
        }

        if (description.modelName) {
            informationService.getCharacteristic(homebridge.hap.Characteristic.Model).updateValue(description.modelName);
        }

        if (description.serialNumber) {
            informationService.getCharacteristic(homebridge.hap.Characteristic.SerialNumber).updateValue(description.serialNumber);
        }

        let switchService = this.accessory.getService(homebridge.hap.Service.Lightbulb);

        if (!switchService) {
            this.accessory.addService(homebridge.hap.Service.Lightbulb);
            switchService = this.accessory.getService(homebridge.hap.Service.Lightbulb)
        }

        switchService.getCharacteristic(homebridge.hap.Characteristic.On)
            .on('get', (callback) => {
                this._getMute((err, value) => {
                    if (err) {
                        callback(err);
                        return;
                    }

                    callback(null, !value);
                })
            })
            .on('set', (value, callback) => this._setMute(!value, callback));

        switchService.getCharacteristic(homebridge.hap.Characteristic.Brightness)
            .on('get', this._getVolume.bind(this))
            .on('set', this._setVolume.bind(this));

        this._client.subscribe('RenderingControl', this._handleEvent);

        return accessory
    }

    onAlive() {
        this._getMute((err, value) => {
            if (err) {
                this._platform.log.error(err);
                return;
            }

            this.accessory.getService(homebridge.hap.Service.Lightbulb).getCharacteristic(homebridge.hap.Characteristic.On).updateValue(!value);
        });

        this._getVolume((err, value) => {
            if (err) {
                this._platform.log.error(err);
                return;
            }

            this.accessory.getService(homebridge.hap.Service.Lightbulb).getCharacteristic(homebridge.hap.Characteristic.Brightness).updateValue(value);
        });
    }

    onBye() {
        if (this._client) {
            this._client.subscriptions = {};
            this._client.releaseEventingServer();
            this._client = null;
        }

        this.accessory.getService(homebridge.hap.Service.Lightbulb).getCharacteristic(homebridge.hap.Characteristic.On).updateValue(false);
    }

    stop() {
        if (this._client) {
            this._client.unsubscribe('RenderingControl', this._handleEvent);
        }
    }

    _handleEvent(event) {
        if (event.Volume) {
            const volume = parseInt(event.Volume);

            this.accessory.getService(homebridge.hap.Service.Lightbulb).getCharacteristic(homebridge.hap.Characteristic.Brightness).updateValue(volume);
        }

        if (event.Mute) {
            const mute = Boolean(parseInt(event.Mute));

            this.accessory.getService(homebridge.hap.Service.Lightbulb).getCharacteristic(homebridge.hap.Characteristic.On).updateValue(!mute);
        }
    }

    _getMute(callback) {
        if (this._client === null) {
            callback(new Error('Client not initialized'));
            return;
        }

        this._client.callAction('RenderingControl', 'GetMute', {
            InstanceID: 0,
            Channel: 'Master'
        }, function (err, result) {
            if (err) {
                callback(err);
                return;
            }

            callback(null, Boolean(parseInt(result.CurrentMute)));
        });
    }

    _getVolume(callback) {
        if (this._client === null) {
            callback(new Error('Client not initialized'));
            return;
        }

        this._client.callAction('RenderingControl', 'GetVolume', {
            InstanceID: 0,
            Channel: 'Master'
        }, function (err, result) {
            if (err) {
                callback(err);
                return;
            }

            callback(null, parseInt(result.CurrentVolume));
        });
    }

    _setMute(value, callback) {
        if (this._client === null) {
            callback(new Error('Client not initialized'));
            return;
        }

        this._client.callAction('RenderingControl', 'SetMute', {
            InstanceID: 0,
            Channel: 'Master',
            DesiredMute: value
        }, callback);
    }

    _setVolume(value, callback) {
        if (this._client === null) {
            callback(new Error('Client not initialized'));
            return;
        }

        this._client.callAction('RenderingControl', 'SetVolume', {
            InstanceID: 0,
            Channel: 'Master',
            DesiredVolume: value
        }, callback);
    }
}

module.exports = MediaRenderer1;
