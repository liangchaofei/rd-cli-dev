
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
    isHttpResponse = (response) => {
        return response && response.status;
    };
    
    // todo: 判断有问题，需要在看
    handleResponse = (response) => {
        if (this.isHttpResponse(response) && response !== 200) {
            return null;
        } else {
            return response;
        }
    };
}
module.exports = GitServer;