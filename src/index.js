const log4js = require('log4js');
const logger = log4js.getLogger();
const loggerInit = log4js.getLogger("initializer");
const { Command } = require('commander');
const program = new Command();

logger.level = 'info';
loggerInit.level = 'info';

program
    .name('luminea2mqtt')
    .version('1.0.0')
    .option('-c, --config <value>', 'Path to configfile', './config.yaml')
    .parse(process.argv);

async function main() {
    const mqtt = require("mqtt");
    const YAML = require('yaml')
    const fs = require('fs')
    
    loggerInit.info("Read configfile")

    const options = program.opts();
    loggerInit.info(`User config from ${options.config}`)
    let config = {}
    try {
        const file = fs.readFileSync(options.config, 'utf8')
        config = YAML.parse(file)
    } catch (error) {
        loggerInit.error(`error reading config: ${error.message}`)
        process.exit(10)
    }



    const mqttserver = `mqtt://${config.mqtt.host}:${config.mqtt.port}`
    let client = mqtt.connect(mqttserver, {
        // Clean session
        connectTimeout: 1000,
        // Authentication
        username: config.mqtt.username,
        password: config.mqtt.password,
        clientId: config.mqtt.clientid,
        debug: true,
    });
    loggerInit.info(`Connect to ${mqttserver}, user: ${config.mqtt.username}, clientid: ${config.mqtt.clientid}`)
    client.on('connect', function () {
        loggerInit.info(`Connected to ${mqttserver}`)
        // Subscribe to a topic
    })
    client.on("reconnect", () => {
        loggerInit.info("reconnecting!")
    })
    client.stream.on('error', (err) => {
        loggerInit.error('error')
        loggerInit.error(err)
        client.end()
    });

    let devices = []

    if (config.devices){
        config.devices.forEach((device) => {
            const deviceClassFile = `./modules/${device.type}`
            loggerInit.info(`Setup device ${device.id}, type: ${device.type}, class:'${deviceClassFile}.js'`)
            try {
                const DeviceClass = require(deviceClassFile)
                const newdev = new DeviceClass(device, client)
                devices.push(newdev)
            } catch (error) {
                loggerInit.error(`Error initializing device class ${deviceClassFile}`);
                loggerInit.error(error.message);
            }
            
        })
    }else{
        loggerInit.error(`Missing 'devices' in config.`)
        process.exit(10)
    }

    process.on('SIGINT', () => {
        for (let device of devices) {
            device.disconnect()
        }
        process.exit(2);
    });

}

main()