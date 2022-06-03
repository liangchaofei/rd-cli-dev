'use strict';

const Mongodb = require('@pick-star/cli-mongodb');
const { mongodbDbName, mongodbUrl } = require('../../config/db');

function mongo() {
  return new Mongodb(mongodbUrl, mongodbDbName);
}

module.exports = mongo;
