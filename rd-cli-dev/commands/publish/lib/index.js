'use strict';
const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const Command = require('@rd-cli-dev/command')
const log = require('@rd-cli-dev/log')
class PublishCommand extends Command{
    init(){
        // 处理参数
        console.log('init', this._argv)
    }

    async exec(){
       try{
        const startTime = new Date().getTime();
        // 1.初始化检查
        this.prepare()
        // 2.git flow自动化
        // 3.云构建和云发布
        const endTime = new Date().getTime();
        log.info('本次发布耗时：'+ Math.floor((endTime-startTime)/1000) + '秒')
       }catch(e){
           log.error(e.message);
           if(process.env.LOG_LEVEL === 'verbose'){
               console.log(e)
           }
       }
    }

    prepare(){
        // 1.确认项目是否是npm项目
        const projectPath = process.cwd();
        const pkgPath = path.resolve(projectPath, 'package.json');
        log.verbose('package.json',pkgPath);
        if(!fs.existsSync(pkgPath)){
            throw new Error('package.json不存在!')
        }
        // 2.确认是否包含name,version,build命令
        const pkg = fse.readJSONSync(pkgPath);
        const { name, version ,scripts} = pkg;
        log.verbose('name',name,version,scripts)
        if(!name || !version || !scripts || !scripts.build){
            throw new Error('package.json信息不全，请检查name,version,scripts(需提供build命令)')
        }
        this.projectInfo = {
            name,
            version,
            dir: projectPath
        }
    }
}


function publish(argv){
    return new PublishCommand(argv)
}


module.exports = publish;
module.exports.PublishCommand = PublishCommand;