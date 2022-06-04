import axios from 'axios';

module.exports = {
    createComponent: async function(component){
        try{
            const res = await axios.post('http://127.0.0.1:7002/api/v1/components',component)
            const { data } = res;
            if(data.code === 0){
                return data.data;
            }
            return null;
        }catch(e){
            throw e;
        }
    }
}