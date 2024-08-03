
const TuyaDevice = require('tuyapi');
const log4js = require('log4js');

class DeviceBase {
    constructor(deviceconfig, mqtt) {
        // setup logger
        const loggername = deviceconfig.id ? deviceconfig.id : "undef device"
        this.logger = log4js.getLogger(loggername);
        this.logger.level = deviceconfig.loglevel;
        // check device attributes
        if (!deviceconfig.id) {
            this.logger.error("missing attribute 'id' in device config")
            return
        }
        if (!deviceconfig.key) {
            this.logger.error("missing attribute 'key' in device config")
            return
        }
        if (!deviceconfig.topic) {
            this.logger.error("missing attribute 'topic' in device config")
            return
        }
        // define device vars   
        this.mqtt = mqtt
        this.topicname = deviceconfig.topic
        this.deviceid = deviceconfig.id
        this.devicekey = deviceconfig.key

        this.topic_get = `${deviceconfig.topic}/get`
        this.topic_set = `${deviceconfig.topic}/set`
        this.topic_state = `${deviceconfig.topic}/state`

        this.logger.debug(`use topic (all)      : ${this.topicname}`)
        this.logger.debug(`use topic (get)      : ${this.topic_get}`)
        this.logger.debug(`use topic (set)      : ${this.topic_set}`)
        this.logger.debug(`use topic (state)    : ${this.topic_state}`)

        this.intervall_refresh = deviceconfig.refresh ? deviceconfig.refresh * 1000 : 10000
        this.reconnect_timout = deviceconfig.reconnect ? deviceconfig.reconnect * 1000  : 5000

        this.logger.debug(`refresh timer   (ms) : ${this.intervall_refresh}`)
        this.logger.debug(`reconnect timer (ms) : ${this.reconnect_timout}`)

        this.lastdata = {}
        // call init function
        this.init()

        // connect to device
        try {
            this.device = new TuyaDevice({
                id: this.deviceid,
                key: this.devicekey,
                issueRefreshOnConnect: true,
            })
            this.reconnect()

        } catch (error) {
            this.logger.error(`Cannot connect to ${this.deviceid}`)
            this.logger.error(error.message)
        }

        this.device.on('connected', () => {
            this.connected = true
            this.logger.info(`Connected to tuya id: ${this.deviceid}, ip: ${this.device.device.ip}, prefix: ${this.topicname}`)
            this.startWatcher()
            // subscribe to topic
            this.mqtt.subscribe(this.topic_set, (err) => {
                if (err) {
                    this.logger.error(`Cannot subscribe to ${this.topic_set}`)
                } else {
                    this.logger.info(`Subscribed to ${this.topic_set}`)
                }
            });
            this.logger.debug(`publish ${this.totopic_statepic_get}: "online"`)
            this.mqtt.publish(this.topic_state, "online")
        });

        this.device.on('disconnected', () => {
            clearInterval(this.timer)
            this.logger.info(`Disconnected`)
            this.logger.debug(`publish ${this.topic_state}: "offline"`)
            this.mqtt.publish(this.topic_state, "offline")
            setTimeout(() => this.reconnect(), this.reconnect_timout)
            this.device.device.ip = undefined   // will error without? WHY???
        });

        this.device.on('error', error => {
            clearInterval(this.timer)
            this.logger.debug(`publish ${this.topic_state}: "offline"`)
            this.mqtt.publish(this.topic_state, "offline")
            setTimeout(() => this.reconnect(), this.reconnect_timout)
        });
    }

    reconnect() {
        this.device.find().then(el => {
            if (el) {
                this.device.connect()
            } else {
                this.logger.debug("Reconnect failed: device offline")
                setTimeout(() => this.reconnect(), this.reconnect_timout)
            }
        }).catch(el => {
            this.logger.debug("Reconnect failed: device timed out")
            setTimeout(() => this.reconnect(), this.reconnect_timout)
        })
    }

    disconnect() {
        this.connected = false
        clearInterval(this.timer)
        this.device.disconnect()
        this.logger.info(`Disconnected for id: ${this.deviceid}`)
        this.reconnect = () => {}   // prevent reconnect on exit
    }

}

module.exports = DeviceBase