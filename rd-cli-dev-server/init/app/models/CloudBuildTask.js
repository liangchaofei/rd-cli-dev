'use strict';

const fs = require('fs');
const path = require('path');
const userHome = require('user-home');
const fse = require('fs-extra');
const Git = require('simple-git');
const glob = require('glob');
const { SUCCESS, FAILED } = require('../const');
const config = require('../../config/db');
const OSS = require('../models/OSS');

const helper = require('../../extend/helper');

const REDIS_PREFIX = 'cloudbuild';

class CloudBuildTask {
  constructor(options, ctx, app) {
    this._ctx = ctx;
    this._app = app;
    this._logger = this._ctx.logger;
    this._name = options.name; // 项目名称
    this._version = options.version;
    this._repo = options.repo;
    this._branch = options.branch;
    this._buildCmd = options.buildCmd;
    this._dir = path.resolve(userHome, '.rd-cli-dev', 'cloudbuild', `${this._name}@${this._version}`); // 缓存目录
    this._sourceCodeDir = path.resolve(this._dir, this._name); // 缓存 源码目录
    this._prod = options.prod === 'true';
    this._logger.info('_dir', this._dir);
    this._logger.info('_sourceCodeDir', this._sourceCodeDir);
    this._logger.info('_prod', this._prod);
  }

  async prepare() {
    fse.ensureDirSync(this._dir);
    fse.emptyDirSync(this._dir);
    this._git = new Git(this._dir);
    if (this._prod) {
      this.oss = new OSS(config.OSS_PROD_BUCKET);
    } else {
      this.oss = new OSS(config.OSS_DEV_BUCKET);
    }

    return this.success();
  }

  async download() {
    await this._git.clone(this._repo);
    this._git = new Git(this._sourceCodeDir);
    await this._git.checkout([
      '-b',
      this._branch,
      `origin/${this._branch}`,
    ]);
    return fs.existsSync(this._sourceCodeDir) ? this.success() : this.failed();
  }

  async install() {
    const res = await this.execCommand('cnpm install');
    return res ? this.success() : this.failed();

  }

  execCommand(command) {
    // npm install=> ['npm','install']
    const commands = command.split(' ');
    if (commands.length === 0) {
      return null;
    }
    const firstCommand = commands[0];
    const leftCommand = commands.slice(1) || [];
    return new Promise(resolve => {
      const p = exec(firstCommand, leftCommand, {
        cwd: this._sourceCodeDir,
      }, {
        stdio: 'pipe',
      });
      p.on('error', e => {
        this._ctx.logger.error('build error', e);
        resolve(false);
      });
      p.on('exit', c => {
        this._ctx.logger.error('build exit', c);
        resolve(true);
      });
      p.stdout.on('data', data => {
        this._ctx.socket.emit('building', data.toString());
      });
      p.stderr.on('data', data => {
        this._ctx.socket.emit('building', data.toString());
      });
    });
  }

  async prePublish() {
    // 获取构建结果
    const buildPath = this.findBuildPath();
    // 检查构建结果
    if (!buildPath) {
      return this.failed('未找到构建结果，请检查');
    }
    this._buildPath = buildPath;
    return this.success();
  }

  findBuildPath() {
    const buildDir = ['dist', 'build'];
    const buildPath = buildDir.find(dir => fs.existsSync(path.resolve(this._sourceCodeDir, dir)));
    this._ctx.logger.info('buildPath', buildPath);
    if (buildPath) {
      return path.resolve(this._sourceCodeDir, buildPath);
    }
    return null;
  }

  async publish() {
    return new Promise(resolve1 => {
      glob('**', {
        cwd: this._buildPath,
        nodir: true,
        ignore: '**/node_modules/**',
      }, (err, files) => {
        if (err) {
          resolve1(err);
        } else {
          Promise.all(files.map(async file => {
            const filePath = path.resolve(this._buildPath, file);
            const uploadOSSRes = await this.oss.put(`${this._name}/${file}`, filePath);
            return uploadOSSRes;
          })).then(() => {
            resolve1(true);
          }).catch(e => {
            this._ctx.logger.error(e);
            resolve1(false);
          });
        }
      });
    }
    );
  }

  async build() {
    let res;
    if (checkoutCommand(this._buildCmd)) {
      res = await this.execCommand(this._buildCmd);
    } else {
      res = false;
    }
    return res ? this.success() : this.failed();
  }


  success(msg, data) {
    return this.response(SUCCESS, msg, data);
  }

  failed(msg, data) {
    return this.response(FAILED, msg, data);
  }
  response(code, msg, data) {
    return {
      code,
      msg,
      data,
    };
  }

  async clean() {
    if (fs.existsSync(this._dir)) {
      fse.removeSync(this._dir);
    }
    const { socket } = this._ctx;
    const client = socket.id;
    await this._app.redis.del(`${REDIS_PREFIX}:${client}`);
  }
}

function checkoutCommand(command) {
  if (command) {
    const commands = command.split(' ');
    if (commands.length === 0 || ['npm', 'cnpm'].indexOf(commands[0]) < 0) {
      return false;
    }
    return true;
  }
  return false;
}

function exec(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return require('child_process').spawn(cmd, cmdArgs, options || {});
}

async function createCloudBuildTask(ctx, app) {
  const { socket } = ctx;
  const client = socket.id;
  const redisKey = `${REDIS_PREFIX}:${client}`;
  const redisTask = await app.redis.get(redisKey);
  const task = JSON.parse(redisTask);
  socket.emit('build', helper.parseMsg('create task', {
    message: '创建云构建任务',
  }));
  return new CloudBuildTask({
    repo: task.repo,
    name: task.name,
    version: task.version,
    branch: task.branch,
    buildCmd: task.buildCmd,
    prod: task.prod,
  }, ctx, app);
}

module.exports = {
  CloudBuildTask,
  createCloudBuildTask,
};
