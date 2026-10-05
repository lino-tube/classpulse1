/* Optional same-origin classroom demo sync with a persistent retry queue. */
(function () {
  const allowed=new Set(['classpulse_student_pulse','classpulse_intervention_state','classpulse_voice_messages','classpulse_support_requests','classpulse_teaching_visual','classpulse_session_ended']);
  const arrays=new Set(['classpulse_voice_messages','classpulse_support_requests']);
  const original=ClassPulse.setStoredJSON, OUTBOX='classpulse_demo_outbox';
  // Each tab owns its outgoing operations; queue survives refresh in that tab.
  let active=false,sending=false;
  const status=document.createElement('div');status.className='live-demo-status';status.setAttribute('role','status');
  document.addEventListener('DOMContentLoaded',()=>document.body.append(status));
  function mode(text){status.textContent=text;}
  async function fetchState(options={}) {
    const controller=new AbortController();
    const timeout=window.setTimeout(()=>controller.abort(),2500);
    try {
      const response=await fetch('/api/state',{...options,signal:controller.signal});
      if(!response.ok)throw Error('Demo server unavailable');
      return await response.json();
    } finally { window.clearTimeout(timeout); }
  }
  function outbox(){try{const q=JSON.parse(sessionStorage.getItem(OUTBOX)||'[]');return Array.isArray(q)?q:[];}catch{return [];}}
  function writeQueue(q){sessionStorage.setItem(OUTBOX,JSON.stringify(q));}
  function apply(key,value){const next=JSON.stringify(value),old=localStorage.getItem(key);if(old!==next){original(key,value);window.dispatchEvent(new StorageEvent('storage',{key,newValue:next,oldValue:old}));}}
  async function flush(){
    if(!active||sending)return;sending=true;
    try{
      while(outbox().length){
        const item=outbox()[0];
        const data=await fetchState({method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({key:item.key,value:item.value})});writeQueue(outbox().filter(x=>x.id!==item.id));
        if(!outbox().some(x=>x.key===item.key))apply(item.key,data.value);
      }
      mode('Live demo connected · shared classroom updates');
    }catch{
      mode('Update queued · reconnecting automatically. Keep this tab open.');
      window.dispatchEvent(new CustomEvent('classpulse:sync-error',{detail:{key:outbox()[0]?.key}}));
    }finally{sending=false;}
  }
  async function poll(){
    if(sending)return;if(outbox().length){await flush();if(outbox().length)return;}
    try{const data=await fetchState({cache:'no-store'});if(sending||outbox().length)return;for(const[key,value]of Object.entries(data))if(allowed.has(key))apply(key,value);mode('Live demo connected · shared classroom updates');}
    catch{mode('Connection interrupted · reconnecting automatically');}
  }
  ClassPulse.setStoredJSON=function(key,value){
    const previous=ClassPulse.getStoredJSON(key,[]);original(key,value);window.dispatchEvent(new CustomEvent('classpulse:change',{detail:{key}}));
    if(!active||!allowed.has(key))return;
    const changed=arrays.has(key)&&Array.isArray(value)?value.filter(m=>!Array.isArray(previous)||!previous.some(old=>old.id===m.id&&JSON.stringify(old)===JSON.stringify(m))):value;
    const q=outbox();q.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),key,value:changed});writeQueue(q);flush();
  };
  ClassPulse.live={get connected(){return active;},ready:(async()=>{
    if(!/^https?:$/.test(location.protocol)){mode('Local demo · updates shared only across this browser');return;}
    try{
      const data=await fetchState({cache:'no-store'});if(!data||Array.isArray(data)||typeof data!=='object')throw Error();active=true;
      // Unsent changes remain local until flushed; server is authoritative for other keys.
      for(const key of allowed)if(!outbox().some(x=>x.key===key))apply(key,Object.hasOwn(data,key)?data[key]:(arrays.has(key)?[]:null));
      flush();mode(outbox().length?'Update queued · reconnecting automatically. Keep this tab open.':'Live demo connected · shared classroom updates');window.setInterval(poll,1500);
    }catch{mode('Local demo · run server.py to connect separate devices');}
  })()};
})();
