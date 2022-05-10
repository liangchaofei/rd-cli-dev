'use strict';

const Command = require('@rd-cli-dev/command')
const log = require('@rd-cli-dev/log');

class InitCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        log.verbose(this.projectName)
        log.verbose(this.force)
    }

    exec(){
        
    }
}

function init(argv){
    return new InitCommand(argv)
}
module.exports = init;
module.exports.InitCommand = InitCommand;