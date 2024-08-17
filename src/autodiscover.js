const log4js = require('log4js');
const logger = log4js.getLogger("autodiscover");
const configldr = require('./config')

logger.level = 'debug';
let discover_mqtt = undefined

module.exports.setup = async (mqtt) => {
    discover_mqtt = mqtt
    if (!configldr.config.autodiscover.enabled) {
        logger.info(`Autodiscover disabled`)
    } else {
        const mqtt_prefix = `${configldr.config.autodiscover.topic}`
        logger.info(`Setting up autodiscover with prefix ${mqtt_prefix}`)
    }
}

module.exports.publishDevice = async (deviceid,device_name,config) => {
    // deviceid: unique device id, ideally based on the tuya device id
    // device_name: firendlyname displayed in the gui
    // config: device config

    let unique_identifier = `luminea2mqtt_${deviceid}`
    Object.keys(config).forEach(component =>{
        
        let items = config[component]
        Object.keys(items).forEach(item =>{
            let mqtt_topic = `${configldr.config.autodiscover.topic}/${component}/${deviceid}/${item}/config`
            let temp_data = JSON.parse(JSON.stringify(config[component][item]))
            temp_data.unique_id = `${deviceid}_${item}_luminea2mqtt`
            temp_data.object_id = `${device_name}_${item}`
            temp_data.origin = {
                name : "luminea2mqtt",
                support_url: "https://github.com/dennis9819/luminea2mqtt"
            }
            temp_data.device = {
                identifiers : [
                    unique_identifier
                ],
                name: device_name,
                manufacturer: "dennisgunia",
                model: "Unknown",
    
                //via_device: `luminea2mqtt_bridge_${configldr.config.mqtt.devenv1}`
            }

            const payload_str = JSON.stringify(temp_data)
            logger.debug(`publish ${mqtt_topic}: ${payload_str}`)
            discover_mqtt.publish(mqtt_topic, payload_str)
        })
   
        

 

    })
        
}

