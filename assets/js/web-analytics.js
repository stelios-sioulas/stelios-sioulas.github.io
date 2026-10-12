/* Public site identifier; skip local and preview hosts and duplicate beacons. */
(() => {
  if (location.protocol !== 'https:' || !["steliossioulas.gr", "www.steliossioulas.gr"].includes(location.hostname)) return;
  if (document.querySelector('script[data-cf-beacon]')) return;
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: "8def2438908b415890fa5d5d29f50cb4" }));
  document.body.append(beacon);
})();
