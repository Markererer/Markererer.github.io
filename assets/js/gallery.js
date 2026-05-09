/* gallery.js
   - Loads media list from images/me/media.json dynamically
   - Videos are muted + autoplay when visible
*/
(function(){
  let media = []; // Will be populated from media.json

  function isVideo(path){ return /\.(mp4|webm|mov|avi|mkv)$/i.test(path) }
  function isImage(path){ return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(path) }

  // Load media list from media.json
  async function loadMedia(){
    try {
      const response = await fetch('images/me/media.json');
      if(!response.ok) throw new Error('Failed to fetch media.json');
      media = await response.json();
      console.log(`Loaded ${media.length} media files`);
      // Initialize galleries after media is loaded
      buildBackgroundCarousel();
      buildGrid();
      buildCarousel();
      buildFullscreen();
      wireOptionButtons();
    } catch(err) {
      console.error('Error loading media:', err);
      document.body.innerHTML = '<p style="color:red; padding:2rem;">Error loading media list. Run: python generate_media_list.py</p>';
    }
  }

  // Build grid
  function buildGrid(){
    const container = document.getElementById('gridGallery');
    if(!container) return;
    media.forEach((m,i)=>{
      const item = document.createElement('div'); item.className='grid-item';
      const wrap = document.createElement('a'); wrap.href='#'; wrap.className='media';
      if(isVideo(m)){
        const v = document.createElement('video'); v.src=m; v.muted=true; v.playsInline=true; v.loop=true; v.preload='metadata';
        wrap.appendChild(v);
      } else if(isImage(m)){
        const img = document.createElement('img'); img.src=m; img.alt='photo-'+i;
        wrap.appendChild(img);
      }
      wrap.addEventListener('click', (e)=>{ e.preventDefault(); openLightbox(m) });
      item.appendChild(wrap); container.appendChild(item);
    })
  }

  // Lightbox
  let lb;
  function createLightbox(){
    lb = document.createElement('div'); lb.className='lightbox';
    lb.innerHTML = '<div class="lightbox-content"></div><button class="close">×</button>';
    document.body.appendChild(lb);
    lb.querySelector('.close').addEventListener('click', ()=> closeLightbox());
    lb.addEventListener('click', (e)=>{ if(e.target===lb) closeLightbox() });
  }
  function openLightbox(src){
    if(!lb) createLightbox();
    const content = lb.querySelector('.lightbox-content'); content.innerHTML='';
    if(isVideo(src)){
      const v=document.createElement('video'); v.src=src; v.muted=true; v.autoplay=true; v.loop=true; v.playsInline=true; v.controls=true;
      content.appendChild(v);
    } else {
      const img=document.createElement('img'); img.src=src; content.appendChild(img);
    }
    lb.classList.add('open');
  }
  function closeLightbox(){ if(lb) lb.classList.remove('open'); }

  // Carousel (infinite loop)
  let carouselIndex=0, carouselTimer=null;
  function buildCarousel(){
    const slides = document.getElementById('carouselSlides'); if(!slides) return;
    const mediaCount = media.length;
    // Create slides: original + duplicates for infinite loop
    for(let loop=0; loop<2; loop++){ // 2 copies for seamless wrapping
      media.forEach((m,i)=>{
        const s=document.createElement('div'); s.className='slide'; s.dataset.index=i; s.dataset.loop=loop;
        if(isVideo(m)){
          const v=document.createElement('video'); v.src=m; v.muted=true; v.playsInline=true; v.loop=true; v.preload='metadata'; v.volume=0; v.setAttribute('muted',''); s.appendChild(v);
        } else {
          const img=document.createElement('img'); img.src=m; s.appendChild(img);
        }
        slides.appendChild(s);
      })
    }
    showCarousel(0);
    document.getElementById('prev').addEventListener('click', ()=>{ stopCarousel(); showCarousel(carouselIndex-1); });
    document.getElementById('next').addEventListener('click', ()=>{ stopCarousel(); showCarousel(carouselIndex+1); });
    startCarousel();
  }
  function showCarousel(idx){
    const slides = document.querySelectorAll('#carouselSlides .slide'); if(!slides.length) return;
    const mediaCount = media.length;
    // Allow infinite wrapping by modulo
    carouselIndex = ((idx % (mediaCount * 2)) + (mediaCount * 2)) % (mediaCount * 2);
    slides.forEach((s,i)=>{ 
      s.classList.toggle('active', i===carouselIndex); 
      const v=s.querySelector('video'); 
      if(v){ 
        v.muted=true; v.volume=0; v.setAttribute('muted',''); 
        if(i===carouselIndex){ v.play().catch(()=>{}); } else { v.pause(); } 
      } 
    });
  }
  function startCarousel(){ stopCarousel(); carouselTimer = setInterval(()=> showCarousel(carouselIndex+1), 4000); }
  function stopCarousel(){ if(carouselTimer) { clearInterval(carouselTimer); carouselTimer=null } }

  // Fullscreen slideshow
  function buildFullscreen(){
    const container = document.getElementById('fullscreenSlideshow'); if(!container) return;
    const stage = document.createElement('div'); stage.className='fs-stage'; container.appendChild(stage);
    const thumbs = document.createElement('div'); thumbs.className='fs-thumbs'; container.appendChild(thumbs);
    media.forEach((m,i)=>{
      const t = document.createElement('div'); t.className='fs-thumb';
      if(isVideo(m)){ const v=document.createElement('video'); v.src=m; v.muted=true; v.playsInline=true; v.preload='metadata'; t.appendChild(v); }
      else { const img=document.createElement('img'); img.src=m; t.appendChild(img); }
      t.addEventListener('click', ()=> showFullscreen(i)); thumbs.appendChild(t);
      if(i===0) showFullscreen(0);
    })
  }
  function showFullscreen(index){
    const stage = document.querySelector('#fullscreenSlideshow .fs-stage'); if(!stage) return;
    stage.innerHTML=''; const src = media[index]; if(isVideo(src)){ const v=document.createElement('video'); v.src=src; v.autoplay=true; v.muted=true; v.loop=true; v.controls=true; v.playsInline=true; stage.appendChild(v); } else { const img=document.createElement('img'); img.src=src; stage.appendChild(img); }
  }

  // Background blurred carousel behind intro
  function tryImageFallback(src, imgEl){
    // If HEIC/HEIF not supported, try jpg/png with same base name
    const base = src.replace(/\.[^/.]+$/, '');
    const candidates = [base + '.jpg', base + '.jpeg', base + '.png'];
    let tried = 0;
    function tryNext(){
      if(tried >= candidates.length) {
        // final fallback: simple SVG placeholder
        const svg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#222"/></svg>');
        imgEl.src = 'data:image/svg+xml;charset=utf-8,' + svg;
        return;
      }
      const next = candidates[tried++];
      const test = new Image(); test.onload = ()=> { imgEl.src = next }; test.onerror = tryNext; test.src = next;
    }
    tryNext();
  }

  function buildBackgroundCarousel(){
    const intro = document.getElementById('intro'); if(!intro) return;
    if(intro.querySelector('.bg-carousel .bg-track')) return;
    const bg = document.createElement('div'); bg.className='bg-carousel';
    const track = document.createElement('div'); track.className='bg-track';
    media.forEach((m)=>{
      const item = document.createElement('div'); item.className='bg-item';
      if(isVideo(m)){
        const v = document.createElement('video'); v.src=m; v.muted=true; v.autoplay=true; v.loop=true; v.playsInline=true; v.preload='metadata'; v.volume = 0; v.setAttribute('muted',''); v.style.willChange='transform'; item.appendChild(v);
      } else {
        const img = document.createElement('img'); img.src=m; img.alt='bg';
        img.onerror = ()=> { tryImageFallback(m, img) };
        item.appendChild(img);
      }
      track.appendChild(item);
    });
    // duplicate items for seamless loop
    const cloneCount = track.children.length;
    for(let i=0;i<cloneCount;i++){ track.appendChild(track.children[i].cloneNode(true)); }
    bg.appendChild(track);
    intro.insertBefore(bg, intro.firstChild);
  }

  // Option switching
  function wireOptionButtons(){
    document.querySelectorAll('.gallery-controls button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const show = btn.dataset.show; document.querySelectorAll('.gallery-option').forEach(o=>o.classList.remove('visible'));
        const el = document.getElementById(show); if(el) el.classList.add('visible');
      })
    })
  }

  // Init
  document.addEventListener('DOMContentLoaded', ()=>{
    loadMedia();
  })

})();
