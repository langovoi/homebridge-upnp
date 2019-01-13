# UPnP for Homebridge

[Universal Plug and Play (UPnP)](http://upnp.org/resources/documents/UPnP_UDA_tutorial_July2014.pdf) is a set of networking protocols that permits networked devices to seamlessly discover each other's presence on the network and establish functional network services.

## Supported devices types

### [MediaRenderer v1](http://upnp.org/specs/av/UPnP-av-MediaRenderer-v1-Device.pdf)

Most of Smart TV supports this device type.

It requires implementation of [RenderingControl v1](http://upnp.org/specs/av/UPnP-av-RenderingControl-v1-Service.pdf) service,
 which allow control Volume and Mute states.
 
Current implementation of plugin automatically discover UPnP devices and add Lightbulb accessory
which allow to control Volume by slider and mute by on/off.


## Install

```bash
$ npm install -g homebridge-upnp
```

## Usage

Simply add to your Homebridge config new platform called "UPnP" and restart Homebridge.

```json
{
  "platforms": [
      {
        "platfrom": "UPnP"
      }
  ]
}
```

Also you can provide custom config for [upnp-device-client](https://github.com/langovoi/node-upnp-device-client#readme) by `ssdpClient` and `ssdpServer` options:

```json
{
  "platforms": [
      {
        "platfrom": "UPnP",
        "ssdpClient": {
          "interfaces": ["br0"]
        },
        "ssdpServer": {
          "interfaces": ["br0"]
        }
      }
  ]
}
```
