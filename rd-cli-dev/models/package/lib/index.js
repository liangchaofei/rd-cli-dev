'use strict';
const path = require('path')
const pkgDir = require('pkg-dir').sync;
const pathExists = require('path-exists').sync;
const fse = require('fs-extra')
const npminstall = require('npminstall')
const { isObject } = require('@rd-cli-dev/utils')
const formatPath = require('@rd-cli-dev/format-path')
const { getDefaultRegistry, getNpmLatestVersion } = require('@rd-cli-dev/get-npm-info');
class Package{
    constructor(options){
        console.log('options',options)
        console.log(isObject(options))
        if(!options){
            throw new Error('Package类的options不能为空！')
        }
        if(!isObject(options)){
            throw new Error('Package类的options必须为对象！')
        }
        const { targetPath, storeDir, packageName, packageVersion } = options;
        this.targetPath = targetPath; // package的目标路径
        this.storeDir = storeDir; // package的缓存存储路径 
        this.packageName = packageName; // package的名称
        this.packageVersion = packageVersion; // package的版本
        this.cacheFilePathPrefix = this.packageName.replace('/','_'); // package的缓存目录前缀
    }

   async prepare(){
       if(this.storeDir && !pathExists(this.storeDir)){
           // 创建缓存路径
           fse.mkdirpSync(this.storeDir)
       }
        // 将latest转换为具体的最新版本号
        if(this.packageVersion === 'latest'){
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
    }

    get cacheFilePath(){
        return path.resolve(this.storeDir,`_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    getSpecificCacheFilePath(packageVersion){
        return path.resolve(this.storeDir,`_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
    }
    // 判断当前package是否存在
    async exists(){
        
        if(this.storeDir){
           await this.prepare()
           return pathExists(this.cacheFilePath)
        }else{
            return pathExists(this.targetPath)
        }
    }
    // 安装package
    async install(){
        await this.prepare()
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs:[
                {
                    name: this.packageName,
                    version: this.packageVersion
                }
            ]
        })
    }
    // 更新package
    async update(){
        await this.prepare();
        // 1. 获取最新的npm模块版本号
        const latestPackageVersion = await getNpmLatestVersion(this.packageName)
        // 2.查询最新版本号对应的路径是否存在
        const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
        // 3. 如果不存在，则直接安装最新版本
        if(!pathExists(latestFilePath)){
            await npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs:[
                    {
                        name: this.packageName,
                        version: latestPackageVersion
                    }
                ]
            })
            this.packageVersion = latestPackageVersion
        }else{
            this.packageVersion = latestPackageVersion
        }
    }

    // 获取入口文件的路径
    getRootFilePath(){
        function _getRootFile(targetPath){
            // 1.获取package.json所在的目录
            const dir = pkgDir(targetPath);
                    
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
        if(this.storeDir){
            return _getRootFile(this.cacheFilePath)
        }else{
            return _getRootFile(this.targetPath)
        }
      
    }
}

module.exports = Package;


