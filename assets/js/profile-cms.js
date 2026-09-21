/* Hero and About content from Pages CMS. Existing HTML/CSS controls structure and design. */
(function(){
 const hero=document.querySelector('.hero[data-profile-cms="hero"]');
 const about=document.querySelector('#about[data-profile-cms="about"]');
 if(!hero&&!about)return;
 const greek=document.documentElement.lang==='el';
 const clean=value=>typeof value==='string'?value.trim():'';
 const translated=(item,key)=>clean(item&&item[key+(greek?'_el':'_en')]);
 fetch('data/profile.json',{cache:'no-store'})
  .then(response=>{if(!response.ok)throw new Error('Profile data unavailable');return response.json();})
  .then(data=>{
   if(hero){
    const kicker=hero.querySelector('.kicker');
    const intro=hero.querySelector('.hero-content > p');
    const kickerText=translated(data.hero,'kicker');
    const introText=translated(data.hero,'intro');
    if(kicker){kicker.textContent=kickerText;kicker.hidden=!kickerText;}
    if(intro){intro.textContent=introText;intro.hidden=!introText;}
   }
   if(about){
    const settings=data.about||{};
    const label=about.querySelector('.section-label');
    const title=about.querySelector('h2');
    const labelText=translated(settings,'label');
    const titleText=translated(settings,'title');
    if(label&&labelText)label.textContent=labelText;
    if(title&&titleText){
     title.textContent=titleText;
     if(title.hasAttribute('aria-label'))title.setAttribute('aria-label',titleText);
     if(title.dataset.text!==undefined)title.dataset.text=titleText;
    }
    const container=about.querySelector('.section-body')||about.querySelector('.wrap');
    if(!container)return;
    Array.from(container.children).filter(node=>node.tagName==='P').forEach(node=>node.remove());
    const anchor=container.querySelector('.photo-about');
    const fragment=document.createDocumentFragment();
    const aboutText=clean(data[greek?'about_text_el':'about_text_en']);
    const paragraphs=aboutText?aboutText.split(/\n\s*\n/).map(text=>text.trim()).filter(Boolean):[];
    paragraphs.forEach(content=>{
     const paragraph=document.createElement('p'); paragraph.textContent=content; fragment.appendChild(paragraph);
    });
    if(anchor)anchor.before(fragment); else container.appendChild(fragment);
   }
  }).catch(error=>console.warn(error.message));
})();
