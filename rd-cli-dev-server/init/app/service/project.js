'use strict';

const Service = require('egg').Service;

class UserService extends Service {
  async getTemplate() {
    // 根据id查询用户信息
    return await this.app.mysql.select('template', {});
  }
}
module.exports = UserService;
