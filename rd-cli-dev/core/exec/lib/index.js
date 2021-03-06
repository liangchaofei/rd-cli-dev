'use strict';
const path = require('path')
const log = require('@rd-cli-dev/log');
const Package = require('@rd-cli-dev/package')
const { exec: spawn } = require('@rd-cli-dev/utils')




const SETTINGS = {
    init: '@rd-cli-dev/init',
    publish: '@rd-cli-dev/publish'
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
    console.log('targetPath', targetPath)
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
        console.log('pkg',pkg)
        if(await pkg.exists()){
            // 更新package
            await pkg.update()
        }else{
            // 安装package
           await pkg.install()
        }
    }else{
        console.log('qqq')
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion 
        });
        console.log('pppp',pkg)
    }
    console.log('pkg',pkg)
    const rootFile = pkg && pkg.getRootFilePath();
    if(rootFile){
        try{
            // 在当前进程中调用
            // require(rootFile).call(null,Array.from(arguments))
            // 在node子进程中调用
            const args = Array.from(arguments)
            const cmd = args[args.length-1]
            const o = Object.create(null)
            Object.keys(cmd).forEach(key => {
                if(cmd.hasOwnProperty(key) && !key.startsWith('_') && key!=='parent'){
                    o[key] = cmd[key]
                }
            })
            args[args.length-1] = o;
            const code = `require('${rootFile}').call(null,${JSON.stringify(args)})`
            const child = spawn('node',['-e', code],{
                cwd: process.cwd(),
                stdio: 'inherit'
            })
            child.on('error',e=>{
                log.error(e.message)
                process.exit(1)
            })
            child.on('exit',e=>{
                log.verbose('命令执行成功' + e)
                process.exit(e)
            })
        }catch(err){
            log.error(err.message)
        }
    }
}

module.exports = exec;