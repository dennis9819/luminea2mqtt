const log4js = require('log4js');
const logger = log4js.getLogger();
const loggerInit = log4js.getLogger("initializer");
const { Command } = require('commander');
const program = new Command();
const configldr = require('./config')
const autodiscover = require('./autodiscover')
const mqtt = require("mqtt");
const DeviceManager = require('./devicemanager')

logger.level = 'info';
loggerInit.level = 'info';


program
    .name('luminea2mqtt')
    .version('1.0.0')
    .option('-c, --config <value>', 'Path to configfile', './config.yaml')
    .parse(process.argv);

async function main() {
    const options = program.opts();
    loggerInit.info(`User config from ${options.config}`)

    configldr.loadConfig(options.config)

    let deviceManager = new DeviceManager()
    
    const mqttserver = `mqtt://${configldr.config.mqtt.host}:${configldr.config.mqtt.port}`
    let client = mqtt.connect(mqttserver, {
        // Clean session
        connectTimeout: 1000,
        // Authentication
        username: configldr.config.mqtt.username,
        password: configldr.config.mqtt.password,
        clientId: configldr.config.mqtt.clientid,
        debug: true,
    });

    loggerInit.info(`Connect to ${mqttserver}, user: ${configldr.config.mqtt.username}, clientid: ${configldr.config.mqtt.clientid}`)
    autodiscover.setup(client)
    deviceManager.setClient(client)

    client.on('connect', function () {
        loggerInit.info(`Connected to ${mqttserver}`)
        deviceManager.connect()
    })
    client.on("reconnect", () => {
        loggerInit.info(`Try reconnect to ${mqttserver}`)
    })
    client.stream.on('error', (err) => {
        loggerInit.error('error')
        loggerInit.error(err)
        client.end()
    });

    process.on('SIGINT', () => {
        deviceManager.disconnect()
        process.exit(2);
    });

}

main()