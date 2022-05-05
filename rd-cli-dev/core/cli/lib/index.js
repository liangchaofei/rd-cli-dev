'use strict';

module.exports = core;

const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync;
const pkg = require('../package.json')
const log = require('@rd-cli-dev/log')
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require('./const')

let args, config;

function core() {
    try{
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
        checkInputArgs()
        checkEnv()
        log.verbose('debug', 'test debug log')
    }catch(e){
        log.error(e.message)
    }
}

// 检查环境变量
function checkEnv(){
    const dotenv = require('dotenv');
    const dotenvPath = path.resolve(userHome,'.env');
    if(pathExists(dotenvPath)){
        dotenv.config({
            path: dotenvPath
        });
    }
    createDefaultConfig()
    log.verbose('环境变量', process.env.CLI_HOME_PATH)
}
// 如果没有环境变量。默认配置
function createDefaultConfig(){
    const cliConfig = {
        home: userHome
    }
    if(process.env.CLI_HOME){
        cliConfig['cliHome'] = path.join(userHome,process.env.CLI_HOME)
    }else{
        cliConfig['cliHome'] = path.join(userHome,DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome
}
// 检查入惨
function checkInputArgs(){
    const minimst = require('minimist')
    args = minimst(process.argv.slice(2))
    console.log(args)
    checArgs()
}
// 检查参数
function checArgs(){
    if(args.debug){
        process.env.LOG_LEVEL = 'verbose'
    }else{
        process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL; // 后置修改log level
}
// 检查用户主目录
function checkUserHome(){
    if(!userHome || !pathExists(userHome)){
        throw new Error(colors.red('当前登录用户主目录不存在'))
    }
}
// 检查root账户
function checkRoot(){
    const checkRoot = require('root-check');
    checkRoot()
}

// 检查node版本
function checkNodeVersion(){
    // 1.获取当前node版本
    const currentVersion = process.version;
    // 2.获取最低版本
    const lowestVersion = LOWEST_NODE_VERSION;
    // 3.比对，使用semver库
    if(!semver.gte(currentVersion, lowestVersion)){
        throw new Error(colors.red(`rd-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`))
    }
}   

// 检查版本号
function checkPkgVersion(){
   log.info('cli', pkg.version)
}