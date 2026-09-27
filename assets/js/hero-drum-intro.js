/* Waveform-synchronised Stelios Sioulas wordmark.
   Analyses the real assets/stelios-intro.mp3 in the browser, detects strong
   waveform peaks and makes letters land on those peaks in a shuffled order. */
(function(){
  const hero=document.querySelector('.hero[data-profile-cms="hero"]');
  const title=hero&&hero.querySelector('h1');
  if(!hero||!title||title.dataset.drumIntroReady==='waveform') return;

  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const first='Stelios';
  const second='Sioulas';
  const timers=[];
  let peakTimes=null;
  let activeAudio=null;
  let runToken=0;

  title.dataset.drumIntroReady='waveform';
  title.classList.add('drum-wordmark');
  title.setAttribute('aria-label','Stelios Sioulas');

  function buildLine(text,blue){
    const line=document.createElement('span');
    line.className='drum-name-line'+(blue?' drum-name-line--blue':'');
    line.setAttribute('aria-hidden','true');
    Array.from(text).forEach(function(char){
      const letter=document.createElement('span');
      letter.className='drum-letter';
      letter.textContent=char;
      line.appendChild(letter);
    });
    return line;
  }

  title.textContent='';
  title.appendChild(buildLine(first,false));
  title.appendChild(buildLine(second,true));

  const letters=Array.from(title.querySelectorAll('.drum-letter'));

  function clearTimers(){
    while(timers.length) clearTimeout(timers.pop());
  }

  function revealAll(){
    title.classList.remove('is-synced-intro');
    letters.forEach(function(letter){
      letter.classList.remove('is-falling','is-impact');
      letter.classList.add('is-landed');
    });
  }

  function shuffledLetters(){
    const items=letters.slice();
    for(let i=items.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      const tmp=items[i]; items[i]=items[j]; items[j]=tmp;
    }
    return items;
  }

  function randomiseTrajectory(letter,index){
    const side=(Math.random()<.5?-1:1);
    const xStart=side*(10+Math.random()*42);
    const xMid=-side*(2+Math.random()*12);
    const yStart=-(72+Math.random()*105);
    const rotStart=side*(4+Math.random()*15);
    const rotMid=-side*(1+Math.random()*4);
    const duration=500+Math.random()*250;
    letter.style.setProperty('--x-start',xStart.toFixed(1)+'px');
    letter.style.setProperty('--x-mid',xMid.toFixed(1)+'px');
    letter.style.setProperty('--y-start',yStart.toFixed(1)+'px');
    letter.style.setProperty('--rot-start',rotStart.toFixed(1)+'deg');
    letter.style.setProperty('--rot-mid',rotMid.toFixed(1)+'deg');
    letter.style.setProperty('--fall-duration',Math.round(duration)+'ms');
    letter.dataset.fallDuration=String(duration);
  }

  function scheduleForAudio(audio){
    activeAudio=audio;
    const token=++runToken;
    clearTimers();

    if(reduceMotion||!peakTimes||peakTimes.length<letters.length){
      revealAll();
      return;
    }

    const order=shuffledLetters();
    title.classList.add('is-synced-intro');
    letters.forEach(function(letter,index){
      letter.classList.remove('is-falling','is-landed','is-impact');
      randomiseTrajectory(letter,index);
    });

    const current=Math.max(0,audio.currentTime||0);
    const usable=peakTimes.slice(0,letters.length);

    order.forEach(function(letter,index){
      const impactAt=usable[index];
      const duration=(Number(letter.dataset.fallDuration)||620)/1000;
      const startAt=Math.max(0,impactAt-duration);
      const startDelay=Math.max(0,(startAt-current)*1000);
      const impactDelay=Math.max(0,(impactAt-current)*1000);

      if(impactAt<=current+.03){
        letter.classList.add('is-landed');
        return;
      }

      timers.push(setTimeout(function(){
        if(token!==runToken||audio!==activeAudio) return;
        letter.classList.remove('is-landed');
        void letter.offsetWidth;
        letter.classList.add('is-falling');
      },startDelay));

      timers.push(setTimeout(function(){
        if(token!==runToken||audio!==activeAudio) return;
        letter.classList.remove('is-falling');
        letter.classList.add('is-landed','is-impact');
        timers.push(setTimeout(function(){letter.classList.remove('is-impact');},180));
      },impactDelay));
    });

    const endAt=usable[usable.length-1]+.22;
    timers.push(setTimeout(function(){
      if(token===runToken) revealAll();
    },Math.max(0,(endAt-current)*1000)));
  }

  function detectPeaks(buffer,count){
    const channel=buffer.getChannelData(0);
    const sr=buffer.sampleRate;
    const hop=Math.max(1,Math.floor(sr*.018));
    const envelope=[];

    for(let start=0;start<channel.length;start+=hop){
      let sum=0;
      const end=Math.min(channel.length,start+hop);
      for(let i=start;i<end;i++) sum+=channel[i]*channel[i];
      envelope.push(Math.sqrt(sum/Math.max(1,end-start)));
    }

    const candidates=[];
    for(let i=2;i<envelope.length-2;i++){
      const value=envelope[i];
      if(value>=envelope[i-1]&&value>=envelope[i+1]&&value>=envelope[i-2]&&value>=envelope[i+2]){
        candidates.push({time:(i*hop)/sr,value:value});
      }
    }
    candidates.sort(function(a,b){return b.value-a.value});

    const picked=[];
    const minGap=Math.max(.16,Math.min(.34,buffer.duration/(count*2.05)));
    for(const candidate of candidates){
      if(candidate.time<.16||candidate.time>buffer.duration-.12) continue;
      if(picked.every(function(item){return Math.abs(item.time-candidate.time)>=minGap;})){
        picked.push(candidate);
        if(picked.length>=count) break;
      }
    }

    picked.sort(function(a,b){return a.time-b.time});

    /* If the waveform has too few isolated transients, fill from evenly spaced
       moments so every letter still completes before the audio ends. */
    while(picked.length<count){
      const index=picked.length;
      const time=.22+(buffer.duration-.5)*(index/(Math.max(1,count-1)));
      if(picked.every(function(item){return Math.abs(item.time-time)>.09})) picked.push({time:time,value:0});
      else picked.push({time:Math.min(buffer.duration-.12,time+.1),value:0});
      picked.sort(function(a,b){return a.time-b.time});
    }

    /* Stretch the selected sequence across the musical intro: the first letters
       arrive after the opening transient and the final letters land near the
       last strong section rather than finishing prematurely. */
    const times=picked.slice(0,count).map(function(item){return item.time;});
    return times;
  }

  function analyseWaveform(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC||reduceMotion){
      window.__steliosWaveformReady=true;
      window.dispatchEvent(new CustomEvent('stelios:waveform-ready'));
      return;
    }

    const ctx=new AC();
    fetch('assets/stelios-intro.mp3?v=20260919',{cache:'force-cache'})
      .then(function(response){if(!response.ok) throw new Error('intro audio unavailable');return response.arrayBuffer();})
      .then(function(data){return ctx.decodeAudioData(data);})
      .then(function(buffer){
        peakTimes=detectPeaks(buffer,letters.length);
      })
      .catch(function(){peakTimes=null;})
      .finally(function(){
        try{ctx.close();}catch(e){}
        window.__steliosWaveformReady=true;
        window.dispatchEvent(new CustomEvent('stelios:waveform-ready'));
      });
  }

  window.addEventListener('stelios:intro-play',function(event){
    const audio=event.detail&&event.detail.audio;
    if(audio) scheduleForAudio(audio);
  });

  window.addEventListener('stelios:intro-stop',function(){
    runToken++;
    activeAudio=null;
    clearTimers();
    revealAll();
  });

  revealAll();
  analyseWaveform();
})();
