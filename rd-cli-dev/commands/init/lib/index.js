'use strict';

const fse = require('fs-extra')
const path = require('path')
const ejs = require('ejs')
const glob = require('glob')
const inquirer = require('inquirer')
const semver = require('semver')
const userHome = require('user-home')
const Command = require('@rd-cli-dev/command')
const Package = require('@rd-cli-dev/package')
const log = require('@rd-cli-dev/log');
const { spinnerStart, sleep, execAsync } = require('@rd-cli-dev/utils')

const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component'

const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';

const COMPONENT_FILE = '.componentrc'
const WHITE_COMMAND = ['npm', 'cnpm']

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
                await this.installTemplate()
            }
            
        }catch(e){
            if(process.env.LOG_LEVEL=== 'verbose'){
                log.error(e.message)
            }
        }
    }

    
    async installTemplate(){
        if(this.templateInfo){
            if(!this.templateInfo.type){
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
            }
            if(this.templateInfo.type === TEMPLATE_TYPE_NORMAL){
                // 标准安装
                await this.installNormalTemplate()
            }else if(this.templateInfo.type === TEMPLATE_TYPE_CUSTOM){
                // 自定义安装
                await this.installCustomTemplate()
            }else{
                throw new Error('无法识别项目模版类型!')
            }
        }else{
            throw new Error('项目模版信息不存在!')
        }
    }

    // 白名单检查命令
    checkCommand(cmd){
        if(WHITE_COMMAND.includes(cmd)){
            return cmd;
        }
        return null;
    }
    // 命令执行封装
    async execCommand(command, errMsg){
        let ret;
        if(command){
            const cmdArray = command.split(' ');
            const cmd = this.checkCommand(cmdArray[0]);
            if(!cmd){
                throw new Error('命令不存在! 命令：' + command)
            }
            const args = cmdArray.slice(1)
            ret = await execAsync(cmd, args,{
                stdio: 'inherit',
                cwd: process.cwd()
            })
            log.verbose('ret',ret)
        }

        if(ret !== 0){
            throw new Error(errMsg)
        }
        return ret;
    }

    // ejs渲染
    async ejsRender(options){
        log.verbose('options', options)
        const dir = process.cwd();
        const projectInfo = this.projectInfo;
        console.log('ffff', this.projectInfo)
        return new Promise((resolve,reject)=> {
            glob('**',{
                cwd: dir,
                ignore: options.ignore || '',
                nodir: true
            },(err,files) => {
                if(err){
                    reject(err)
                }
                Promise.all(files.map(file => {
                    const filePath = path.join(dir, file);
                    console.log('filePath', filePath)
                    return new Promise((resolve1, reject1) => {
                        ejs.renderFile(filePath, projectInfo,{}, (err, result) => {
                            if(err){
                                reject1(err)
                            }else{
                                fse.writeFileSync(filePath, result)
                                resolve1(result)
                                log.success('写入成功')
                            }
                        })
                    })
                })).then(() => {
                    resolve()
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }
    // 标准安装
    async installNormalTemplate(){
        console.log('安装标准模版')
        // 拷贝模版代码到当前目录
        let spinner = spinnerStart('正在安装模版...')
        await sleep()
        const targetPath = process.cwd(); // 当前目录
        try{
            const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template') // 项目模版代码缓存目录
            
            fse.ensureDirSync(templatePath) // 确保目录存在
            fse.ensureDirSync(targetPath)
            fse.copySync(templatePath, targetPath) // 拷贝
        }catch(e){
            throw e;
        } finally {
            spinner.stop(true)
            log.success('模版安装成功')
        }
        const templateIgnore = eval(this.templateInfo.ignore) || []
        const ignore = ['**/node_modules/**',...templateIgnore]
        await this.ejsRender({ignore})
        // 如果 是组件，则生成组件配置文件
        await this.createComponentFile(targetPath)
        const {installCommand,startCommand} = this.templateInfo;
        // 安装依赖
        await this.execCommand(installCommand, '依赖安装失败!')
        // 启动命令执行
        await this.execCommand(startCommand, '启动执行命令失败!')
    }

    async createComponentFile(targetPath){
        const templateInfo = this.templateInfo;
        const projectInfo = this.projectInfo;
        if(templateInfo.tag.includes(TYPE_COMPONENT)){
            const componentData = {
                ...projectInfo,
                buildPath:templateInfo.buildPath,
                examplePath: templateInfo.examplePath,
                npmName: templateInfo.npmName,
                npmVersion: templateInfo.npmVersion
            }

            const componentFile = path.resolve(targetPath, COMPONENT_FILE)
            fs.writeFileSync(componentFile, JSON.stringify(componentData))
        }
    }
    // 自定义安装
    async installCustomTemplate() {
        // 查询自定义模板的入口文件
        if (await this.templateNpm.exists()) {
          const rootFile = this.templateNpm.getRootFilePath();
          if (fs.existsSync(rootFile)) {
            log.notice('开始执行自定义模板');
            const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
            const options = {
              templateInfo: this.templateInfo,
              projectInfo: this.projectInfo,
              sourcePath: templatePath,
              targetPath: process.cwd(),
            };
            const code = `require('${rootFile}')(${JSON.stringify(options)})`;
            log.verbose('code', code);
            await execAsync('node', ['-e', code], { stdio: 'inherit', cwd: process.cwd() });
            log.success('自定义模板安装成功');
          } else {
            throw new Error('自定义模板入口文件不存在！');
          }
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
        this.templateInfo = templateInfo;
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
               
            }catch(e){
                throw e;
            } finally{
                spinner.stop(true)
                if(await templateNpm.exists()){
                    log.success('下载模版成功')
                    this.templateNpm = templateNpm;
                }
            }
        }else{
            const spinner = spinnerStart('正在更新模版...');
            await sleep();

            try{
                await templateNpm.update()
            }catch(e){
                throw e;
            } finally{
                spinner.stop(true)
                if(await templateNpm.exists()){
                    log.success('更新模版成功')
                    this.templateNpm = templateNpm;
                }
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
        // 1.判断当前目录是否为空
        const localPath = process.cwd() // 获取当前目录
        log.verbose('aaa', !this.isDirEmpty(localPath))
        if (!this.isDirEmpty(localPath)) {
            let ifContinue = false;
            if (!this.force) {
              // 询问是否继续创建
              ifContinue = (await inquirer.prompt({
                type: 'confirm',
                name: 'ifContinue',
                default: false,
                message: '当前文件夹不为空，是否继续创建项目？',
              })).ifContinue;
              if (!ifContinue) {
                return;
              }
            }
            // 2. 是否启动强制更新
            if (ifContinue || this.force) {
              // 给用户做二次确认
              const { confirmDelete } = await inquirer.prompt({
                type: 'confirm',
                name: 'confirmDelete',
                default: false,
                message: '是否确认清空当前目录下的文件？',
              });
              if (confirmDelete) {
                // 清空当前目录
                fse.emptyDirSync(localPath);
              }
            }
          }
        return this.getProjectInfo();
    }

    async getProjectInfo(){

        function isValidName(v){
            return /^(@[a-zA-Z0-9-_]+\/)?[a-zA-Z]+([-][a-zA-Z][A-Za-z0-9]*|[_][a-zA-Z][A-Za-z0-9]*|[a-zA-Z0-9])*$/.test(v)
        }
        let projectInfo = {};
        let isProjectNameValid = false;
        if(isValidName(this.projectName)){
            isProjectNameValid = true;
            projectInfo.projectName = this.projectName
        }
        
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
         this.template = this.template.filter(template => {
             return template.tag.includes(type)
         })
         const title = type === TYPE_PROJECT ? '项目': '组件'
         const projectNamePrompt = {
            type: 'input',
            message: `请输入${title}名称`,
            name: 'projectName',
            default: '',
            validate: function(v){
                const done = this.async();
                setTimeout(function(){
                              // 1.输入的首字符必须是英文
                // 2.尾字符必须是英文，数字，不能是字符
                // 3.字符仅允许为：'-_'
                    if(!isValidName(v)){
                        done(`请输入合法的${title}名称`)
                        return;
                    }
                    done(null, true)
                },0)
            },
            filter: function(v){
                return v;
            }
        }
        let projectPromt = [];
        if(!isProjectNameValid){
            projectPromt.push(projectNamePrompt)
        }
        projectPromt.push(  
        {
            type: 'input',
            message: `请输入${title}版本号`,
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
            message: `请选择${title}模版`,
            choices: this.createTemplateChoices()
        })
        console.log('type', type, TYPE_COMPONENT)
         if(type === TYPE_PROJECT){
            // 2.获取项目的基本信息
            const project = await inquirer.prompt(projectPromt)
            projectInfo = {
                ...projectInfo,
                type,
                ...project
            }
         }else if(type === TYPE_COMPONENT){
            const descriptionPromit =  {
                type: 'input',
                message: '请输入组件描述',
                name: 'componentDescription',
                default: '',
                validate: function(v){
                    const done = this.async();
                    setTimeout(function(){
                        if(!v){
                            done('请输入组件描述信息')
                            return;
                        }
                        done(null, true)
                    },0)
                },
            }
            console.log('projectPromt', projectPromt)
            projectPromt.push(descriptionPromit)
            console.log('aa', projectPromt)
             // 2.获取组件的基本信息
             const component = await inquirer.prompt(projectPromt)
             projectInfo = {
                 ...projectInfo,
                 type,
                 ...component
             }
         }
         console.log('projectInfo', projectInfo)
         // 生成classname
        if (projectInfo.projectName) {
            projectInfo.name = projectInfo.projectName;
            projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '');
        }
        if (projectInfo.projectVersion) {
            projectInfo.version = projectInfo.projectVersion;
        }
        if (projectInfo.componentDescription) {
            projectInfo.description = projectInfo.componentDescription;
        }
         return projectInfo;
    }

    isDirEmpty(localPath) {
        let fileList = fs.readdirSync(localPath);
        // 文件过滤的逻辑
        fileList = fileList.filter(file => (
          !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ));
        return !fileList || fileList.length <= 0;
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