'use strict';

const Controller = require('egg').Controller;

class ComponentSiteController extends Controller {
  async index() {
    const data = await this.ctx.service.component.getComponent();
    if (data && data.length > 0) {
      this.ctx.body = data[0];
    } else {
      this.ctx.body = {};
    }
  }
}
module.exports = ComponentSiteController;
