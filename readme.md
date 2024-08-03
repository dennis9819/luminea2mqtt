# luminea2mqtt
This programm allows to controll and monitor Luminea smart plugs via mqtt.

the bridge requires node.js version 18 and is based on the following libs:
* https://github.com/codetheweb/tuyapi
* https://github.com/mqttjs
* https://github.com/log4js-node/log4js-node

## Supported devices
* luminea nx-4458

## Base Installation
```
nvm install 18
nvm use 18
sudo ln -s $(realpath `which npm`) /usr/local/bin/npm
sudo ln -s `which node` /usr/local/bin/node

sudo useradd luminea2mqtt -s /bin/bash -d /opt/luminea2mqtt
sudo mkdir /opt/luminea2mqtt
sudo chown luminea2mqtt /opt/luminea2mqtt
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
Run:
```
sudo -u luminea2mqtt node /opt/luminea2mqtt/bridge/src/index.js -c /opt/luminea2mqtt/bridge/config.yaml
```
### Install as systemd service
```

```