
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
    createRepo(name){
        error('createRepo')
    }
    createOrgRepo(name,login){
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
    getRepo(login, name){
        error('getRepo')
    }

    getTokenUrl(){
        error('getSSHKeysUrl') 
    }
    getTokenHelpUrl(){
        error('getTokenHelpUrl')
    }
    isHttpResponse = res => {
        return res && res.status;
    }
    handleResponse = res => {
        console.log('log', res)
        if(this.isHttpResponse(res) && res !==200){
            return null;
        }else{
            return res;
        }
    }
}
module.exports = GitServer;