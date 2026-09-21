/* Shared contact and social links from Pages CMS. Form handling and design stay in HTML. */
(function(){
 const clean=value=>typeof value==='string'?value.trim():'';
 const greek=document.documentElement.lang==='el';
 const platformOf=anchor=>{
  const href=(anchor.getAttribute('href')||'').toLowerCase();
  const label=(anchor.getAttribute('aria-label')||'').toLowerCase();
  if(href.includes('facebook.com')||label.includes('facebook'))return 'facebook';
  if(href.includes('instagram.com')||label.includes('instagram'))return 'instagram';
  if(href.includes('tiktok.com')||label.includes('tiktok'))return 'tiktok';
  if(href.includes('youtube.com')||href.includes('youtu.be')||label.includes('youtube'))return 'youtube';
  return '';
 };
 fetch('data/contact.json',{cache:'no-store'})
  .then(response=>{if(!response.ok)throw new Error('Contact data unavailable');return response.json();})
  .then(data=>{
   const socials=data.socials||{};
   const syncLinks=()=>{
    document.querySelectorAll('a[href], a[aria-label]').forEach(anchor=>{
     const platform=platformOf(anchor); if(!platform)return;
     const url=clean(socials[platform]);
     if(url){
      anchor.href=url; anchor.hidden=false;
      if(!anchor.hasAttribute('target'))anchor.target='_blank';
      if(!anchor.hasAttribute('rel'))anchor.rel='noopener';
     }else anchor.hidden=true;
    });
   };
   syncLinks();
   const observer=new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes.length||mutation.removedNodes.length))syncLinks();
   });
   observer.observe(document.body,{childList:true,subtree:true});

   const contact=document.querySelector('#contact[data-contact-cms]');
   if(contact){
    const availability=contact.querySelector('.availability strong');
    const text=clean(data[greek?'availability_el':'availability_en']);
    if(availability){availability.textContent=text;availability.hidden=!text;}
   }
  }).catch(error=>console.warn(error.message));
})();
