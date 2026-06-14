const http = require('http');
const BASE = 'http://localhost:5001';

function req(method, path, body=null, token=null){
  return new Promise((resolve,reject)=>{
    const url = new URL(path, BASE);
    const options = {hostname:url.hostname, port: url.port, path: url.pathname+url.search, method, headers: {'Content-Type':'application/json'}};
    if(token) options.headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(options, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{ resolve({status:res.statusCode, body: JSON.parse(d)}); }catch(e){ resolve({status:res.statusCode, body: d}); } });
    });
    r.on('error', reject);
    if(body) r.write(JSON.stringify(body)); r.end();
  });
}

(async()=>{
  try{
    console.log('Logging in admin...');
    let res = await req('POST','/api/auth/login',{email:'admin@tsu.ac.th', password:'AdminPass123'});
    console.log('Login:', res.status, res.body);
    if(res.body && res.body.token){
      const token = res.body.token;
      console.log('Creating room as admin...');
      res = await req('POST','/api/university-rooms', {name:'Debug Room', building:'Debug', floor:9, capacity:10, equipment:['projector']}, token);
      console.log('Create room response:', res.status, res.body);
    } else {
      console.log('Admin login failed, cannot test');
    }
  }catch(e){ console.error('Request error', e); }
})();