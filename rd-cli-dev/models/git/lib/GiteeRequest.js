const axios = require('axios'); 
const log = require('@rd-cli-dev/log')
const BASE_URL = 'https://gitee.com/api/v5';

class GiteeRequest {
    constructor(token){
        this.token = token;
        this.service = axios.create({
            baseUrl: BASE_URL,
            timeout: 5000
        });
        this.service.interceptors.response.use(
            response => {
                return response.data;
            },
            error => {
                log.verbose('err1', error)
                if(error.response && error.response.data){
                    return error.response
                }else{
                    return Promise.reject(error)
                }
            }
        )
    }

    get(url,params,headers){
        console.log('tolen', this.token)
        return this.service({
            url,
            params:{
                ...params,
                access_token: this.token
            },
            method: 'get',
            headers
        })
    }
}

module.exports = GiteeRequest;