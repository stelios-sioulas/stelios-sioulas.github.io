/* Cinematic hero wordmark + opt-in drum-hit sound.
   Sound is generated locally with Web Audio and only after a user gesture. */
(function(){
  const hero=document.querySelector('.hero[data-profile-cms="hero"]');
  const title=hero&&hero.querySelector('h1');
  if(!hero||!title||title.dataset.drumIntroReady==='1') return;

  const soundButtons=Array.from(document.querySelectorAll('.intro-sound-btn'));
  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const greek=document.documentElement.lang==='el';
  const first='Stelios';
  const second='Sioulas';
  const impactTimers=[];
  let audioContext=null;
  let soundEnabled=false;
  let runId=0;

  title.dataset.drumIntroReady='1';
  title.classList.add('drum-wordmark');
  title.setAttribute('aria-label','Stelios Sioulas');

  function buildLine(text,blue,lineIndex){
    const line=document.createElement('span');
    line.className='drum-name-line'+(blue?' drum-name-line--blue':'');
    line.setAttribute('aria-hidden','true');
    Array.from(text).forEach(function(char,index){
      const letter=document.createElement('span');
      letter.className='drum-letter';
      letter.textContent=char;
      const globalIndex=(lineIndex*first.length)+index;
      const delay=globalIndex*105+(lineIndex?85:0);
      const tilt=((globalIndex%5)-2)*1.35;
      letter.style.setProperty('--drop-delay',delay+'ms');
      letter.style.setProperty('--drop-tilt',tilt+'deg');
      letter.dataset.impactDelay=String(delay+455);
      line.appendChild(letter);
    });
    return line;
  }

  title.textContent='';
  title.appendChild(buildLine(first,false,0));
  title.appendChild(buildLine(second,true,1));

  function clearTimers(){
    while(impactTimers.length) clearTimeout(impactTimers.pop());
  }

  function ensureAudio(){
    if(audioContext) return audioContext;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    audioContext=new AC();
    return audioContext;
  }

  function drumHit(index){
    if(!soundEnabled) return;
    const ctx=ensureAudio();
    if(!ctx) return;
    if(ctx.state==='suspended') ctx.resume().catch(function(){});
    const now=ctx.currentTime;

    const body=ctx.createOscillator();
    const bodyGain=ctx.createGain();
    body.type='sine';
    body.frequency.setValueAtTime(118+(index%4)*5,now);
    body.frequency.exponentialRampToValueAtTime(72,now+.085);
    bodyGain.gain.setValueAtTime(.0001,now);
    bodyGain.gain.exponentialRampToValueAtTime(.028,now+.006);
    bodyGain.gain.exponentialRampToValueAtTime(.0001,now+.11);
    body.connect(bodyGain).connect(ctx.destination);
    body.start(now); body.stop(now+.12);

    const tick=ctx.createOscillator();
    const tickGain=ctx.createGain();
    tick.type='triangle';
    tick.frequency.setValueAtTime(1050+(index%3)*130,now);
    tickGain.gain.setValueAtTime(.012,now);
    tickGain.gain.exponentialRampToValueAtTime(.0001,now+.022);
    tick.connect(tickGain).connect(ctx.destination);
    tick.start(now); tick.stop(now+.025);
  }

  function updateSoundButton(){
    const label=soundEnabled
      ? (greek?'Απενεργοποίηση ήχου intro':'Disable intro sound')
      : (greek?'Ενεργοποίηση ήχου και επανάληψη intro':'Enable sound and replay intro');
    soundButtons.forEach(function(btn){
      btn.classList.toggle('is-playing',soundEnabled);
      btn.classList.toggle('is-off',!soundEnabled);
      btn.setAttribute('aria-pressed',soundEnabled?'true':'false');
      btn.setAttribute('aria-label',label);
      btn.setAttribute('title',label);
    });
  }

  function runIntro(withSound){
    const id=++runId;
    clearTimers();
    const letters=Array.from(title.querySelectorAll('.drum-letter'));

    title.classList.remove('is-animating','is-prepared');
    letters.forEach(function(letter){letter.classList.remove('is-impact');});

    if(reduceMotion){
      if(withSound) drumHit(0);
      return;
    }

    title.classList.add('is-prepared');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(id!==runId) return;
        title.classList.remove('is-prepared');
        title.classList.add('is-animating');

        letters.forEach(function(letter,index){
          const delay=Number(letter.dataset.impactDelay)||0;
          impactTimers.push(setTimeout(function(){
            if(id!==runId) return;
            letter.classList.add('is-impact');
            setTimeout(function(){letter.classList.remove('is-impact');},155);
            if(withSound) drumHit(index);
          },delay));
        });

        impactTimers.push(setTimeout(function(){
          if(id===runId) title.classList.remove('is-animating');
        },2500));
      });
    });
  }

  /* Capture phase prevents the legacy audio-intro click handler from firing. */
  soundButtons.forEach(function(btn){
    btn.addEventListener('click',function(event){
      event.preventDefault();
      event.stopImmediatePropagation();
      soundEnabled=!soundEnabled;
      if(soundEnabled){
        const ctx=ensureAudio();
        if(ctx&&ctx.state==='suspended') ctx.resume().catch(function(){});
        updateSoundButton();
        runIntro(true);
      }else{
        clearTimers();
        updateSoundButton();
      }
    },true);
  });

  updateSoundButton();
  runIntro(false);
})();
