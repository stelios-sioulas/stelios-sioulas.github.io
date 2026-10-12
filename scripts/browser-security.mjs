// Run in the GitHub validation environment using its installed Chrome.
// Provider frames and all form submissions are intercepted; no email is sent.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const root = process.cwd();
const config = JSON.parse(await readFile('security.config.json','utf8'));
const baseline = process.env.BASELINE_ROOT;
const report = path.join(root,'qa-reports');
await mkdir(report,{recursive:true});
const server=createServer(async(request,response)=>{
  try {
    const url=new URL(request.url,'http://localhost');
    const old=url.pathname.startsWith('/baseline/');
    const base=old&&baseline?path.resolve(baseline):root;
    const route=old?url.pathname.slice('/baseline'.length):url.pathname;
    const file=path.resolve(base,`.${route.endsWith('/')?route+'index.html':route}`);
    if(!file.startsWith(base+path.sep))throw new Error();
    let data=await readFile(file);
    // Root-relative new assets belong to the candidate. Old sources use relative assets.
    const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
    response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});response.end(data);
  }catch{response.writeHead(404);response.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const profile=await mkdtemp(path.join(tmpdir(),'music-security-'));
const chrome=spawn(process.env.CHROME_PATH||'/usr/bin/google-chrome',['--headless','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeError,log='';chrome.on('error',error=>{chromeError=error;});chrome.stderr.on('data',data=>{log=(log+data).slice(-10000);});
chrome.on('exit',(code,signal)=>{chromeError=new Error(`Chrome exited (${code??signal}): ${log}`);});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let socket;
try {
  let target;
  for(let i=0;i<120;i++){
    if(chromeError)throw chromeError;
    try{const port=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();break;}catch{await delay(250);}
  }
  assert.ok(target?.webSocketDebuggerUrl,log);
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let sequence=0;const pending=new Map();
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  let contactMode='success',held=[],requests=[],mediaRequests=[],failMedia=false;
  const violations=[],exceptions=[],interceptErrors=[];
  const fulfill=(id,body,status=200,contentType='application/json')=>send('Fetch.fulfillRequest',{requestId:id,responseCode:status,responseHeaders:[{name:'Content-Type',value:contentType},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(body).toString('base64')});
  socket.addEventListener('message',event=>{
    const message=JSON.parse(String(event.data));
    if(message.method==='Runtime.exceptionThrown'){exceptions.push(message.params.exceptionDetails);return;}
    if(message.method==='Runtime.consoleAPICalled'&&message.params.type==='error')return;
    if(message.method==='Fetch.requestPaused'){
      const {requestId,request}=message.params;const url=new URL(request.url);
      let operation;
      if(url.hostname==='formspree.io'){
        requests.push(request);
        if(contactMode==='hold'){held.push(requestId);return;}
        operation=contactMode==='network'?send('Fetch.failRequest',{requestId,errorReason:'Failed'}):fulfill(requestId,contactMode==='unconfirmed'?'{}':contactMode==='malformed'?'<html>challenge</html>':contactMode==='error'?'{}':'{"ok":true}',contactMode==='error'?422:200);
      }else if(config.frameOrigins.includes(url.origin)||url.hostname==='www.youtube.com'){
        mediaRequests.push(request);operation=fulfill(requestId,'<!doctype html><title>Test player</title><p>Intercepted provider player</p>',200,'text/html');
      }else if(failMedia&&url.pathname.endsWith('/data/media.json'))operation=send('Fetch.failRequest',{requestId,errorReason:'Failed'});
      else if(url.hostname===new URL(base).hostname||['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)||config.imageSources?.includes(request.url))operation=send('Fetch.continueRequest',{requestId});
      else operation=send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});
      operation.catch(error=>interceptErrors.push(error.message));return;
    }
    const operation=pending.get(message.id);if(!operation)return;pending.delete(message.id);
    if(message.error)operation.reject(new Error(message.error.message));else operation.resolve(message.result);
  });
  const evaluate=async expression=>{
    const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result?.value;
  };
  const waitFor=async expression=>{for(let i=0;i<100;i++){try{if(await evaluate(expression))return;}catch{}await delay(50);}throw new Error('Timed out: '+expression);};
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__cspViolations.push({directive:e.effectiveDirective,url:e.blockedURI}));window.__printCalls=0;window.print=()=>window.__printCalls++;`});
  const resize=width=>send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  const navigate=async file=>{
    await send('Page.navigate',{url:base+'/'+file});
    await waitFor(`location.pathname===${JSON.stringify('/'+file)}&&document.readyState==='complete'`);
    await evaluate('document.fonts.ready.then(()=>true)');await delay(100);
  };
  const screenshot=async name=>{const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(path.join(report,name+'.png'),Buffer.from(result.data,'base64'));};
  const pages=(await readdir(root)).filter(file=>file.endsWith('.html')&&!file.startsWith('google'));
  const oldPages=baseline?new Set(await readdir(baseline)):new Set();
  const visualProbe=()=>evaluate(`(()=>{
    const styles={};for(const selector of ['.hero','h1','#about','#projects','#discography','#live','#media']){
      const node=document.querySelector(selector);if(!node)continue;
      const rect=node.getBoundingClientRect(),css=getComputedStyle(node);
      styles[selector]={width:rect.width,height:rect.height,font:css.fontFamily,size:css.fontSize,color:css.color};
    }return {styles,overflow:document.documentElement.scrollWidth};
  })()`);
  let checks=0;
  // Visit every route under its real meta CSP at desktop and mobile widths.
  for(const width of [320,390,768,1280]){
    await resize(width);
    for(const file of pages){
      // At these widths the homepage redirects to the separate mobile layout.
      if(config.clickToLoad&&width<=820&&['index.html','index-el.html'].includes(file))continue;
      let old;
      if(oldPages.has(file)){
        await navigate('baseline/'+file);
        if(config.clickToLoad&&['index.html','index-el.html','mobile.html','mobile-el.html'].includes(file))await delay(300);
        old=await visualProbe();
      }
      await navigate(file);
      if(config.clickToLoad&&['index.html','index-el.html','mobile.html','mobile-el.html'].includes(file))await waitFor(`document.querySelector('[data-media-cms]')?.dataset.mediaReady==='true'`);
      assert.equal((await evaluate('window.__cspViolations')).length,0,`Unexpected CSP block: ${file} @ ${width}`);
      const current=await visualProbe();
      assert.ok(current.overflow<=Math.max(width,old?.overflow||width)+1,`New horizontal overflow: ${file} @ ${width}`);
      if(old)for(const [selector,previous]of Object.entries(old.styles)){
        const next=current.styles[selector];assert.ok(next);
        assert.equal(next.font,previous.font,`Font changed: ${file} ${selector}`);
        assert.equal(next.size,previous.size,`Font size changed: ${file} ${selector}`);
        assert.equal(next.color,previous.color,`Color changed: ${file} ${selector}`);
        assert.ok(Math.abs(next.width-previous.width)<2,`Width changed: ${file} ${selector}`);
        assert.ok(Math.abs(next.height-previous.height)<3,`Height changed: ${file} ${selector}: ${previous.height} -> ${next.height}`);
      }
      if(file.startsWith('press-kit')){await evaluate(`document.querySelector('[data-print-page]').click()`);assert.equal(await evaluate('window.__printCalls'),1);}
      checks++;
    }
  }
  if(config.clickToLoad){
    for(const file of ['index.html','index-el.html','mobile.html','mobile-el.html']){
      await resize(file.startsWith('mobile')?390:1280);mediaRequests=[];
      await navigate(file);await waitFor(`document.querySelector('[data-media-cms]')?.dataset.mediaReady==='true'`);
      assert.equal(await evaluate("document.querySelectorAll('iframe').length"),0,file);
      assert.equal(mediaRequests.length,0,'No provider request before selection');
      await evaluate(`document.querySelector('#media').scrollIntoView()`);await screenshot(file.replace('.html','')+'-players-idle');
      const count=await evaluate("document.querySelectorAll('.embed-consent').length");
      for(let i=0;i<count;i++){
        const before=await evaluate(`(()=>{const r=document.querySelectorAll('.embed-consent')[${i}].getBoundingClientRect();return {w:r.width,h:r.height};})()`);
        await evaluate(`document.querySelectorAll('.embed-consent')[${i}].querySelector('[data-embed-load]').click()`);
        await waitFor(`document.querySelectorAll('iframe').length===1`);
        await delay(100);
        assert.equal(await evaluate(`document.querySelectorAll('.embed-consent[data-embed-state="loaded"]').length`),1);
        const after=await evaluate(`(()=>{const r=document.querySelectorAll('.embed-consent')[${i}].getBoundingClientRect();return {w:r.width,h:r.height};})()`);
        assert.deepEqual(after,before,'Loading must preserve the player box');
        assert.ok(await evaluate(`(()=>{const frame=document.querySelector('iframe');return frame.title.length>0&&frame.referrerPolicy==='strict-origin-when-cross-origin';})()`));
        await evaluate(`document.querySelector('[data-embed-unload]').click()`);
        assert.equal(await evaluate("document.querySelectorAll('iframe').length"),0);
        assert.equal(await evaluate(`document.activeElement.hasAttribute('data-embed-load')`),true);
        checks++;
      }
      await navigate(file);await waitFor(`document.querySelector('[data-media-cms]')?.dataset.mediaReady==='true'`);
      assert.equal(await evaluate("document.querySelectorAll('iframe').length"),0,'No saved provider consent on reload');
    }
    // CMS failure retains static placeholders and their working load control.
    failMedia=true;await navigate('index.html');await evaluate(`document.querySelector('[data-embed-load]').click()`);
    assert.equal(await evaluate("document.querySelectorAll('iframe').length"),1);failMedia=false;checks++;
  }else{
    for(const file of ['index.html','en.html'])for(const width of [390,1280]){
      await resize(width);contactMode='success';requests=[];await navigate(file);
      await evaluate(`document.querySelector('[data-contact-open]').click()`);
      const fill=()=>evaluate(`(()=>{document.querySelector('#contactName').value='Test Reader';document.querySelector('#contactEmail').value='test@example.invalid';document.querySelector('#contactMessage').value='Keep this test message.';})()`);
      await fill();await evaluate(`document.querySelector('[name="_gotcha"]').value='bot';document.querySelector('#contactMessageForm').requestSubmit()`);await delay(50);assert.equal(requests.length,0,'Honeypot');
      await evaluate(`document.querySelector('[name="_gotcha"]').value=''`);contactMode='hold';
      await evaluate(`document.querySelector('#contactMessageForm').requestSubmit();document.querySelector('#contactMessageForm').dispatchEvent(new Event('submit',{cancelable:true}))`);
      await waitFor(`document.querySelector('#contactMessageForm').getAttribute('aria-busy')==='true'`);await delay(100);
      assert.equal(requests.length,1,'Duplicate submission prevention');
      assert.ok(!Object.keys(requests[0].headers).some(key=>['cookie','referer'].includes(key.toLowerCase())));
      await fulfill(held.shift(),'{"ok":true}');await waitFor(`document.querySelector('#contactFormStatus').classList.contains('is-success')`);
      assert.equal(await evaluate(`document.querySelector('#contactMessage').value`),'');
      for(const mode of ['unconfirmed','malformed','error','network']){
        contactMode=mode;await fill();await evaluate(`document.querySelector('#contactMessageForm').requestSubmit()`);
        await waitFor(`document.querySelector('#contactFormStatus').classList.contains('is-error')&&!document.querySelector('#contactMessageForm').hasAttribute('aria-busy')`);
        assert.equal(await evaluate(`document.querySelector('#contactMessage').value`),'Keep this test message.');
        assert.equal(await evaluate(`location.pathname`),'/'+file);checks++;
      }
      await screenshot(file.replace('.html','')+'-contact-'+width);checks++;
    }
  }
  // Test enforcement, rather than merely checking the policy text exists.
  await resize(1280);await navigate('index.html');
  await evaluate(`(()=>{window.__blockedScript=0;const script=document.createElement('script');script.textContent='window.__blockedScript++';document.body.append(script);const button=document.createElement('button');button.setAttribute('onclick','window.__blockedScript++');document.body.append(button);button.click();const external=document.createElement('script');external.src='https://blocked.example.invalid/probe.js';document.body.append(external);})()`);
  await delay(150);assert.equal(await evaluate('window.__blockedScript'),0);
  assert.ok((await evaluate('window.__cspViolations')).length>=3,'CSP must block injected inline, handler and external scripts');
  assert.equal(exceptions.length,0,JSON.stringify(exceptions));
  assert.deepEqual(interceptErrors,[]);
  console.log(`Browser security checks passed: ${checks} page/viewport, player and contact scenarios. Provider requests were intercepted; no real message was sent.`);
  await writeFile(path.join(report,'summary.json'),JSON.stringify({checks,pages:pages.length,providerRequestsIntercepted:mediaRequests.length},null,2));
}finally{socket?.close();chrome.kill('SIGTERM');server.close();}
