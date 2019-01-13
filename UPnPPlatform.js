const Client = require('node-ssdp').Client;
const Server = require('node-ssdp').Server;

class UPnPPlatform {
    constructor(log, config, api) {
        this.log = log;

        this._client = new Client({
            ...config.ssdpClient,
            customLogger: this.log.debug.bind(this.log)
        });
        this._server = new Server({
            ...config.ssdpServer,
            customLogger: this.log.debug.bind(this.log)
        });
        this._devices = [];
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

    configureAccessory(accessory) {
        const Device = this._STToDevice[accessory.context.ST];

        if (Device) {
            const device = new Device(this, accessory.context.USN, accessory);

            this.addDevice(device);
        } else {
            this.removeAccessory(accessory)
        }
    }

    _start() {
        this._client.on('response', (headers) => {
            const Device = this._STToDevice[headers.ST];

            if(!Device) {
                return;
            }

            let device = this._devices.find(device => device.USN === headers.USN);

            if(!device) {
                device = new Device(this, headers.USN);
            }

            device.setLocation(headers.LOCATION);
        });

        this._server.on('advertise-alive', (headers) => {
            const Device = this._STToDevice[headers.NT];

            if (!Device) {
                return;
            }

            let device = this._devices.find(device => device.USN === headers.USN);

            if(!device) {
                device = new Device(this, headers.USN);
            }

            if(device.hasLocation()) {
                device.onAlive();
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
                device.onBye();
            }
        });

        this._client.search('ssdp:all');
        this._server.start();
    }

    addAccessory(accessory) {
        this.api.registerPlatformAccessories(require('./package.json').name, 'UPnP', [accessory]);
    }

    removeAccessory(accessory) {
        this.api.unregisterPlatformAccessories(require('./package.json').name, 'UPnP', [accessory]);
    }

    addDevice(device) {
        this.log('Add device', device.accessory.displayName);
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
