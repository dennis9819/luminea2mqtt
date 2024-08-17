/*
*   Device class definition for Luminea NX-445
*   https://www.luminea.info/Outdoor-WLAN-Steckdose-kompatibel-zu-Alexa-NX-4458-919.shtml
*
*   by Dennis Gunia (08/2024)
*/

const DeviceBase = require('../devicebase')
class Lineplug extends DeviceBase {

    init() {
        this.manufacturer = "Luminea"
        this.model = "NX-4458"
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

        this.deviceConfig = {
            switch: {
                switch: {
                    component: "switch",
                    command_topic: this.topic_set,
                    state_topic: this.topicname,
                    payload_on: "{\"value\": true}",
                    payload_off: "{\"value\": false}",
                    optimistic: false,
                    device_class: "outlet",
                    value_template: "{{ value_json.status }}",
                    state_off: false,
                    state_on: true,
                    enabled_by_default: true
                },
            },
            sensor: {
                voltage: {
                    state_topic: this.topicname,
                    device_class: "voltage",
                    state_class: "measurement",
                    value_template: "{{ value_json.voltage }}",
                    unit_of_measurement: "V",
                    enabled_by_default: true
                },
                current: {
                    state_topic: this.topicname,
                    device_class: "current",
                    state_class: "measurement",
                    value_template: "{{ value_json.current }}",
                    unit_of_measurement: "A",
                    enabled_by_default: true
                },
                power: {
                    state_topic: this.topicname,
                    device_class: "power",
                    state_class: "measurement",
                    value_template: "{{ value_json.power }}",
                    unit_of_measurement: "W",
                    enabled_by_default: true
                }
            }

        }
        this.pushAutodiscover(this.deviceConfig)
    }

    startWatcher() {
        // monitoring loop
        this.timer = setInterval(() => {
            this.device.refresh()
        }, this.intervall_refresh)
        this.logger.info(`Started watcher for id: ${this.deviceid}`)
        this.device.on('data', data => {
            this.logger.debug(`rx data: ${JSON.stringify(data)}`)
            this.processData(data)
        });
        this.device.on('dp-refresh', data => {
            this.logger.debug(`rx dp-refresh: ${JSON.stringify(data)}`)
            this.processData(data)
        });
        // monitor queue
        this.mqtt.on('message', (topic, message) => {
            // message is Buffer
            if (topic == this.topic_set) {  // verify that the topic is correct
                let payload = message.toString()
                this.logger.debug(`input ${topic}: ${payload}`)
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
            }
        })
    }

    stopWatcher() {
        clearInterval(this.timer)
    }

    processData(data) {
        if (!data.dps) {
            this.logger.warn(`Received unexpected data from device`)
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
            this.lastdata.work = dps['17'] / 100
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
            const msg = {
                value: this.lastdata.status
            }
            this.mqtt.publish(this.topic_get, JSON.stringify(msg))
            this.logger.debug(`publish ${this.topic_get}: ${JSON.stringify(msg)}`)
        }
        if (changed) {
            this.mqtt.publish(this.topicname, JSON.stringify(this.lastdata))
            this.logger.debug(`publish ${this.topicname}: ${JSON.stringify(this.lastdata)}`)

        }
    }

}

module.exports = Lineplug