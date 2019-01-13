var homebridge;

var adapter = {
    initialize(bridge) {
        if (homebridge) {
            throw new Error('Homebridge already initialized');
        }

        homebridge = bridge;

        return adapter;
    }
};

var proxy = new Proxy(adapter, {
    get(target, p) {
        if (p in target) {
            return target[p]
        } else if (!homebridge) {
            throw new Error('Homebridge not initialized')
        } else {
            return homebridge[p]
        }
    },
    set(target, p, value) {
        if (p in target) {
            throw new Error(`You can't rewrite homebridge proxy property`)
        } else if (!homebridge) {
            throw new Error('Homebridge not initialized')
        } else {
            homebridge[p] = value
        }
    },
    has(target, p) {
        if (p in target) {
            return p in target;
        } else if (!homebridge) {
            throw new Error('Homebridge not initialized')
        } else {
            return p in homebridge
        }
    }
});

module.exports = proxy;
