/* Press Kit content from local CMS data. Existing HTML/CSS controls layout and design. */
(function(){
 const root=document.querySelector('[data-press-kit-cms]');
 if(!root)return;
 const greek=document.documentElement.lang==='el';
 const clean=value=>typeof value==='string'?value.trim():'';
 const safeUrl=value=>{const raw=typeof value==='string'?value.trim():'';if(!raw)return '';try{const parsed=new URL(raw,window.location.href);return parsed.protocol==='https:'?raw:'';}catch{return '';}};
 const local=value=>clean(value&&value[greek?'url_el':'url_en'])||clean(value&&value.url);
 const add=(parent,tag,className,value)=>{
  const text=clean(value); if(!text)return null;
  const node=document.createElement(tag); if(className)node.className=className;
  node.textContent=text; parent.appendChild(node); return node;
 };
 Promise.all([
  fetch('data/press-kit.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Press Kit data unavailable');return r.json();}),
  fetch('data/projects.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Projects data unavailable');return r.json();})
 ]).then(([data,projectData])=>{
  const profile=root.querySelector('[data-press-kit-part="profile"] .panel p');
  const availability=root.querySelector('[data-press-kit-part="availability"] .panel p');
  const profileText=clean(data[greek?'profile_el':'profile_en']);
  const availabilityText=clean(data[greek?'teaching_availability_el':'teaching_availability_en']);
  if(profile){profile.textContent=profileText;profile.hidden=!profileText;}
  if(availability){availability.textContent=availabilityText;availability.hidden=!availabilityText;}

  const grid=root.querySelector('[data-press-kit-part="projects"] .grid');
  if(grid){
   grid.replaceChildren();
   const projects=Array.isArray(projectData.projects)?projectData.projects.filter(item=>item.group==='current'):[];
   projects.forEach(item=>{
    const card=document.createElement('div'); card.className='card';
    add(card,'div','meta',clean(item[greek?'meta_el':'meta_en']));
    add(card,'h3','',item.name);
    add(card,'p','',clean(item[greek?'description_el':'description_en']));
    if(card.childNodes.length)grid.appendChild(card);
   });
  }

  const downloads=root.querySelector('[data-press-kit-part="downloads"]');
  if(downloads){
   const intro=downloads.querySelector('.copy');
   const introText=clean(data[greek?'photo_intro_el':'photo_intro_en']);
   if(intro){intro.textContent=introText;intro.hidden=!introText;}
   const photo=downloads.querySelector('.actions a[download]');
   const photoPath=safeUrl(data.press_photo);
   if(photo){
    photo.hidden=!photoPath;
    if(photoPath){
     photo.href=photoPath.startsWith('/')?photoPath.slice(1):photoPath;
     photo.textContent=clean(data[greek?'photo_button_el':'photo_button_en'])||(greek?'Download press photo':'Download press photo');
    }
   }
   const linkGrid=downloads.querySelector('.link-grid');
   if(linkGrid){
    linkGrid.replaceChildren();
    const links=Array.isArray(data.links)?data.links:[];
    links.forEach(item=>{
     const url=safeUrl(local(item)),label=clean(item.label); if(!url||!label)return;
     const link=document.createElement('a'); link.className='link-card'; link.href=url;
     if(item.external!==false){link.target='_blank';link.rel='noopener noreferrer';link.textContent=label+' ↗';}
     else link.textContent=label+' →';
     linkGrid.appendChild(link);
    });
   }
  }
 }).catch(error=>console.warn(error.message));
})();
