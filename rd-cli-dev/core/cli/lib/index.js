'use strict';

module.exports = core;

const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync;
const commander = require('commander')
const pkg = require('../package.json')
const log = require('@rd-cli-dev/log')
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require('./const')

let args;
const program = new commander.Command()
async function core() {
    try{
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
        // checkInputArgs()
        checkEnv()
        await checkGlobalUpdate()
        registryCommand()
    }catch(e){
        log.error(e.message)
    }
}

// 命令注册
function registryCommand(){
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug','是否开启调试模式', false);
    
    // 开启debug模式
    program.on('option:debug', function(){
        if(program._optionValues.debug){
            process.env.LOG_LEVEL = 'verbose'
        }else{
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL;
        log.verbose('test')
    })
    // 对未知命令监听
    program.on('command:*', function(obj){
        console.log(obj)
        const availableCommands = program.commands.map(cmd => cmd.name())
        console.log(colors.red(`未知的命令：${obj[0]}`))
        if(availableCommands.length > 0){
            console.log(colors.red(`可用命令：${availableCommands.join(',')}`))
        }
    })
    if(program.args && program.args.length < 1){
        program.outputHelp()
        console.log()
    }
    program.parse(process.argv)
}
// 检查是否要全局更新
async function checkGlobalUpdate(){
    // 1.获取当前版本号和模块名
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    // 2.调用npm API,获取所有版本号
    const {getNpmSemverVersion } = require('@rd-cli-dev/get-npm-info')
    // 3.提取所有版本号，比对哪些版本号是大于当前版本号
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
    if(lastVersion && semver.gt(lastVersion,currentVersion)){
    // 4.获取最新版本号，提示用户更新到该版本
        log.warn(colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}, 最新版本：${lastVersion}，
            更新命令：npm install -g ${npmName}
        `))
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