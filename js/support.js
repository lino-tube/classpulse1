(function () {
  const KEY='classpulse_support_requests';
  const $=id=>document.getElementById(id);
  const isStudent=document.body.dataset.role==='student';
  const labels={pending:'Awaiting lecturer review',accepted:'Accepted · waiting for date and venue',scheduled:'Appointment scheduled',declined:'Lecturer unable to arrange this request',cancelled:'Cancelled by student'};
  function all(){const value=ClassPulse.getStoredJSON(KEY,[]);return Array.isArray(value)?value.filter(r=>r&&typeof r.id==='string'&&typeof r.name==='string'&&labels[r.status]):[];}
  function node(tag,text='',cls=''){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
  function feedback(text){$('supportFeedback').textContent=text;}
  function persist(rows){try{ClassPulse.setStoredJSON(KEY,rows);return true;}catch{feedback('Unable to save. Enable browser storage and try again.');return false;}}
  function update(id,patch){const rows=all(),r=rows.find(r=>r.id===id);if(!r)return false;Object.assign(r,patch,{updatedAt:new Date().toISOString()});const ok=persist(rows);if(ok)render();return ok;}
  function button(label,fn){const b=node('button',label,'btn btn-secondary');b.type='button';b.addEventListener('click',fn);return b;}
  function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function field(form,label,type,value,required=true){const group=node('div','','form-group');const input=document.createElement(type==='textarea'?'textarea':'input');input.className='form-control';input.id='schedule-'+form.dataset.request+'-'+form.children.length;input.value=value||'';input.required=required;if(type!=='textarea')input.type=type;if(type==='date')input.min=today();if(type==='text'||type==='textarea')input.maxLength=300;const title=node('label',label);title.htmlFor=input.id;group.append(title,input);form.append(group);return input;}
  function httpsLink(value){try{const url=new URL(value);return url.protocol==='https:' ? url.href : null;}catch{return null;}}
  function scheduler(r){
    const form=node('form','','appointment-form');form.dataset.request=r.id;
    const date=field(form,'Date','date',r.date),time=field(form,'Time','time',r.time);
    const formatGroup=node('div','','form-group'),formatLabel=node('label','Meeting format'),format=document.createElement('select');
    format.id='format-'+r.id;formatLabel.htmlFor=format.id;format.className='form-control';
    for(const [value,label] of [['campus','On campus'],['teams','Microsoft Teams']]){const option=node('option',label);option.value=value;format.append(option);}
    format.value=r.meetingFormat||'campus';formatGroup.append(formatLabel,format);form.append(formatGroup);
    const venue=field(form,'Campus location','text',r.venue);
    const venueLabel=form.children[form.children.length-1].children[0];
    function changeFormat(){venueLabel.textContent=format.value==='teams'?'Teams meeting link':'Campus, building and room';venue.type=format.value==='teams'?'url':'text';venue.maxLength=format.value==='teams'?2000:300;venue.placeholder=format.value==='teams'?'Paste the https:// Teams meeting link':'e.g. Rosebank campus, Building B, Room 12';}
    format.addEventListener('change',changeFormat);changeFormat();
    const note=field(form,'What should the student prepare?','textarea',r.preparation||'Bring your questions, class notes and the exercise or code you attempted.');
    const hint=node('p','Time zone: '+(Intl.DateTimeFormat().resolvedOptions().timeZone||'local device time'),'form-hint');form.append(hint);
    const submit=node('button',r.status==='scheduled'?'Update appointment':'Set appointment','btn btn-primary');submit.type='submit';form.append(submit);
    const error=node('p','','inline-error');error.setAttribute('role','alert');form.append(error);
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const when=new Date(date.value+'T'+time.value);
      if(!date.value||!time.value||!venue.value.trim()||!note.value.trim()||!Number.isFinite(when.getTime())||when<=new Date()){
        error.textContent='Choose a future date and time, and enter the venue and preparation instructions.';error.classList.add('show');return;
      }
      if(format.value==='teams'&&!httpsLink(venue.value.trim())){error.textContent='Paste a valid HTTPS Teams meeting link.';error.classList.add('show');return;}
      const latest=all().find(x=>x.id===r.id);if(!latest||!['accepted','scheduled'].includes(latest.status)){feedback('This request changed. Review its latest status.');render();return;}
      if(update(r.id,{status:'scheduled',date:date.value,time:time.value,venue:venue.value.trim(),meetingFormat:format.value,preparation:note.value.trim(),appointmentAt:when.toISOString(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'local device time'}))feedback('Appointment details sent to the student.');
    });return form;
  }
  function render(){
    const root=$(isStudent?'studentRequests':'lecturerRequests');if(!root)return;
    let rows=all();if(isStudent)rows=rows.filter(r=>r.studentId===ClassPulseLearning.studentId);else{const filter=$('requestFilter').value;if(filter!=='all')rows=rows.filter(r=>r.status===filter);}
    root.replaceChildren();
    if(!rows.length){root.append(node('p',isStudent?'You have no requests yet.':'No requests to show.','voice-empty'));return;}
    rows.slice().reverse().forEach(r=>{
      const card=node('article','','voice-message');card.append(node('h3',r.name+' · '+r.topic),node('span',labels[r.status],'support-status '+r.status),node('p',r.questions));
      if(r.availability)card.append(node('p','Student availability: '+r.availability,'form-hint'));
      if(r.status==='scheduled'){
        const details=node('dl','','appointment-details');
        for(const [label,value] of [['Date',r.date],['Time',r.time+' ('+r.timezone+')'],['Meeting',r.meetingFormat==='teams'?'Microsoft Teams':'On campus'],[r.meetingFormat==='teams'?'Link':'Place',r.venue],['Prepare',r.preparation]]){ const detail=node('dd',value); if(label==='Link'&&httpsLink(value)){const link=node('a','Join Microsoft Teams meeting','appointment-link');link.href=httpsLink(value);link.target='_blank';link.rel='noopener noreferrer';detail.textContent='';detail.append(link);}details.append(node('dt',label),detail); }
        card.append(details);
      }
      if(r.status==='declined')card.append(node('p',r.declineReason||'Please ask your lecturer about another support option.'));
      if(isStudent&&['pending','accepted','scheduled'].includes(r.status))card.append(button('Cancel request',()=>update(r.id,{status:'cancelled'})));
      if(!isStudent){
        if(r.status==='pending'){
          card.append(button('Accept request',()=>{if(update(r.id,{status:'accepted'}))feedback('Request accepted. Set the date, time and venue below.');}));
          const declineBox=node('div','','decline-fields');const reason=document.createElement('input');reason.className='form-control';reason.placeholder='Reason / alternative support';reason.maxLength=300;reason.setAttribute('aria-label','Reason for declining request from '+r.name);declineBox.append(reason,button('Decline request',()=>{if(!reason.value.trim()){feedback('Enter a reason or alternative support before declining.');reason.focus();return;}update(r.id,{status:'declined',declineReason:reason.value.trim()});}));card.append(declineBox);
        }
        if(r.status==='accepted')card.append(scheduler(r));
        if(r.status==='scheduled')card.append(button('Change appointment',()=>{if(!card.querySelector('form'))card.append(scheduler(r));}));
      }
      root.append(card);
    });
  }
  function interventionStatus(){
    if(!isStudent)return;
    const s=ClassPulseLearning.state();
    $('requestFields').disabled=false;
    $('supportIntervention').textContent='You can send a one-on-one request now. Your lecturer can continue teaching and respond when available.' + (s.endsAt && ClassPulseLearning.remaining(s)>0 ? ' The seven-minute intervention is still running; you do not need to wait for it to finish.' : '');
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    await ClassPulse.live.ready;
    if(isStudent){
      $('supportName').value=localStorage.getItem('classpulse_support_name')||'';
      const pulse=ClassPulse.getStoredJSON(ClassPulse.STORAGE_KEYS.studentPulse,null);
      if(pulse&&[...$('supportTopic').options].some(o=>o.value===pulse.topic))$('supportTopic').value=pulse.topic;
      const draftKey='classpulse_support_draft';
      const draft=ClassPulse.getStoredJSON(draftKey,null);
      if(draft){$('supportName').value=draft.name||$('supportName').value;$('supportTopic').value=draft.topic||$('supportTopic').value;$('supportQuestions').value=draft.questions||'';$('supportAvailability').value=draft.availability||'';}
      for(const id of ['supportName','supportTopic','supportQuestions','supportAvailability'])$(id).addEventListener('input',()=>{
        try{ClassPulse.setStoredJSON(draftKey,{name:$('supportName').value,topic:$('supportTopic').value,questions:$('supportQuestions').value,availability:$('supportAvailability').value});}catch{}
      });
      $('supportForm').addEventListener('submit',e=>{
        e.preventDefault();
        const name=$('supportName').value.trim(),questions=$('supportQuestions').value.trim(),topic=$('supportTopic').value;
        if(!name||!questions){feedback('Please enter your name and the questions you need help with.');return;}
        const rows=all();if(rows.some(r=>r.studentId===ClassPulseLearning.studentId&&r.topic===topic&&['pending','accepted','scheduled'].includes(r.status))){feedback('You already have an active request for this topic. Check its status below.');return;}
        rows.push({id:ClassPulseLearning.uid(),studentId:ClassPulseLearning.studentId,name,questions,topic,availability:$('supportAvailability').value.trim(),status:'pending',createdAt:new Date().toISOString()});
        if(persist(rows)){localStorage.setItem('classpulse_support_name',name);$('supportQuestions').value='';$('supportAvailability').value='';ClassPulse.setStoredJSON(draftKey,null);feedback(ClassPulse.live.connected ? 'Request sent. Your lecturer can accept it and arrange an appointment.' : 'Request saved for this browser demo. Sign in as Lecturer in another tab on the same browser to review it.');render();}
      });
      interventionStatus();window.setInterval(interventionStatus,1000);
    }else $('requestFilter').addEventListener('change',render);
    render();
    window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)render();if(e.key===ClassPulse.STORAGE_KEYS.intervention)interventionStatus();});
    window.addEventListener('classpulse:sync-error',e=>{if(e.detail.key===KEY)feedback('Your update is queued and will retry automatically when connected. Keep this tab open.');});
  });
})();
