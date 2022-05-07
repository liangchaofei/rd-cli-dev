'use strict';
const path = require('path')
const pkgDir = require('pkg-dir').sync;
const { isObject } = require('@rd-cli-dev/utils')
const formatPath = require('@rd-cli-dev/format-path')
class Package{
    constructor(options){
        if(!options){
            throw new Error('Package类的options不能为空！')
        }
        if(!isObject(options)){
            throw new Error('Package类的options必须为对象！')
        }
        const { targetPath, storePath, packageName, packageVersion } = options;
        this.targetPath = targetPath; // package的目标路径
        // this.storePath = storePath; // package的缓存存储路径 
        this.packageName = packageName; // package的名称
        this.packageVersion = packageVersion; // package的版本
    }

    // 判断当前package是否存在
    exists(){}
    // 安装package
    install(){

    }
    // 更新package
    update(){}

    // 获取入口文件的路径
    getRootFilePath(){
        // 1.获取package.json所在的目录
        const dir = pkgDir(this.targetPath);
        
        if(dir){
            // 2.读取package.json
            const pkgFile = require(path.resolve(dir, 'package.json'))
            // 3.寻找main/lib
            if(pkgFile && pkgFile.main){
                // 4.路径的兼容(maxOs/windows)
                return formatPath(path.resolve(dir,pkgFile.main)) // command 命令最后的入口文件地址
            }
            
        }
     
        return null;
    }
}

module.exports = Package;


