
const TuyaDevice = require('tuyapi');
const log4js = require('log4js');
const autodiscover = require('./autodiscover')
const configldr = require('./config')

class DeviceManager {
    constructor() {
        // setup logger
        this.devices = []
        this.logger = log4js.getLogger("devicemanager");
        this.logger.level = configldr.config.loglevel;
        this.config = configldr.config
        this.connected = false


    }

    setClient(mqtt){
        this.mqtt = mqtt
    }

    async connect() {
        if (!this.connected) {
            this.logger.info(`Setup all devices...`)
            this.connected = true
            if (this.config.devices) {
                this.config.devices.forEach((device) => {
                    device.loglevel = configldr.config.loglevel;
                    const deviceClassFile = `./modules/${device.type}`
                    this.logger.info(`Setup device ${device.id}, type: ${device.type}, class:'${deviceClassFile}.js'`)
                    try {
                        const DeviceClass = require(deviceClassFile)
                        const newdev = new DeviceClass(device, this.mqtt)
                        this.devices.push(newdev)
                    } catch (error) {
                        this.logger.error(`Error initializing device class ${deviceClassFile}`);
                        this.logger.error(error.message);
                    }

                })
            } else {
                this.logger.error(`Missing 'devices' in config.`)
                process.exit(10)
            }
        } else {
            this.logger.debug("Devices already connected")
        }
    }

    async disconnect() {
        if (this.connected) {
            this.connected = false
            for (let device of devices) {
                await device.disconnect()
            }
        } else {
            this.logger.debug("Devices already disconnected")
        }
    }

}

module.exports = DeviceManager