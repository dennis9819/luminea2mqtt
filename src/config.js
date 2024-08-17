const log4js = require('log4js');
const YAML = require('yaml')
const fs = require('fs')

const loggerInit = log4js.getLogger("initializer");
loggerInit.level = 'info';

module.exports.config = {}
module.exports.loadConfig = async (configfile) => {
    loggerInit.info(`Read configfile ${configfile}`)
    try {
        const file = fs.readFileSync(configfile, 'utf8')
        module.exports.config = YAML.parse(file)
    } catch (error) {
        loggerInit.error(`error reading config: ${error.message}`)
        process.exit(10)
    }
}

module.exports.config