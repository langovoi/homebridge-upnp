const Client = require('node-ssdp').Client;
const Server = require('node-ssdp').Server;

class UPnPPlatform {
    constructor(log, config, api) {
        this.log = log;

        this._config = config;

        this._client = new Client({
            ...config.ssdpClient,
            customLogger: this.log.debug.bind(this.log)
        });
        this._server = new Server({
            ...config.ssdpServer,
            customLogger: this.log.debug.bind(this.log)
        });
        this._devices = [];
        this._preparingDevices = [];
        this._accessoriesToRemove = [];

        this._STToDevice = {
            'urn:schemas-upnp-org:device:MediaRenderer:1': require('./MediaRenderer1')
        };

        if (api) {
            this.api = api;

            this.api.on('didFinishLaunching', () => {
                this._start()
            });

            this.api.on('shutdown', () => {
                this._shutdown();
            })
        }
    }

    _isUSNExcluded(USN) {
        const excluded = this._config.excludeUSN || [];

        return excluded.includes(USN)
    }

    configureAccessory(accessory) {
        const Device = this._STToDevice[accessory.context.ST];

        if (Device && !this._isUSNExcluded(accessory.context.USN)) {
            const device = new Device(this, accessory.context.USN, accessory);

            this.addDevice(device);
        } else {
            this._accessoriesToRemove.push(accessory);
        }
    }

    _start() {
        this.removeAccessories(this._accessoriesToRemove);

        this._accessoriesToRemove = [];

        this._client.on('response', (headers) => {
            if(this._isUSNExcluded(headers.USN)) {
                return;
            }

            const Device = this._STToDevice[headers.ST];

            if(!Device) {
                return;
            }

            let device = this._devices.find(device => device.USN === headers.USN);

            if(!device) {
                device = this._preparingDevices.find(device => device.USN === headers.USN);
            }

            if(!device) {
                device = new Device(this, headers.USN);
                this._preparingDevices.push(device);
            }

            if(!device.hasLocation()) {
                device.setLocation(headers.LOCATION);
            }
        });

        this._server.on('advertise-alive', (headers) => {
            if(this._isUSNExcluded(headers.USN)) {
                return;
            }

            const Device = this._STToDevice[headers.NT];

            if (!Device) {
                return;
            }

            let device = this._devices.find(device => device.USN === headers.USN);

            if(!device) {
                device = this._preparingDevices.find(device => device.USN === headers.USN);
            }

            if(!device) {
                device = new Device(this, headers.USN);
                this._preparingDevices.push(device);
            }

            if(device.hasLocation()) {
                device.alive();
            } else {
                device.setLocation(headers.LOCATION);
            }
        });

        this._server.on('advertise-bye', (headers) => {
            const Device = this._STToDevice[headers.NT];
            if (!Device) {
                return;
            }

            const device = this._devices.find(device => device.USN === headers.USN);

            if(device) {
                device.bye();
            }
        });

        this._client.search('ssdp:all');
        this._server.start();
    }

    addAccessory(accessory) {
        this.api.registerPlatformAccessories(require('./package.json').name, 'UPnP', [accessory]);
    }

    removeAccessories(accessories) {
        this.api.unregisterPlatformAccessories(require('./package.json').name, 'UPnP', accessories);
    }

    addDevice(device) {
        if(this._preparingDevices.includes(device)) {
            this._preparingDevices.splice(this._preparingDevices.indexOf(device), 1);
        }

        this.log('Add device', device.accessory.displayName, `(USN: ${device.accessory.context.USN})`);
        this._devices.push(device);
    }

    _shutdown() {
        this._client.stop();
        this._server.stop();

        for(const device of this._devices) {
            device.stop();
        }
    }
}


module.exports = UPnPPlatform;
