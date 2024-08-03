const TuyaDevice = require('tuyapi');
const log4js = require('log4js');

class Lineplug {
    constructor(deviceconfig, mqtt) {
        const loggername = deviceconfig.id ? deviceconfig.id : "undef device"
        this.logger = log4js.getLogger(loggername);

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

        this.mqtt = mqtt
        this.topicname = deviceconfig.topic
        this.deviceid = deviceconfig.id
        this.topic_get = `${deviceconfig.topic}/get`
        this.topic_set = `${deviceconfig.topic}/set`
        this.intervall = deviceconfig.refresh ? deviceconfig.refresh * 1000 : 10000

        this.lastdata = {
            voltage: 0,
            current: 0,
            power: 0,
            work: 0,
            status: false,
            cycle_time: 0,
            countdown_1: 0,
            random_time: 0,
        }
        try {
            this.device = new TuyaDevice({
                //ip: "10.110.0.126",
                id: deviceconfig.id,
                key: deviceconfig.key,
                issueRefreshOnConnect: true,
                ip: deviceconfig.ip,
            })
            this.device.find().then(el => {
                this.device.connect().then(el => {
                    this.logger.info(`Connected to tuya id: ${this.deviceid} @ ${this.topicname}`)
                    this.startWatcher()
                    this.mqtt.subscribe(this.topic_set, (err) => {
                        if (err) {
                            this.logger.error(`Cannot subscribe to ${this.topic_set}`)
                        } else {
                            this.logger.info(`Subscribed to ${this.topic_set}`)
                        }
                    });
                }).catch(error => {
                    this.logger.error(`Cannot connect to ${this.deviceid}`)
                    this.logger.error(error.message)
                });
            })
        } catch (error) {
            this.logger.error(`Cannot connect to ${this.deviceid}`)
            this.logger.error(error.message)
        }
    }

    startWatcher() {
        // monitoring loop
        this.timer = setInterval(() => this.device.refresh(), 10000)
        this.logger.info(`Started watcher for id: ${this.deviceid}`)
        this.device.on('data', data => {
            this.processData(data)
        });
        this.device.on('dp-refresh', data => {
            this.processData(data)
        });
        // monitor queue
        this.mqtt.on('message', (topic, message) => {
            // message is Buffer
            //if (topic == this.topicname){
            let payload = message.toString()

            try {
                const jsonpayload = JSON.parse(payload)
                if (jsonpayload.value != undefined) {
                    this.logger.info(`Change status to ${jsonpayload.value}`)
                    this.device.set({ set: jsonpayload.value }).then(el => {
                        this.device.refresh()
                    })
                }
            } catch (error) {
                this.logger.warn(`Error parsing malformatted JSON message via mqtt`)
                this.logger.trace(payload)
                this.logger.trace(error)
            }
            // }

        })
    }

    processData(data) {
        //console.log(data)
        if (!data.dps) {
            return
        }

        const dps = data.dps
        const updatedValues = Object.keys(dps)
        let changed = false
        if (updatedValues.includes('20')) {
            this.lastdata.voltage = dps['20'] / 10
            changed = true
        }
        if (updatedValues.includes('18')) {
            this.lastdata.current = dps['18'] / 1000
            changed = true
        }
        if (updatedValues.includes('19')) {
            this.lastdata.power = dps['19'] / 10
            changed = true
        }
        if (updatedValues.includes('17')) {
            this.lastdata.power = dps['17'] / 100
            changed = true
        }

        if (updatedValues.includes('9')) {
            this.lastdata.countdown_1 = dps['9'] 
            changed = true
        }
        if (updatedValues.includes('41')) {
            this.lastdata.cycle_time = dps['41']
            changed = true
        }
        if (updatedValues.includes('42')) {
            this.lastdata.random_time = dps['42']
            changed = true
        }

        if (updatedValues.includes('1')) {
            this.lastdata.status = dps['1']
            changed = true
            this.mqtt.publish(this.topic_get, JSON.stringify({
                value: this.lastdata.status
            }))
        }
        if (changed) {
            this.mqtt.publish(this.topicname, JSON.stringify(this.lastdata))
        }

    }

    disconnect() {
        clearInterval(this.timer)
        this.device.disconnect()
        this.logger.info(`Disconnected for id: ${this.deviceid}`)
    }
}

module.exports = Lineplug