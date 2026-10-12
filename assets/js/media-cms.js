/* Media content from Pages CMS. Existing HTML/CSS controls structure and design. */
(function(){
 const root=document.querySelector('[data-media-cms]');
 if(!root)return;
 const greek=document.documentElement.lang==='el';
 const clean=value=>typeof value==='string'?value.trim():'';
 const safeUrl=value=>{const raw=typeof value==='string'?value.trim():'';if(!raw)return '';try{const parsed=new URL(raw,window.location.href);return parsed.protocol==='https:'?raw:'';}catch{return '';}};
 const value=(item,key)=>clean(item[key+(greek?'_el':'_en')])||clean(item[key]);
 const add=(parent,tag,className,content)=>{
  const text=clean(content); if(!text)return null;
  const node=document.createElement(tag); if(className)node.className=className;
  node.textContent=text; parent.appendChild(node); return node;
 };
 const youtubeEmbed=url=>{
  const raw=clean(url); if(!raw)return '';
  try{
   const parsed=new URL(raw,location.href);
   let id='';
   if(parsed.protocol!=='https:'||parsed.username||parsed.password||!['youtu.be','www.youtube.com','youtube.com','www.youtube-nocookie.com'].includes(parsed.hostname))return '';
   if(parsed.hostname==='youtu.be')id=parsed.pathname.split('/').filter(Boolean)[0]||'';
   else if(parsed.pathname.includes('/embed/'))id=parsed.pathname.split('/embed/')[1]?.split('/')[0]||'';
   else if(parsed.pathname.includes('/shorts/'))id=parsed.pathname.split('/shorts/')[1]?.split('/')[0]||'';
   else id=parsed.searchParams.get('v')||'';
   return /^[\w-]{11}$/.test(id)?'https://www.youtube-nocookie.com/embed/'+id+'?rel=0':'';
  }catch(error){return '';}
 };
 const instagramEmbed=url=>{
  try{
   const parsed=new URL(url);
   if(parsed.protocol!=='https:'||parsed.username||parsed.password||!['instagram.com','www.instagram.com'].includes(parsed.hostname))return '';
   const match=parsed.pathname.match(/^\/(?:reel|p)\/([\w-]+)\/?$/);
   return match?'https://www.instagram.com/reel/'+match[1]+'/embed/':'';
  }catch{return '';}
 };
 const tiktokEmbed=url=>{
  try{
   const parsed=new URL(url);
   if(parsed.protocol!=='https:'||parsed.username||parsed.password||!['tiktok.com','www.tiktok.com'].includes(parsed.hostname))return '';
   const match=parsed.pathname.match(/^\/@[\w.-]+\/video\/(\d{16,22})\/?$/);
   return match?'https://www.tiktok.com/player/v1/'+match[1]+'?description=1&music_info=1&rel=0':'';
  }catch{return '';}
 };
 const renderFeature=(article,item,platform)=>{
  if(!article)return;
  const url=safeUrl(item&&item.url);
  const embed=platform==='instagram'?instagramEmbed(url):tiktokEmbed(url);
  if(!url||!embed){article.hidden=true;return;}
  article.hidden=false;
  const copy=article.querySelector(platform==='instagram'?'.instagram-intro-copy':'.tiktok-intro-copy');
  const shell=article.querySelector(platform==='instagram'?'.instagram-embed-shell':'.tiktok-player-shell');
  if(copy){
   copy.replaceChildren();
   add(copy,'div','meta',value(item,'meta'));
   add(copy,'h3','',clean(item.title));
   add(copy,'p','',value(item,'description'));
   const link=document.createElement('a');
   link.className=platform+'-link'; link.href=url; link.target='_blank'; link.rel='noopener noreferrer';
   link.textContent=greek?(platform==='instagram'?'Άνοιγμα στο Instagram ↗':'Άνοιγμα στο TikTok ↗'):(platform==='instagram'?'Open on Instagram ↗':'Open on TikTok ↗');
   copy.appendChild(link);
  }
  if(shell){
   shell.replaceChildren();
   const player=window.siteEmbeds.create({src:embed,title:clean(item.iframe_title)||clean(item.title)||platform+' video'});
   if(player)shell.appendChild(player);
  }
 };
 const renderYoutube=(container,items)=>{
  if(!container)return; container.replaceChildren();
  items.forEach(item=>{
   const embed=youtubeEmbed(item.url); if(!embed)return;
   const card=document.createElement('article'); card.className='video-card';
   const player=window.siteEmbeds.create({src:embed,title:clean(item.iframe_title)||clean(item.title)||'YouTube video'});
   if(!player)return;
   card.appendChild(player);
   const copy=document.createElement('div'); copy.className='video-copy';
   add(copy,'div','meta',value(item,'meta')); add(copy,'h3','',clean(item.title)); add(copy,'p','',value(item,'description'));
   card.appendChild(copy); container.appendChild(card);
  });
 };
 fetch('data/media.json',{cache:'no-store'})
  .then(response=>{if(!response.ok)throw new Error('Media data unavailable');return response.json();})
  .then(data=>{
   renderFeature(root.querySelector('.instagram-feature'),data.instagram||{},'instagram');
   renderFeature(root.querySelector('.tiktok-feature'),data.tiktok||{},'tiktok');
   renderYoutube(root.querySelector('.video-grid, .media-grid'),Array.isArray(data.youtube_videos)?data.youtube_videos:[]);
   root.dataset.mediaReady='true';
  }).catch(error=>console.warn(error.message));
})();
