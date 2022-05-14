'use strict';

const fse = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const semver = require('semver')
const userHome = require('user-home')
const Command = require('@rd-cli-dev/command')
const Package = require('@rd-cli-dev/package')
const log = require('@rd-cli-dev/log');
const { spinnerStart, sleep } = require('@rd-cli-dev/utils')

const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component'

class InitCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        log.verbose(this.projectName)
        log.verbose(this.force)
    }

    async exec(){
        try{
            // 1.准备阶段
            const projectInfo = await this.prepare();
            this.projectInfo = projectInfo;
            if(projectInfo){
                // 2.下载模版
                await this.downloadTemplate()
                // 3.安装模版
            }
            
        }catch(e){
            log.error(e.message)
        }
    }

    async downloadTemplate(){
        // 1.通过项目模版api获取项目模版信息
        // 1.1通过egg.js搭建一套后台系统
        // 1.2 通过npm存储模版信息
        // 1.3 将模版信息存储到mongodb数据库
        // 1.4 通过egg.js获取mongodb中的数据并且通过api返回
        const { projectTemplate } = this.projectInfo;
        const templateInfo = this.template.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome,'.rd-cli-dev', 'template') // /Users/liangchaofei/.rd-cli-dev/template
        const storeDir = path.resolve(userHome,'.rd-cli-dev', 'template','node_modules') // /Users/liangchaofei/.rd-cli-dev/template/node_modules
        const {npmName, version} = templateInfo;
        const templateNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version
        })
        if(! await templateNpm.exists()){
            const spinner = spinnerStart('正在下载模版...');
            await sleep();
            try{
                await templateNpm.install()
                log.success('下载模版成功')
            }catch(e){
                throw e;
            } finally{
                spinner.stop(true)
            }
        }else{
            const spinner = spinnerStart('正在更新模版...');
            await sleep();

            try{
                await templateNpm.update()
                log.success('更新模版成功')
            }catch(e){
                throw e;
            } finally{
                spinner.stop(true)
            }
        }
        console.log(targetPath,storeDir, npmName, version, templateNpm)
    }
    async prepare(){
        // 0.判断项目模版是否存在
        const template = await getProjectTemplate();
        if(!template || template.length === 0){
            throw new Error('项目模版不存在!')
        }
        this.template = template;
        console.log('template', template)
        // 1.判断当前目录是否为空
        const localPath = process.cwd() // 获取当前目录
        if(!this.isDirEmpty(localPath)){
            let ifContintue = false;
            if(!this.force){
                // 询问是否继续创建
                ifContintue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContintue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                })).ifContintue;

                if(!ifContintue){
                    return;
                }
            }
             // 2.是否启动强制更新
            if(ifContintue || this.force){
                // 给用户做二次确认
                const { confirmDelete} = inquirer.prompt({
                    type: 'confirm',
                    name: 'confirmDelete',
                    default: false,
                    message: '是否确认清空当前目录下的文件?'
                })
                if(confirmDelete){
                    // 清空当前目录
                    fse.emptyDirSync(localPath)
                }
            }
        }
        return this.getProjectInfo();
    }

    async getProjectInfo(){
        let projectInfo = {};
         // 1.选择创建项目或组件
         const {type} = await inquirer.prompt({
             type: 'list',
             name: 'type',
             message: '请选择初始化类型',
             default: TYPE_PROJECT,
             choices: [
                 {
                     name: '项目',
                     value: TYPE_PROJECT
                 },
                 {
                    name: '组件',
                    value: TYPE_COMPONENT
                }
             ]
         })

         console.log('msg', type)
         
         if(type === TYPE_PROJECT){
            // 2.获取项目的基本信息
            const project = await inquirer.prompt([
                {
                    type: 'input',
                    message: '请输入项目名称',
                    name: 'projectName',
                    default: '',
                    validate: function(v){
                        const done = this.async();
                        setTimeout(function(){
                                      // 1.输入的首字符必须是英文
                        // 2.尾字符必须是英文，数字，不能是字符
                        // 3.字符仅允许为：'-_'
                            if(!/^[a-zA-Z]+([-][a-zA-Z][A-Za-z0-9]*|[_][a-zA-Z][A-Za-z0-9]*|[a-zA-Z0-9])*$/.test(v)){
                                done('请输入合法的项目名称')
                                return;
                            }
                            done(null, true)
                        },0)
                    },
                    filter: function(v){
                        return v;
                    }
                },
                {
                    type: 'input',
                    message: '请输入项目版本号',
                    name: 'projectVersion',
                    default: '1.0.0',
                    validate: function(v){
                        const done = this.async();
                        setTimeout(function(){
                            if(!(!!semver.valid(v))){
                                done('请输入合法的版本号')
                                return;
                            }
                            done(null, true)
                        },0)
                    },
                    filter: function(v){
                        if(!!semver.valid(v)){
                            return semver.valid(v);
                        }else{
                            return v;
                        }
                     
                    }
                },
                {
                    type: 'list',
                    name: 'projectTemplate',
                    message: '请选择项目模版',
                    choices: this.createTemplateChoices()
                }
            ])
            projectInfo = {
                type,
                ...project
            }
         }else if(type === TYPE_COMPONENT){

         }
         return projectInfo;
    }

    isDirEmpty(localPath){
       
        let fileList = fs.readdirSync(localPath);
        // 文件过滤
        fileList = fileList.filter(file => {
            !file.startsWith('.') && ['node_modules'].indexOf(file) <0
        })
        return !fileList || fileList.length <= 0
    }

    createTemplateChoices(){
        return this.template.map(item => ({
            value: item.npmName,
            name: item.name
        }))
    }
}

function init(argv){
    return new InitCommand(argv)
}
module.exports = init;
module.exports.InitCommand = InitCommand;