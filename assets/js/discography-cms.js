/* Discography content from Pages CMS. Layout and styles remain in the existing HTML/CSS. */
(function(){
  const root=document.querySelector('[data-discography-cms]');
  if(!root)return;

  const greek=document.documentElement.lang==='el';
  const text=(value)=>typeof value==='string'?value.trim():'';
  const add=(parent,tag,className,value)=>{
    const clean=text(value);
    if(!clean)return null;
    const node=document.createElement(tag);
    if(className)node.className=className;
    node.textContent=clean;
    parent.appendChild(node);
    return node;
  };
  const sentence=(value)=>{
    const clean=text(value);
    return clean && !/[.!?…]$/.test(clean)?clean+'.':clean;
  };

  fetch('data/discography.json',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error('Discography data unavailable');return response.json();})
    .then(data=>{
      const releases=Array.isArray(data.releases)?data.releases:[];
      if(root.dataset.discographyCms==='page'){
        const catalogue=root.querySelector('.catalogue');
        if(!catalogue)return;
        catalogue.replaceChildren();
        releases.forEach(item=>{
          const row=document.createElement('div');
          row.className='release';
          add(row,'div','year',item.year);
          add(row,'div','artist',item.artist);
          const titleWrap=document.createElement('div');
          const heading=add(titleWrap,'h3','',item.title);
          const status=text(greek?item.status_el:item.status_en);
          if(heading&&status){
            heading.append(' ');
            add(heading,'span','status',status);
          }
          row.appendChild(titleWrap);
          const credit=add(row,'div','credit',item.credit);
          const url=text(item.url);
          if(url&&heading){
            const link=document.createElement('a');
            link.href=url;
            link.target='_blank';
            link.rel='noopener';
            link.textContent=heading.firstChild?heading.firstChild.nodeValue:text(item.title);
            heading.firstChild.replaceWith(link);
          }
          catalogue.appendChild(row);
        });
        return;
      }

      const grid=root.querySelector('.grid, .record-grid');
      if(!grid)return;
      grid.replaceChildren();
      releases.filter(item=>item.show_on_home!==false).forEach(item=>{
        const card=document.createElement('article');
        card.className='card';
        const status=text(greek?item.status_el:item.status_en);
        const meta=[status||text(item.year),text(item.artist)].filter(Boolean).join(' · ');
        add(card,'div','meta',meta);
        const heading=add(card,'h3','',item.title);
        const url=text(item.url);
        if(url&&heading){
          const link=document.createElement('a');
          link.href=url;
          link.target='_blank';
          link.rel='noopener';
          link.textContent=heading.textContent;
          heading.replaceChildren(link);
        }
        add(card,'p','',sentence(item.credit));
        grid.appendChild(card);
      });
    })
    .catch(error=>console.warn(error.message));
})();
