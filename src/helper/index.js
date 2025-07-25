import { TOKEN } from '../const/user';

const getToken=()=>{
   return localStorage.getItem(TOKEN)
}

const setToken=(token)=>{
localStorage.setItem(TOKEN, token);
return;
}


const removeToken=()=>{
    return localStorage.removeItem(TOKEN);
}

export { getToken, setToken, removeToken };