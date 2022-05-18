
function error(methodName){
    throw new Error(`${methodName}必须实现`)
}

class GitServer {
    constructor(type, token){
        this.type = type;
        this.token = token;
    }

    setToken(token){
        this.token = token;
    }
    createRepo(){
        error('createRepo')
    }
    createOrgRepo(){
        error('createOrgRepo')
    }

    getRemote(){
        error('getRemote')
    }
    getUser(){
        error('getUser')
    }
    getOrg(){
        error('getOrg')
    }

    getSSHKeysUrl(){
        error('getSSHKeysUrl') 
    }
    getTokenHelpUrl(){
        error('getTokenHelpUrl')
    }
}
module.exports = GitServer;