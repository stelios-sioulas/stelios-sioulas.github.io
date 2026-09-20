/* Media content from Pages CMS. Existing HTML/CSS controls structure and design. */
(function(){
 const root=document.querySelector('[data-media-cms]');
 if(!root)return;
 const greek=document.documentElement.lang==='el';
 const clean=value=>typeof value==='string'?value.trim():'';
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
   if(parsed.hostname.includes('youtu.be'))id=parsed.pathname.split('/').filter(Boolean)[0]||'';
   else if(parsed.pathname.includes('/embed/'))id=parsed.pathname.split('/embed/')[1]?.split('/')[0]||'';
   else if(parsed.pathname.includes('/shorts/'))id=parsed.pathname.split('/shorts/')[1]?.split('/')[0]||'';
   else id=parsed.searchParams.get('v')||'';
   return id?'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?rel=0':'';
  }catch(error){return '';}
 };
 const instagramEmbed=url=>{
  const match=clean(url).match(/instagram\.com\/(?:reel|p)\/([^/?#]+)/i);
  return match?'https://www.instagram.com/reel/'+match[1]+'/embed/':'';
 };
 const tiktokEmbed=url=>{
  const match=clean(url).match(/\/video\/(\d+)/);
  return match?'https://www.tiktok.com/player/v1/'+match[1]+'?description=1&music_info=1&rel=0':'';
 };
 const renderFeature=(article,item,platform)=>{
  if(!article)return;
  const url=clean(item&&item.url);
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
   link.className=platform+'-link'; link.href=url; link.target='_blank'; link.rel='noopener';
   link.textContent=greek?(platform==='instagram'?'Άνοιγμα στο Instagram ↗':'Άνοιγμα στο TikTok ↗'):(platform==='instagram'?'Open on Instagram ↗':'Open on TikTok ↗');
   copy.appendChild(link);
  }
  if(shell){
   shell.replaceChildren();
   const frame=document.createElement('iframe'); frame.src=embed;
   frame.title=clean(item.iframe_title)||clean(item.title)||platform+' video';
   frame.loading='lazy'; frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
   if(platform==='instagram')frame.scrolling='no'; else frame.allowFullscreen=true;
   shell.appendChild(frame);
  }
 };
 const renderYoutube=(container,items)=>{
  if(!container)return; container.replaceChildren();
  items.forEach(item=>{
   const embed=youtubeEmbed(item.url); if(!embed)return;
   const card=document.createElement('article'); card.className='video-card';
   const frame=document.createElement('iframe'); frame.src=embed;
   frame.title=clean(item.iframe_title)||clean(item.title)||'YouTube video';
   frame.loading='lazy'; frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
   frame.allowFullscreen=true; card.appendChild(frame);
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
  }).catch(error=>console.warn(error.message));
})();
