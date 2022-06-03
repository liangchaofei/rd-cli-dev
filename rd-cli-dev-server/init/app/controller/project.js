'use strict';

const OSS = require('../models/OSS');
const config = require('../../config/db');
const { failed, success } = require('../utils/request');

const Controller = require('egg').Controller;

class ProjectController extends Controller {
  async getTemplate() {
    const users = await this.ctx.service.project.getTemplate();
    this.ctx.body = users;
  }

  async getOssProject() {
    const { ctx } = this;
    let ossProjectType = ctx.query.type;
    const ossProjectName = ctx.query.name;
    if (!ossProjectName) {
      ctx.body = failed('项目名称不存在');
      return;
    }
    if (!ossProjectType) {
      ossProjectType = 'prod';
    }
    let oss;
    if (ossProjectType === 'prod') {
      oss = new OSS(config.OSS_PROD_BUCKET);
    } else {
      oss = new OSS(config.OSS_DEV_BUCKET);
    }
    if (oss) {
      const fileList = await oss.list(ossProjectName);
      ctx.body = success('获取项目文件成功', fileList);
    } else {
      ctx.body = success('获取项目文件失败');
    }
  }


  async getOssFile() {
    const { ctx } = this;
    const dir = ctx.query.name;
    let ossProjectType = ctx.query.type;
    const file = ctx.query.file;
    if (!dir || !file) {
      ctx.body = failed('请提供oss文件名称');
      return;
    }
    if (!ossProjectType) {
      ossProjectType = 'prod';
    }
    let oss;
    if (ossProjectType === 'prod') {
      oss = new OSS(config.OSS_PROD_BUCKET);
    } else {
      oss = new OSS(config.OSS_DEV_BUCKET);
    }
    if (oss) {
      const fileList = await oss.list(file);
      const fileName = `${dir}/${file}`;
      const finalFile = fileList.find(item => item.name === fileName);
      ctx.body = success('获取项目文件成功', finalFile);
    } else {
      ctx.body = failed('获取项目文件失败');
    }
  }
  async getRedis() {
    const { ctx, app } = this;
    const { key } = ctx.query;
    if (key) {
      const value = await app.redis.get(key);
      console.log('value', value);
      ctx.body = `${key}: ${value}`;
    } else {
      ctx.body = '请在url参数中提供key';
    }
  }
}

module.exports = ProjectController;
