'use strict';

module.exports = core;

const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync;
const pkg = require('../package.json')
const log = require('@rd-cli-dev/log')
const { LOWEST_NODE_VERSION } = require('./const')
function core() {
    try{
        checkPkgVersion()
        checkNodeVersion()
        checkRoot()
        checkUserHome()
    }catch(e){
        log.error(e.message)
    }
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