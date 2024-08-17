
const TuyaDevice = require('tuyapi');
const log4js = require('log4js');
const autodiscover = require('./autodiscover')
const configldr = require('./config')

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
        // define device vars   
        this.deviceid = deviceconfig.id     // tuya device id
        this.devicekey = deviceconfig.key   // tuya device key

        this.mqtt = mqtt                    // pointer to mqtt client
        // name to be displayed. If not set, default to prefixed tuya client id
        this.friendlyname = deviceconfig.friendlyname ? deviceconfig.friendlyname : `luminea2mqtt_${this.deviceid}`
        // define queue names. Prefix is set globally. Prefer friendly name. If not set, use client id
        this.queue_name = deviceconfig.friendlyname ? deviceconfig.friendlyname : this.deviceid
        this.topicname = `${configldr.config.mqtt.prefix}/${this.queue_name}`
        this.topic_get = `${configldr.config.mqtt.prefix}/${this.queue_name}/get`
        this.topic_set = `${configldr.config.mqtt.prefix}/${this.queue_name}/set`
        this.topic_state = `${configldr.config.mqtt.prefix}/${this.queue_name}/state`

        this.logger.debug(`use topic (all)      : ${this.topicname}`)
        this.logger.debug(`use topic (get)      : ${this.topic_get}`)
        this.logger.debug(`use topic (set)      : ${this.topic_set}`)
        this.logger.debug(`use topic (state)    : ${this.topic_state}`)

        this.intervall_refresh = deviceconfig.refresh ? deviceconfig.refresh * 1000 : 10000
        this.reconnect_timout = deviceconfig.reconnect ? deviceconfig.reconnect * 1000 : 5000

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
            this.device.device.ip = undefined
            this.reconnect()

        } catch (error) {
            this.logger.error(`Cannot connect to ${this.deviceid}`)
            this.logger.error(error.message)
        }

        this.device.on('connected', () => {
            this.connected = true
            this.logger.info(`Connected to tuya id: ${this.deviceid}, ip: ${this.device.device.ip}, prefix: ${this.topicname}`)
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
            this.startWatcher()
        });

        this.device.on('disconnected', () => {
            this.stopWatcher()
            this.logger.info(`Disconnected`)
            this.logger.debug(`publish ${this.topic_state}: "offline"`)
            this.mqtt.publish(this.topic_state, "offline")
            setTimeout(() => this.reconnect(), this.reconnect_timout)
            this.device.device.ip = undefined   // will error without? WHY???
        });

        this.device.on('error', error => {
            this.stopWatcher()
            setTimeout(() => this.reconnect(), this.reconnect_timout)
        });
    }

    pushAutodiscover(config){
        if (configldr.config.autodiscover.enabled){
            autodiscover.publishDevice(this,config)
        }
    }

    reconnect() {
        this.device.find().then(el => {
            if (el) {
                this.device.connect().catch(el => {
                    this.logger.debug("Reconnect failed: device offline")
                })
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
        this.stopWatcher()
        this.device.disconnect()
        this.logger.info(`Disconnected for id: ${this.deviceid}`)
        this.reconnect = () => { }   // prevent reconnect on exit
    }

}

module.exports = DeviceBase