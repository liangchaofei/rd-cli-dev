'use strict';
const semver = require('semver')
const colors = require('colors/safe')
const log = require('@rd-cli-dev/log');
const { isObject } = require('@rd-cli-dev/utils');

const LOWEST_NODE_VERSION = '12.0.0';
class Command{
    constructor(argv){
        if(!argv){
            throw new Error('参数不能为空')
        }
        if(!Array.isArray(argv)){
            throw new Error('参数必须是数组')
        }
        if(argv.length < 1){
            throw new Error('参数列表为空')
        }
        this._argv = argv;
        let runner = new Promise((resolve,reject) => {
            let chain = Promise.resolve()
            chain = chain.then(() => this.checkNodeVersion())
            chain = chain.then(() => this.initArgs())
            chain = chain.then(() => this.init())
            chain = chain.then(() => this.exec())
            chain.catch(err => { 
                log.error(err.message)
            })
        })
    }

    initArgs(){
        this._cmd = this._argv[this._argv.length-1]
        this._argv = this._argv.slice(0,this._argv.length-1)
    }
    checkNodeVersion(){
        // 1.获取当前node版本
        const currentVersion = process.version;
        // 2.获取最低版本
        const lowestVersion = LOWEST_NODE_VERSION;
        // 3.比对，使用semver库
        if(!semver.gte(currentVersion, lowestVersion)){
            throw new Error(colors.red(`rd-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`))
        }
    } 
    init(){
        throw new Error('init必须实现')
    }

    exec(){
        throw new Error('exec必须实现')
    }
}


module.exports = Command;