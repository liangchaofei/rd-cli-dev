const GitServer = require('./GitServer');
const GiteeRequest = require('./GiteeRequest');

class Gitee extends GitServer{
    constructor(){
        super('gitee')
        this.request = null;
    }
    getTokenUrl(){
        return 'https://gitee.com/profile/sshkeys'
    }
    getTokenHelpUrl(){
        return 'https://gitee.com/help/articles/4191'
    }

    setToken(token){
        super.setToken(token)
        this.request = new GiteeRequest(token)
    }
    getUser(){
        return this.request.get('/user');
    }

    getOrg(username){
        return this.request.get(`/users/${username}/orgs`,{
            page: 1,
            per_page: 100
        })
    }
}

module.exports = Gitee;