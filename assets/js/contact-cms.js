/* Shared contact and social links from Pages CMS. Form handling and design stay in HTML. */
(function(){
 const clean=value=>typeof value==='string'?value.trim():'';
 const safeUrl=value=>{const raw=typeof value==='string'?value.trim():'';if(!raw)return '';try{const parsed=new URL(raw,window.location.href);return parsed.protocol==='https:'?raw:'';}catch{return '';}};
 const greek=document.documentElement.lang==='el';
 const key=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const platformOf=anchor=>{
  const explicit=clean(anchor.dataset.socialPlatform); if(explicit)return key(explicit);
  const href=(anchor.getAttribute('href')||'').toLowerCase();
  const label=(anchor.getAttribute('aria-label')||'').toLowerCase();
  if(href.includes('facebook.com')||label.includes('facebook'))return 'facebook';
  if(href.includes('instagram.com')||label.includes('instagram'))return 'instagram';
  if(href.includes('tiktok.com')||label.includes('tiktok'))return 'tiktok';
  if(href.includes('youtube.com')||href.includes('youtu.be')||label.includes('youtube'))return 'youtube';
  return '';
 };
 const genericIcon=()=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
  svg.setAttribute('stroke-width','1.9');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
  const p1=document.createElementNS(svg.namespaceURI,'path');p1.setAttribute('d','M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1');
  const p2=document.createElementNS(svg.namespaceURI,'path');p2.setAttribute('d','M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1');
  svg.append(p1,p2);return svg;
 };
 const createExtraLink=(item,kind)=>{
  const link=document.createElement('a');link.href=safeUrl(item.url);link.target='_blank';link.rel='noopener noreferrer';
  link.dataset.cmsSocialExtra='true';link.dataset.socialPlatform=key(item.platform||item.label);
  const label=clean(item.label)||clean(item.platform)||'Link';
  link.setAttribute('aria-label',label);
  link.appendChild(genericIcon());
  if(kind!=='icons'){const span=document.createElement('span');span.textContent=label;link.appendChild(span);}
  if(kind==='press'){link.className='link-card';link.replaceChildren(document.createTextNode(label+' ↗'));}
  else if(kind==='contact')link.className='contact-social';
  return link;
 };
 fetch('data/contact.json',{cache:'no-store'})
  .then(response=>{if(!response.ok)throw new Error('Contact data unavailable');return response.json();})
  .then(data=>{
   const items=Array.isArray(data.socials)?data.socials.filter(item=>clean(item.url)):[];
   const byPlatform=new Map(items.map(item=>[key(item.platform||item.label),item]));
   const syncLinks=()=>{
    document.querySelectorAll('.contact-socials a, .social-row a, .social-icons a, [data-press-kit-part="downloads"] .link-grid a').forEach(anchor=>{
     if(anchor.dataset.cmsSocialExtra)return;
     const platform=platformOf(anchor);if(!platform)return;
     const item=byPlatform.get(platform);
     if(item){
      const label=clean(item.label)||clean(item.platform)||platform;
      anchor.href=safeUrl(item.url);anchor.hidden=false;anchor.setAttribute('aria-label',label);
      const text=anchor.querySelector('span');
      if(text&&text.textContent!==label)text.textContent=label;
      else if(anchor.matches('[data-press-kit-part="downloads"] .link-grid a')&&anchor.textContent!==label+' ↗')anchor.textContent=label+' ↗';
     }
     else anchor.hidden=true;
    });
    const extras=items.filter(item=>!['facebook','instagram','tiktok','youtube'].includes(key(item.platform||item.label)));
    const targets=[
     ...Array.from(document.querySelectorAll('.contact-socials')).map(node=>({node,kind:'contact'})),
     ...Array.from(document.querySelectorAll('.social-row')).map(node=>({node,kind:'row'})),
     ...Array.from(document.querySelectorAll('.social-icons')).map(node=>({node,kind:'icons'})),
     ...Array.from(document.querySelectorAll('[data-press-kit-part="downloads"] .link-grid')).map(node=>({node,kind:'press'}))
    ];
    targets.forEach(({node,kind})=>extras.forEach(item=>{
     const platform=key(item.platform||item.label);
     if(!platform||node.querySelector('[data-cms-social-extra][data-social-platform="'+platform+'"]'))return;
     node.appendChild(createExtraLink(item,kind));
    }));
   };
   syncLinks();
   const observer=new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes.length))syncLinks();
   });
   observer.observe(document.body,{childList:true,subtree:true});
   const contact=document.querySelector('#contact[data-contact-cms]');
   if(contact){
    const availability=contact.querySelector('.availability');
    const availabilityText=availability&&availability.querySelector('strong');
    const text=clean(data[greek?'availability_el':'availability_en']);
    if(availability){
     if(availabilityText&&text)availabilityText.textContent=text;
     availability.hidden=!text;
    }
   }
  }).catch(error=>console.warn(error.message));
})();
