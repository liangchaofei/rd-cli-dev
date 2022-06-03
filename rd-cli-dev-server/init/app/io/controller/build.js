

'use strict';

const { createCloudBuildTask } = require('../../models/CloudBuildTask');
const helper = require('../../extend/helper');
const { FAILED } = require('../../const');


async function prepare(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('prepare', {
    message: '开始执行构建前准备工作',
  }));
  const prepareRes = await cloudBuildTask.prepare();
  if (!prepareRes || prepareRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('prepare failed', {
      message: '执行构建前准备工作失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('prepare', {
    message: '构建前准备工作成功',
  }));
}
async function download(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('downlowd repo', {
    message: '开始下载源码',
  }));
  const downloadRes = await cloudBuildTask.download();
  if (!downloadRes || downloadRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('download failed', {
      message: '源码下载失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('download success', {
    message: '源码下载成功',
  }));
}

async function install(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('install', {
    message: '开始安装依赖',
  }));
  const installRes = await cloudBuildTask.install();
  if (!installRes || installRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('install failed', {
      message: '安装依赖失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('install success', {
    message: '安装依赖成功',
  }));
}

async function build(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('build', {
    message: '开始启动云构建',
  }));
  const installRes = await cloudBuildTask.build();
  if (!installRes || installRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('build failed', {
      message: '云构建任务执行失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('build success', {
    message: '云构建任务执行成功',
  }));
}

async function prePublish(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('pre-publish', {
    message: '开始云发布预检查',
  }));
  const prePublishRes = await cloudBuildTask.prePublish();
  if (!prePublishRes || prePublishRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('pre-publish failed', {
      message: '云发布预检查执行失败' + (prePublishRes && prePublishRes.message ? prePublishRes.message : '未知'),
    }));
    throw new Error('发布终止');
  }
  socket.emit('build', helper.parseMsg('pre-publish success', {
    message: '云发布预检查执行成功',
  }));
}

async function publish(cloudBuildTask, socket, helper) {
  socket.emit('build', helper.parseMsg('publish', {
    message: '开始云发布',
  }));
  const installRes = await cloudBuildTask.publish();
  if (!installRes || installRes.code === FAILED) {
    socket.emit('build', helper.parseMsg('publish failed', {
      message: '云发布执行失败',
    }));
    return;
  }
  socket.emit('build', helper.parseMsg('publish success', {
    message: '云发布执行成功',
  }));
}
module.exports = app => {
  class Controller extends app.Controller {
    async index() {
      const { ctx, app } = this;
      const { socket } = ctx;
      const cloudBuildTask = await createCloudBuildTask(ctx, app);
      try {
        await prepare(cloudBuildTask, socket, helper);
        await download(cloudBuildTask, socket, helper);
        await install(cloudBuildTask, socket, helper);
        await build(cloudBuildTask, socket, helper);
        await prePublish(cloudBuildTask, socket, helper);
        await publish(cloudBuildTask, socket, helper);
        socket.emit('build', helper.parseMsg('build success', {
          message: '云构建成功，访问链接：http://',
        }));
        socket.disconncet();
      } catch (e) {
        socket.emit('build', helper.parseMsg('error', {
          message: '云构建失败，失败原因：' + e.message,
        }));
        socket.disconncet();
      }
    }
  }
  return Controller;
};
