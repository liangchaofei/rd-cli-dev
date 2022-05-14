const request = require('@rd-cli-dev/request');

module.exports = function(){
    return request({
        url: '/project/template'
    })
}