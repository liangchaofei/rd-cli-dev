'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/project/template', controller.project.getTemplate);
  router.get('/project/oss', controller.project.getOssProject);
  router.get('/redis/test', controller.project.getRedis);
  router.get('/oss/get', controller.project.getOssFile);

  app.io.route('build', app.io.controller.build.index);

};
