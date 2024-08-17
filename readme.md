# luminea2mqtt
This programm allows to controll and monitor Luminea smart plugs via mqtt.
This should also work with almost all other tuya devices, provided therre is a fitting device class. At the moment, only the nx-4458 is supported. More will follow.

This bridge is mostly based on the work of: https://github.com/codetheweb/tuyapi

## Features
* Easy intigration of luminea (tuya) device into HomeAssistant
* Auto reconnect to tuya device
* Supports Homeassistant Auto-Discovery
* Easily extendable

## Supported devices
At the moment:
* luminea nx-4458

More devices may follow when I can test them.

## Base Installation
### Requirements
* nodejs (https://nodejs.org/en)
* nvm (https://github.com/nvm-sh/nvm)

The bridge requires node.js version 18 and is based on the following libs:
* https://github.com/codetheweb/tuyapi
* https://github.com/mqttjs
* https://github.com/log4js-node/log4js-node
* https://github.com/tj/commander.js

### Installation steps
```
nvm install 18
nvm use 18
sudo ln -s $(realpath `which npm`) /usr/local/bin/npm
sudo ln -s `which node` /usr/local/bin/node

sudo useradd luminea2mqtt -s /bin/bash -d /opt/luminea2mqtt
sudo mkdir /opt/luminea2mqtt
sudo chown luminea2mqtt /opt/luminea2mqtt -R
sudo su - luminea2mqtt
git clone https://github.com/dennis9819/luminea2mqtt.git /opt/luminea2mqtt/bridge
cd bridge

npm install
cp config-example.yaml config.yaml
```
Configure your devices and mqtt settings (still as user luminea2mqtt):
```
vim config.yaml
```
### Run manually
```
sudo -u luminea2mqtt node /opt/luminea2mqtt/bridge/src/index.js -c /opt/luminea2mqtt/bridge/config.yaml
```
### Install as systemd service
```
sudo cp -p /opt/luminea2mqtt/bridge/luminea2mqtt.service /etc/systemd/system/luminea2mqtt.service
sudo systemctl daemon-reload
sudo systemctl start luminea2mqtt
```

## Configfile
The bridge requires a config file to specify mqtt connection information and the device configuration.

### MQTT config
An example is given in `config-example.yaml`

```
mqtt:
  host: "127.0.0.1"
  port: 1883
  username: "username"
  password: "password"
  clientid: "test"
  prefix: "luminea2mqtt"
```
These values define the port and ip of the server, as well as the credentials for this client. All values must be specified. Make sure that the `clientid` is unique.
The `prefix` is the prefix of all mqtt topics.

### Autodiscover
```
autodiscover:
  enabled: true
  topic: homeassistant
```
This enables auto discovery for home assistant. (See https://www.home-assistant.io/integrations/mqtt/#mqtt-discovery)
* `enabled`: enables autodiscovery.
* `topic`: topic prefix for discovery messages
### Device config
```
devices:
  - id: "sqy709956ply4inkx6ac87"
    key: "xxxxxxxxxxxxxxxx"
    friendlyname: "device1"
    refresh: 30 #refresh intervall in s
    type: luminea_nx_4458
```
* `id` and `key`: Specify id an local key of tuya device. There are severeal tutorials avaliable online on how to get these keys. This depends on the app you have used to register your devices if you don't want to reset them. If you use iO.e, see `extractkeys.md` on how to get extract these values.
* `friendlyname`: The displayname of the device. Also sets the base topic for this device as following: `/{mqtt.prefix}/{friendlyname}` If this property is not set, friendlyname defaults to the `id`. `/get` and `/set` topics are also used for turning the switch on or off.
* `refresh`: refresh intervall in s
* `type`: name of device class. Class files are located in `./src/modules`

## Device classes
Device classes are located in `./src/modules`. On intialization, each device in the config is initialized one by one. The js file, specified by `type` is loaded and a new instance of the exported class is created. 


### Creating your own devices
You can create your own devices in `./src/modules`. You can use `luminea_nx_4458.js`as an example. Your class should extend `DeviceBase`: 
```
class Lineplug extends DeviceBase {

    init() {
        
    }

    startWatcher() {
        
    }

    stopWatcher() {
        
    }


}
```
These functions must be implementd:
* `init` is called on creation. You can setup variables here
* `startWatcher` is called after the connection is established
* `stopWatcher` is called after disconnect (stop timers, unsubscribe mqtt,...)

These functions can be implemented:
* `pushAutodiscover(deviceConfig)` is called to publish the device config

These variables are available:
* `this.mqtt` reference to the mqtt client
* `this.topicname` String: topic prefix
* `this.topic_get` String: topic get
* `this.topic_set` String: topic set
* `this.topic_state` String: topic state
* `this.deviceid` String: device id
* `this.intervall_refresh` Number: refresh intervall (ms)
* `this.reconnect_timout` Number: reconnect intervall (ms)
* `this.lastdata` Object: buffer for last state
* `this.logger` reference to log4js logger


