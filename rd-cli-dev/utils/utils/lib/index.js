'use strict';



function isObject(o){
    return Object.prototype.toString.call(0) === '[object Object]'
}


module.exports = {
    isObject
}