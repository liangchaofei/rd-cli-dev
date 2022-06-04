'use strict';

const Controller = require('egg').Controller;
const constant = require('../../const');
class ComponentsController extends Controller {
  async index() {
    const { ctx } = this;

    ctx.body = 'a';
  }
  async show() {
    const { ctx } = this;

    ctx.body = 'as';
  }
  async create() {
    const { ctx, app } = this;
    const { component, git } = ctx.request.body;
    const timestamp = new Date().getTime();
    const componentData = {
      name: component.name,
      classname: component.className,
      description: component.description,
      npm_name: component.npmName,
      npm_version: component.npmVersion,
      git_type: git.type,
      git_remote: git.remote,
      git_owner: git.owner,
      git_login: git.login,
      status: constant.STATUS.ON,
      create_dt: timestamp,
      create_by: git.login,
      update_dt: timestamp,
      update_by: git.login,
    };
    ctx.body = 'aa';
  }
}
module.exports = ComponentsController;
