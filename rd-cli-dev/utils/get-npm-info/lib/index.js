'use strict';

const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver')

function getNpmInfo(npmName, registry) {
    if(!npmName) return null;

    const registryUrl = registry || getDefaultRegistry()
    const npmInfoUrl = urlJoin(registryUrl, npmName);
    console.log(npmInfoUrl)
    return axios.get(npmInfoUrl).then(res => {
        if(res.status === 200){
            return res.data;
        }else{
            return null;
        }
    }).catch(err => {
        return Promise.reject(err)
    })
}   
// 获取默认的registry
function getDefaultRegistry(isOriginal = true){
    return isOriginal ? 'https://registry.npmjs.org': 'https://registry.npmj.taobao.org'
}

// 获取 npm versions
async function getNpmVersions(npmName, registry){
    const data = await getNpmInfo(npmName, registry)
    if(data){
       return Object.keys(data.versions)
    }else{
        return [];
    }
}
// 获取所有满足条件的版本号
function getNpmSemverVersions(baseVersion, versions){
    return versions.filter(version => 
      semver.satisfies(version, `^${baseVersion}`)    
    ).sort((a,b)=>{
        return semver.gt(b,a)
    })
}
// 获取最新版本
async function getNpmSemverVersion(baseVersion, npmName,registry){
    const versions = await getNpmVersions(npmName, registry)
    const newVersions = getNpmSemverVersions(baseVersion, versions)
    console.log('newVersions', newVersions)
    if(newVersions && newVersions.length > 0){
        return newVersions[0]
    }
}

// 获取最新版本
async function getNpmLatestVersion(npmName, registry){
    let versions = await getNpmVersions(npmName, registry);
    if(versions){
        versions = versions.sort((a,b)=>{
            return semver.gt(b,a)
        })
        return versions[0];
    }
    return null;
}
module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersion,
    getDefaultRegistry,
    getNpmLatestVersion
};