'use strict';
const log = require('@rd-cli-dev/log');

module.exports = exec;
const Package = require('@rd-cli-dev/package')

const SETTINGS = {
    init: '@rd-cli-dev/init'
}
function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose('targetPath', targetPath)
    log.verbose('homePath',homePath)

    const cmdObj = arguments[arguments.length -1];
    const cmdName = cmdObj.name(); // init
    const packageName  = SETTINGS[cmdName] // package name

    const packageVersion = 'latest';

    if(!targetPath){
        targetPath = ''; // 生成缓存路径
    }
    const pkg = new Package({
        targetPath,
        // storePath: '',
        packageName,
        packageVersion 
    });
    console.log('pkg',pkg)
    console.log('patha',process.env.CLI_TARGET_PATH)
}
