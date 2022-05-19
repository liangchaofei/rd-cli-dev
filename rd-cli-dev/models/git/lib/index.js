'use strict';

const path = require('path');
const fse = require('fs-extra')
const fs = require('fs')
const inquirer = require('inquirer')
const userHome = require('user-home')
const terminalLink = require('terminal-link')
const SimpleGit = require('simple-git')
const log = require('@rd-cli-dev/log')
const { readFile, writeFile } = require('@rd-cli-dev/utils');
const Github = require('./Github');
const Gitee = require('./Gitee');

const GITHUB = 'github';
const GITEE = 'gitee';

const DEFAULT_CLI_HOME = '.rd-cli';
const GIT_SERVER_FILE = '.git_server';
const GIT_TOKEN_FILE = '.git_token';
const GIT_ROOT_DIR = '.git';
const GIT_OWN_FILE = '.git_own';
const GIT_LOGIN_FILE = '.git_login';
const REPO_OWNER_USER = 'user';
const REPO_OWNER_ORG = 'org'
const GIT_SERVER_TYPE = [
    {
        name: 'Github',
        value: GITHUB
    },
    {
        name: 'Gitee',
        value: GITEE
    }
]
const GIT_OWN_TYPE = [
    {
        name: '个人',
        value: REPO_OWNER_USER
    },
    {
        name: '组织',
        value: REPO_OWNER_ORG
    }
]

const GIT_OWN_TYPE_ONLY = [
    {
        name: '个人',
        value: REPO_OWNER_USER
    },
]
class Git{
    constructor({name,version, dir},{ 
        refreshServer = false,
        refreshToken = false,
        refreshOwner = false
    }){
        this.name = name; // 项目名称
        this.version = version; // 项目版本
        this.dir = dir; // 源码目录
        this.git = SimpleGit(dir)// simple git实例
        this.gitServer = null; // git server实例
        this.homePath = null; // 本地缓存目录
        this.user = null; // 用户信息
        this.orgs = null; // 用户所属组织列表
        this.owner = null; // 远程仓库类型
        this.login = null; // 远程仓库登录名
        this.refreshServer = refreshServer; // 是否强制更新远程仓库类型
        this.refreshToken = refreshToken;  // 是否强制更新远程仓库token
        this.refreshOwner = refreshOwner;  // 是否强制更新远程仓库类型
    }

    async prepare(){
        this.checkHomePath()  // 检查缓存主目录
       await this.checkGitServer() // 检查用户远程仓库类型
       await this.checkGitToken() // 检查获取远程仓库token
       await this.getUserAndOrgs() // 获取远程仓库用户和组织信息
       await this.checkGitOwner() // 确认远程仓库类型：user/orgs
    }

    checkHomePath(){
        if(!this.homePath){
            if(process.env.CLI_HOME_PATH){
                this.homePath = process.env.CLI_HOME_PATH;
            }else{
                this.homePath = path.resolve (userHome,DEFAULT_CLI_HOME)
            }
        }
        log.verbose('home:', this.homePath)
        fse.emptyDirSync(this.homePath)
        if(!fs.existsSync(this.homePath)){
            throw new Error('用户主目录获取失败!')
        }
    }

    async checkGitServer(){
        const gitServerPath = this.createPath(GIT_SERVER_FILE); // /Users/liangchaofei/.rd-cli-env/.git/.git_server
        console.log('gitServerPath', gitServerPath)
        let gitServer = readFile(gitServerPath)
        console.log('gitServer', gitServer)
        if(!gitServer || this.refreshServer){
            gitServer = (await inquirer.prompt({
                type: 'list',
                name: 'gitServer',
                message: '请选择您想要托管的git平台',
                default: GITHUB,
                choices: GIT_SERVER_TYPE
            })).gitServer;
            writeFile(gitServerPath,gitServer)
            log.success('git server 写入成功', `${gitServer} => ${gitServerPath}`)
        }else{
            log.success('git server获取成功', gitServer)
        }
        this.gitServer = this.createGitServer(gitServer)
        if(!this.gitServer){
            throw new Error('GitServer初始化失败!')
        }
    }

    createGitServer(gitServer = ''){
        if(gitServer === GITHUB){
            return new Github()
        }else if(gitServer === GITEE){
            return new Gitee()
        }
        return null;
    }

    createPath(file){
        const rootDir = path.resolve(this.homePath,GIT_ROOT_DIR);
        const filePath = path.resolve(rootDir,file)
        fse.ensureDirSync(rootDir)
        return filePath;
    }

    async checkGitToken(){
        const tokenPath = this.createPath(GIT_TOKEN_FILE)
        let token = readFile(tokenPath)
        console.log('token', token)
        if(!token || this.refreshToken){
            console.log('a', this.gitServer.getTokenHelpUrl())
            log.warn(`${this.gitServer.type} token未生成，请先生成${this.gitServer.type} token
                ${terminalLink('点我跳转', this.gitServer.getTokenUrl())}
            `)
            token = (await inquirer.prompt({
                type: 'password',
                name: 'token',
                message: '请将token复制到这里',
                default: '',
            })).token;
            console.log('qq', token)
            writeFile(tokenPath,token)
            log.success('token写入成功', `${token} => ${tokenPath}`)
        }else{
            log.success('token获取成功', tokenPath)
        }
        this.token = token;
        this.gitServer.setToken(token)
    }

    async getUserAndOrgs(){
        this.user = await this.gitServer.getUser();
        if(!this.user){
            throw new Error('用户信息获取失败')
        }
        log.verbose('user', this.user)
        this.orgs = await this.gitServer.getOrg(this.user.login)
        if(!this.orgs){
            throw new Error('组织信息获取失败')
        }
        log.verbose('orgs', this.orgs)
        log.success(`${this.gitServer.type} 用户和组织信息获取成`)
        console.log('user', this.user)
    }

    async checkGitOwner(){
        const ownerPath = this.createPath(GIT_OWN_FILE);
        const loginPath = this.createPath(GIT_LOGIN_FILE);
        let owner = readFile(ownerPath);
        let login = readFile(loginPath)
        if(!owner || !login || this.refreshOwner){
            owner = (await inquirer.prompt({
                type: 'list',
                name: 'owner',
                message: '请选择远程仓库类型',
                default: REPO_OWNER_USER,
                choices: this.orgs.length > 0 ? GIT_OWN_TYPE : GIT_OWN_TYPE_ONLY
            })).owner;
            if(owner === REPO_OWNER_USER){
                login = this.user.login;
            }else{
                login = (await inquirer.prompt({
                    type: 'list',
                    name: 'login',
                    message: '请选择',
                    choices: this.orgs.map(item => ({
                            name: item.login,
                            value: item.login,
                    }))
                })).login;
            }
            writeFile(ownerPath,owner)
            writeFile(loginPath,login)
            log.success('owner 写入成功', `${owner} => ${ownerPath}`)
            log.success('login 写入成功', `${login} => ${loginPath}`)
        }else{
            log.success('owner 获取成功')
            log.success('login 获取成功')
        }
        this.owner = owner;
        this.login = login;
    }
    init(){
        console.log('init')
    }
}

module.exports = Git;