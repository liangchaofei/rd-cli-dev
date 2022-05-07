'use strict';
const path = require('path')
const log = require('@rd-cli-dev/log');

module.exports = exec;
const Package = require('@rd-cli-dev/package')

const SETTINGS = {
    init: '@rd-cli-dev/init'
}

const CACHE_DIR = 'dependencies'
async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    let storeDir = '';
    let pkg;
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose('targetPath', targetPath)
    log.verbose('homePath',homePath)

    const cmdObj = arguments[arguments.length -1];
    const cmdName = cmdObj.name(); // init
    const packageName  = SETTINGS[cmdName] // package name

    const packageVersion = 'latest';

    if(!targetPath){
        targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
        storeDir = path.resolve(targetPath, 'node_modules')
        log.verbose('targetPath',targetPath)
        log.verbose('storeDir', storeDir)
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion 
        });
        if(pkg.exists()){
            // 更新package
        }else{
            // 安装package
           await pkg.install()
        }
    }else{
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion 
        });
    }
    const rootFile = pkg.getRootFilePath();
    if(rootFile){
        require(rootFile).apply(null,arguments)
    }
}
