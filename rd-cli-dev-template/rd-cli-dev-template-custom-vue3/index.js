const fse = require('fs-extra')
const inquirer = require('inquirer')
const glob = require('glob')
const path = require('path')
const ejs = require('ejs')

 // ejs渲染
 async function ejsRender(options){
    log.verbose('options', options)
    const { targetPath, data } =options;
    const dir = targetPath;
    const projectInfo = data;
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

async function install(options){
    const projectPromt = [];
    const descriptionPromit =  {
        type: 'input',
        message: '请输入项目描述',
        name: 'description',
        default: '',
        validate: function(v){
            const done = this.async();
            setTimeout(function(){
                if(!v){
                    done('请输入项目描述信息')
                    return;
                }
                done(null, true)
            },0)
        },
    }
    console.log('projectPromt', projectPromt)
    projectPromt.push(descriptionPromit)
    const projectInfo = await inquirer.prompt(projectPromt)
    options.projectInfo.description = projectInfo.description
        try{
            const { sourcePath, targetPath,data } = options;
            fse.ensureDirSync(templatePath) // 确保目录存在
            fse.ensureDirSync(targetPath)
            fse.copySync(templatePath, targetPath) // 拷贝
            const templateIgnore = eval(options.templateInfo.ignore) || []
            const ignore = ['**/node_modules/**',...templateIgnore]
            await this.ejsRender({ignore, targetPath,data: options.projectInfo})
            // const {installCommand,startCommand} = this.templateInfo;
            // // 安装依赖
            // await this.execCommand(installCommand, '依赖安装失败!')
            // // 启动命令执行
            // await this.execCommand(startCommand, '启动执行命令失败!')
        }catch(e){
            throw e;
        }

}

module.exports = install;