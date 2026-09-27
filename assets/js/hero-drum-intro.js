/* Sequential top-down hero wordmark animation.
   Audio stays entirely under the existing Stelios intro player. */
(function(){
  const hero=document.querySelector('.hero[data-profile-cms="hero"]');
  const title=hero&&hero.querySelector('h1');
  if(!hero||!title||title.dataset.drumIntroReady==='linear') return;

  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const first='Stelios';
  const second='Sioulas';
  const timers=[];
  let runId=0;
  let lastRunAt=0;

  title.dataset.drumIntroReady='linear';
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
    while(timers.length) clearTimeout(timers.pop());
  }

  function runIntro(){
    lastRunAt=Date.now();
    const id=++runId;
    clearTimers();
    const letters=Array.from(title.querySelectorAll('.drum-letter'));

    title.classList.remove('is-animating','is-prepared');
    letters.forEach(function(letter){letter.classList.remove('is-impact');});

    if(reduceMotion) return;

    title.classList.add('is-prepared');
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(id!==runId) return;
        title.classList.remove('is-prepared');
        title.classList.add('is-animating');

        letters.forEach(function(letter){
          const delay=Number(letter.dataset.impactDelay)||0;
          timers.push(setTimeout(function(){
            if(id!==runId) return;
            letter.classList.add('is-impact');
            timers.push(setTimeout(function(){letter.classList.remove('is-impact');},155));
          },delay));
        });

        timers.push(setTimeout(function(){
          if(id===runId) title.classList.remove('is-animating');
        },2500));
      });
    });
  }

  /* Start visually on page load. If the audio player starts at almost the same
     moment, don't restart the letters. Manual audio replay later replays them. */
  runIntro();

  window.addEventListener('stelios:intro-play',function(){
    if(Date.now()-lastRunAt>1100) runIntro();
  });
})();
