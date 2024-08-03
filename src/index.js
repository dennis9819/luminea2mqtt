const log4js = require('log4js');
const logger = log4js.getLogger();
const loggerInit = log4js.getLogger("initializer");
logger.level = 'info';
loggerInit.level = 'info';

async function main() {
    const mqtt = require("mqtt");
    const YAML = require('yaml')
    const fs = require('fs')
    const Lineplug = require('./lineaplug')
    loggerInit.info("Read configfile")
    const file = fs.readFileSync('./config.yaml', 'utf8')
    const config = YAML.parse(file)




    const mqttserver = `mqtt://${config.mqtt.host}:${config.mqtt.port}`
    let client = mqtt.connect(mqttserver, {
        // Clean session
        connectTimeout: 1000,
        // Authentication
        username: config.mqtt.username,
        password: config.mqtt.password,
        clientId: "test",
        debug: true,
    });
    client.on('connect', function () {
        loggerInit.info(`Connected to ${mqttserver}`)
        // Subscribe to a topic
    })
    client.on("reconnect", () => {
        loggerInit.info("reconnecting!")
      })
    client.stream.on('error', (err) => {
        loggerInit.error('error', err);
        client.end()
    });

    let devices = []

    config.lineaplug.forEach((device) => {
        loggerInit.info(`Setup device ${device.id} Type: Lineplug`)
        const newdev = new Lineplug(device,client)
        devices.push(newdev)

    })

    

    process.on('SIGINT',() =>{
        for (let device of devices){
            device.disconnect()
        }
        process.exit(2);
    });

}

main()