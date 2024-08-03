# luminea2mqtt
This programm allows to controll and monitor Luminea smart plugs via mqtt.
This should also work with almost all other tuya devices, provided therre is a fitting device class. At the moment, only the nx-4458 is supported. More will follow.

This bridge is mostly based on the work of: https://github.com/codetheweb/tuyapi

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
```
These values define the port and ip of the server, as well as the credentials for this client. All values must be specified. Make sure that the `clientid` is unique.

### Device config
```
devices:
  - id: "sqy709956ply4inkx6ac87"
    key: "xxxxxxxxxxxxxxxx"
    topic: "tuya/device1"
    refresh: 30 #refresh intervall in s
    type: luminea_nx_4458
```
* `id` and `key`: Specify id an local key of tuya device. There are severeal tutorials avaliable online on how to get these keys. This depends on the app you have used to register your devices if you don't want to reset them. If you use iO.e, see `extractkeys.md` on how to get extract these values.
* `topic`: base topic for mqtt. `/get` and `/set` topics are also used for turning the switch on or off.
* `refresh`: refresh intervall in s
* `type`: name of device class. Class files are located in `./src/modules`

## Device classes
Device classes are located in `./src/modules`. On intialization, each device in the config is initialized one by one. The js file, specified by `type` is loaded and a new instance of the exported class is created. 

On shutdown, the `.disconnect()` function of the class is called.

The constructor is called with the parameters:
* `config`: containing the parameters for this device specified in the config file
* `mqtt`: containing a reference to the mqtt client object

Example:
```
class Lineplug {
    constructor(deviceconfig, mqtt) {
        ...
```

### Creating your own devices
You can create your own devices in `./src/modules`. You can use `luminea_nx_4458.js`as an example. Make sure you define the constructor as described above and define a disconnect function. The rest is up to you!
