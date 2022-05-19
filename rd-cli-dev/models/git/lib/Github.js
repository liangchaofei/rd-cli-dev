const GitServer = require('./GitServer');
const GithubRequest = require('./GithubRequest')

class Github extends GitServer{
    constructor(){
        super('github')
        this.request = null;
    }

    getTokenUrl(){
        return 'https://github.com/settings/keys'
    }
    getTokenHelpUrl(){
        return 'https://github.com/settings/tokens'
    }

    setToken(token){
        super.setToken(token)
        this.request = new GithubRequest(token)
    }

    getUser(){
        return this.request.get('/user');
    }

    getOrg(username){
        return this.request.get(`/users/orgs`,{
            page: 1,
            per_page: 100
        })
    }
}

module.exports = Github;