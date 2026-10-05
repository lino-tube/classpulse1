(function () {
  const INTERVENTION = ClassPulse.STORAGE_KEYS.intervention;
  const DURATION = 7 * 60;
  function state(){return ClassPulse.getStoredJSON(INTERVENTION,{})||{};}
  function remaining(s=state()){return s.endsAt ? Math.max(0,Math.ceil((s.endsAt-Date.now())/1000)) : DURATION;}
  function completed(s=state()){return !!(s.endsAt && s.endsAt<=Date.now() || s.completedAt || s.recheckedAt);}
  function uid(){return window.crypto?.randomUUID?.() || Date.now()+'-'+Math.random().toString(36).slice(2);}
  let studentId=localStorage.getItem('classpulse_support_student_id');
  if(!studentId){studentId=uid();localStorage.setItem('classpulse_support_student_id',studentId);}
  window.ClassPulseLearning={state,remaining,completed,uid,studentId,DURATION};
})();
