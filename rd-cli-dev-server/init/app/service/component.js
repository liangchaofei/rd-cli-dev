'use strict';

const Service = require('egg').Service;

class ComponentService extends Service {
  async getComponent() {
    // 根据id查询用户信息
    return await this.app.mysql.select('component', {});
  }
}
module.exports = ComponentService;
