'use strict';
const path = require('path')
module.exports = formatPath;

function formatPath(pwd) {
    if(pwd && typeof pwd === 'string'){
        const sep = path.sep; // mac: / windows: \
        if(sep === '/'){
            return pwd
        }else{
            return pwd.replace(/\\/g,'/')
        }
    }
    return pwd;
}
