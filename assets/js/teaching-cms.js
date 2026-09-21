/* Teaching content from Pages CMS. Existing HTML/CSS controls structure and design. */
(function(){
 const root=document.querySelector('[data-teaching-cms]');
 if(!root)return;
 const greek=document.documentElement.lang==='el';
 const clean=value=>typeof value==='string'?value.trim():'';
 const value=(item,key)=>clean(item[key+(greek?'_el':'_en')])||clean(item[key]);
 const add=(parent,tag,className,content)=>{
  const text=clean(content); if(!text)return null;
  const node=document.createElement(tag); if(className)node.className=className;
  node.textContent=text; parent.appendChild(node); return node;
 };
 const renderSchools=(container,items,homeMobile)=>{
  if(!container)return; container.replaceChildren();
  items.forEach(item=>{
   if(homeMobile){
    const row=document.createElement('div'); row.className='teaching-item';
    add(row,'strong','',value(item,'name')); add(row,'span','',value(item,'place'));
    if(row.childNodes.length)container.appendChild(row);
   }else{
    const card=document.createElement('article'); card.className='card';
    add(card,'div','meta',value(item,'place')); add(card,'h3','',value(item,'name'));
    if(card.childNodes.length)container.appendChild(card);
   }
  });
 };
 const renderCards=(container,items)=>{
  if(!container)return; container.replaceChildren();
  items.forEach(item=>{
   const card=document.createElement('div'); card.className='card';
   add(card,'div','meta',value(item,'meta')); add(card,'h3','',value(item,'title')); add(card,'p','',value(item,'description'));
   if(card.childNodes.length)container.appendChild(card);
  });
 };
 const renderReels=(container,items)=>{
  if(!container)return; container.replaceChildren();
  items.forEach(item=>{
   const card=document.createElement('div'); card.className='reel-card';
   const copy=document.createElement('div');
   add(copy,'div','meta',value(item,'meta')); add(copy,'h3','',value(item,'title')); add(copy,'p','',value(item,'description'));
   if(copy.childNodes.length)card.appendChild(copy);
   const url=clean(item.url);
   if(url){
    const link=document.createElement('a'); link.className='reel-link'; link.href=url;
    link.target='_blank'; link.rel='noopener noreferrer';
    const youtube=/youtu\.be|youtube\.com/i.test(url);
    const instagram=/instagram\.com/i.test(url);
    link.textContent=greek
     ?(youtube?'Άνοιγμα στο YouTube ↗':instagram?'Άνοιγμα στο Instagram ↗':'Δες το video ↗')
     :(youtube?'Watch on YouTube ↗':instagram?'Watch on Instagram ↗':'Watch video ↗'); card.appendChild(link);
   }
   if(card.childNodes.length)container.appendChild(card);
  });
 };
 fetch('data/teaching.json',{cache:'no-store'})
  .then(response=>{if(!response.ok)throw new Error('Teaching data unavailable');return response.json();})
  .then(data=>{
   const schools=Array.isArray(data.schools)?data.schools:[];
   if(root.dataset.teachingCms==='home'){
    const mobile=!!root.querySelector('.teaching-list');
    renderSchools(root.querySelector(mobile?'.teaching-list':'.grid'),schools,mobile);
    return;
   }
   renderCards(root.querySelector('[data-teaching-part="focus"] .grid'),Array.isArray(data.focus)?data.focus:[]);
   renderReels(root.querySelector('[data-teaching-part="exercise"] .reel-grid'),Array.isArray(data.exercise_reels)?data.exercise_reels:[]);
   renderReels(root.querySelector('[data-teaching-part="performance"] .reel-grid'),Array.isArray(data.performance_reels)?data.performance_reels:[]);
   const locations=root.querySelector('[data-teaching-part="experience"] .locations');
   if(locations){
    locations.replaceChildren();
    schools.forEach(item=>{
     const row=document.createElement('div'); row.className='location';
     add(row,'strong','',value(item,'name')); add(row,'span','',value(item,'place'));
     if(row.childNodes.length)locations.appendChild(row);
    });
   }
  }).catch(error=>console.warn(error.message));
})();
