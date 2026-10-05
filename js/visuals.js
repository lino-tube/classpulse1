/* Exact, built-in educational diagrams; no image-generation API is required. */
(function () {
  const $=id=>document.getElementById(id), KEY='classpulse_teaching_visual';
  const titles={creating:'Creating arrays',indexing:'Array Indexing',looping:'Looping through arrays',one:'One-dimensional arrays',two:'Two-dimensional arrays'};
  const samples={creating:'An array stores values 10, 20, 30, 40 together under one name.',indexing:'For values 10, 20, 30, 40, index 2 gives us 30. Counting starts at zero.',looping:'Loop through the array values 10, 20, 30, 40. Visit each value one at a time.',one:'A one-dimensional array is a single row of values 10, 20, 30, 40.',two:'A two-dimensional array has rows and columns, like a table of values.'};
  const isLecturer=document.body.dataset.role==='lecturer';let values=[10,20,30,40],step=0,shareTimer,recognition,listening=false;
  function feedback(text){$('visualFeedback').textContent=text;}
  function detect(text){
    // Prefer the most recently mentioned supported concept as the lesson moves on.
    const patterns=[['two',/two[ -]?dimensional|2[ -]?d\b|rows? and columns?|matrix/gi],['one',/one[ -]?dimensional|1[ -]?d\b/gi],['looping',/loop|iterate|iteration|for each|visit each/gi],['indexing',/index|indices|position|counting starts/gi],['creating',/creat|declar|initiali/gi]];
    const hits=[];
    for(const [topic,pattern] of patterns)for(const match of text.matchAll(pattern))hits.push({topic,index:match.index});
    if(hits.length)return hits.sort((a,b)=>b.index-a.index)[0].topic;
    return /\barrays?\b/i.test(text)?'creating':null;
  }
  function recognise(text){
    const topic=detect(text);if(topic)$('visualTopic').value=topic;
    const match=[...text.matchAll(/(?:values?\s*(?:are|of|:|=)?\s*|\{)(-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?){1,5})/gi)].at(-1);
    if(match)$('visualValues').value=match[1];
    return topic;
  }
  const NS='http://www.w3.org/2000/svg';
  function svgEl(tag,attrs={},text){const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
  function text(svg,x,y,value,size=22,color='#172033'){svg.append(svgEl('text',{x,y,'text-anchor':'middle','font-size':size,fill:color,'font-family':'system-ui, sans-serif'},value));}
  function block(svg,x,y,width,height,value,selected){svg.append(svgEl('rect',{x,y,width,height,rx:12,fill:selected?'#d9f4ec':'#eef4ff',stroke:selected?'#147467':'#2f66d0','stroke-width':selected?3:2}));text(svg,x+width/2,y+height/2+8,value,String(value).length>5?16:24);}
  function render(){
    const topic=$('visualTopic').value;
    const raw=$('visualValues').value.trim().split(',').map(v=>v.trim());
    if(!raw.length||raw.length>6||raw.some(v=>!/^[-+]?\d+(\.\d+)?$/.test(v)||!Number.isFinite(Number(v)))){
      feedback('Enter one to six numbers separated by commas. The last valid picture is still shown.');return false;
    }
    values=raw.map(Number);step%=values.length;
    const svg=svgEl('svg',{viewBox:'0 0 760 330',role:'img','aria-labelledby':'pictureTitle pictureDescription'});
    svg.append(svgEl('rect',{x:0,y:0,width:760,height:330,rx:14,fill:'#fafcfe'}));
    const desc=svgEl('desc',{id:'pictureDescription'});svg.append(svgEl('title',{id:'pictureTitle'},titles[topic]),desc);
    const indexMatch=[...$('visualTranscript').value.matchAll(/(?:index|position)\s*(?:is|number|:|=)?\s*(\d+)/gi)].at(-1);
    const index=indexMatch?Number(indexMatch[1]):Math.min(2,values.length-1);
    let caption;
    if(topic==='two'){
      const cols=3, grid=[...values];while(grid.length<6)grid.push(0);
      text(svg,380,30,'A grid: choose a row, then a column',24);
      for(let col=0;col<cols;col++)text(svg,250+col*120,70,'column '+col,16);
      for(let row=0;row<2;row++){
        text(svg,115,140+row*86,'row '+row,18);
        for(let col=0;col<cols;col++)block(svg,200+col*120,100+row*86,100,64,grid[row*cols+col],row===1&&col===2);
      }
      text(svg,380,304,'grid[1][2] = '+grid[5],22,'#147467');
      caption='This 2 × 3 example has two rows and three columns. Both start at 0. The highlighted cell is row 1, column 2. Missing example values are filled with 0.';
    }else{
      const width=Math.min(120,600/values.length),start=(760-values.length*width)/2;
      text(svg,380,35,topic==='looping'?'Visit each value, one at a time':topic==='indexing'?'Use an index to find a value':topic==='one'?'One row, one index':'One name holds several values',24);
      values.forEach((v,i)=>{const x=start+i*width;block(svg,x+5,100,width-10,85,v,(topic==='indexing'&&i===index)||(topic==='looping'&&i===step));text(svg,x+width/2,220,'index '+i,16);});
      if(topic==='creating'){
        text(svg,380,280,'int[] numbers = {'+values.join(', ')+'};',19);caption='An array groups '+values.length+' values under one name: numbers. Each box is one element. Its length is '+values.length+'.';
      }else if(topic==='indexing'){
        const valid=index>=0&&index<values.length;
        text(svg,380,280,valid?'numbers['+index+'] = '+values[index]:'Index '+index+' is outside this array',22,valid?'#147467':'#b42318');
        caption=valid?'Counting starts at 0. Index '+index+' is position '+(index+1)+' when counting from one, and stores '+values[index]+'. The last valid index is '+(values.length-1)+'.':'There is no element at index '+index+'. Valid indices run from 0 to '+(values.length-1)+'.';
      }else if(topic==='looping'){
        text(svg,380,275,'i = '+step+'  →  numbers[i] = '+values[step],23,'#147467');
        caption='A loop visits each element. The highlighted element is step '+(step+1)+' of '+values.length+'. Stop when i reaches the array length ('+values.length+'). Use Next element to explore.';
      }else{
        text(svg,380,280,'numbers.length = '+values.length,22,'#147467');caption='A one-dimensional array has one row of elements. Use one index to access each value: numbers[0] is '+values[0]+'.';
      }
    }
    desc.textContent=caption;$('visualDiagram').replaceChildren(svg);$('diagramTitle').textContent=titles[topic];$('diagramCaption').textContent=caption;$('nextElement').hidden=topic!=='looping';
    return true;
  }
  function share(){if(!isLecturer||!$('shareTopic').checked)return;window.clearTimeout(shareTimer);shareTimer=window.setTimeout(()=>{
    if(!render())return;
    try{ClassPulse.setStoredJSON(KEY,{topic:$('visualTopic').value,values:$('visualValues').value,transcript:$('visualTranscript').value,updatedAt:new Date().toISOString()});$('visualSource').textContent='Shared with the demo class';}catch{feedback('Could not share this visual. Check browser storage.');}
  },350);}
  function following(){return !isLecturer&&$('followTopic').checked;}
  function setFollow(on){if(isLecturer)return;$('followTopic').checked=on;for(const id of ['visualTopic','visualValues','visualTranscript'])$(id).disabled=false;$('visualSource').textContent=on?'Following lecturer':'Your own visual';}
  function receive(){
    if(!following())return;const shared=ClassPulse.getStoredJSON(KEY,null);
    if(!shared||!titles[shared.topic]){setFollow(true);$('visualSource').textContent='Waiting for lecturer · example shown';return;}
    $('visualTopic').value=shared.topic;$('visualValues').value=String(shared.values||'10, 20, 30, 40');$('visualTranscript').value=String(shared.transcript||'');step=0;setFollow(true);$('visualSource').textContent='Following lecturer’s live topic';render();
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    await ClassPulse.live.ready;
    render();if(!isLecturer){setFollow(true);receive();$('followTopic').addEventListener('change',()=>{setFollow($('followTopic').checked);if(following()){if(listening)recognition?.stop();receive();}});}else{
      const saved=ClassPulse.getStoredJSON(KEY,null);if(saved&&titles[saved.topic]){$('visualTopic').value=saved.topic;$('visualValues').value=saved.values||'10, 20, 30, 40';$('visualTranscript').value=saved.transcript||'';render();}
      $('shareTopic').addEventListener('change',()=>{if($('shareTopic').checked)share();else $('visualSource').textContent='Local preview · sharing paused';});share();
    }
    $('visualTopic').addEventListener('change',()=>{setFollow(false);step=0;feedback('');render();share();});
    $('visualValues').addEventListener('input',()=>{setFollow(false);if(render())feedback('');share();});
    $('visualTranscript').addEventListener('input',()=>{setFollow(false);const matched=recognise($('visualTranscript').value);if(render())feedback(matched?'Picture updated from the explanation.':'No supported topic detected yet. The selected topic is shown.');share();});
    $('nextElement').addEventListener('click',()=>{step=(step+1)%values.length;render();});
    $('sampleExplanation').addEventListener('click',()=>{setFollow(false);$('visualTranscript').value=samples[$('visualTopic').value];recognise($('visualTranscript').value);render();share();feedback('Sample explanation turned into a picture.');});
    $('clearTranscript').addEventListener('click',()=>{if(listening)recognition?.stop();setFollow(false);$('visualTranscript').value='';render();share();feedback('Transcript cleared.');});
    $('saveDiagram').addEventListener('click',()=>{const svg=$('visualDiagram').querySelector('svg');if(!svg)return;const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='classpulse-'+$('visualTopic').value+'.svg';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);});
    const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Speech){$('listenStart').addEventListener('click',()=>{setFollow(false);feedback('Your browser does not support microphone transcription. Type the explanation below or choose Try a sample explanation.');$('visualTranscript').focus();});$('listenStop').addEventListener('click',()=>feedback('No microphone listening session is running.'));feedback('Live microphone transcription is unavailable in this browser. You can use a shared lecturer topic, type an explanation, or try a sample.');}
    else{
      recognition=new Speech();recognition.lang='en-ZA';recognition.continuous=true;recognition.interimResults=true;let base='',finalText='',lastError='';
      recognition.onstart=()=>{listening=true;$('listenStart').disabled=true;$('listenStop').disabled=false;feedback('Listening · your explanation is becoming a picture.');};
      recognition.onresult=e=>{
        let interim='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)finalText+=e.results[i][0].transcript+' ';else interim+=e.results[i][0].transcript;}
        $('visualTranscript').value=(base+' '+finalText+interim).trim().slice(-3000);recognise($('visualTranscript').value);render();
        // Publish only finalised text, while local diagrams can follow interim recognition.
        if(isLecturer&&e.results[e.results.length-1].isFinal)share();
      };
      recognition.onerror=e=>{lastError=({ 'not-allowed':'Microphone access was denied. Allow access in browser settings, or type the explanation.', 'audio-capture':'No microphone is available. Type the explanation instead.', network:'Speech recognition could not connect. Type or paste the explanation instead.', 'no-speech':'No speech was detected. Start listening again or use a sample.', 'language-not-supported':'This speech language is unavailable. Type the explanation instead.' })[e.error]||'Listening stopped. You can continue with typed explanations.';feedback(lastError);};
      recognition.onend=()=>{listening=false;$('listenStart').disabled=false;$('listenStop').disabled=true;feedback(lastError||'Listening stopped. Your picture remains available.');};
      $('listenStart').addEventListener('click',()=>{setFollow(false);base=$('visualTranscript').value;finalText='';lastError='';try{recognition.start();$('listenStart').disabled=true;}catch{$('listenStart').disabled=false;feedback('Could not start listening. Try again or type the explanation.');}});
      $('listenStop').addEventListener('click',()=>recognition.stop());window.addEventListener('pagehide',()=>recognition.abort());
    }
    window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)receive();});
    window.addEventListener('classpulse:sync-error',e=>{if(e.detail.key===KEY)feedback('Your visual update is queued and will retry automatically when connected. Keep this tab open.');});
  });
})();
