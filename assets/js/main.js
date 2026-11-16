/* Massage Woudenberg by Jaïrus — interactie & beweging */
(function(){
  const root=document.documentElement;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if('scrollRestoration' in history) history.scrollRestoration='manual';

  /* ---------- tekst splitsen in woorden ---------- */
  document.querySelectorAll('[data-split]').forEach(el=>{
    let i=0;
    const walk=(node)=>{
      [...node.childNodes].forEach(n=>{
        if(n.nodeType===3){
          const parts=n.textContent.split(/(\s+)/);
          const frag=document.createDocumentFragment();
          parts.forEach(p=>{
            if(!p) return;
            if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(' '));return;}
            const w=document.createElement('span');w.className='w';
            const wi=document.createElement('span');wi.className='wi';wi.style.setProperty('--i',i++);
            wi.textContent=p;w.appendChild(wi);frag.appendChild(w);
          });
          n.replaceWith(frag);
        }else if(n.nodeType===1 && n.tagName!=='BR'){walk(n);}
      });
    };
    walk(el);el.classList.add('split');
  });

  /* woorden die oplichten tijdens scrollen */
  const fillEls=[...document.querySelectorAll('[data-fill]')];
  fillEls.forEach(el=>{
    const walk=(node,serif)=>{
      [...node.childNodes].forEach(n=>{
        if(n.nodeType===3){
          const frag=document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p=>{
            if(!p) return;
            if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(' '));return;}
            const s=document.createElement('span');s.className='fw'+(serif?' serif':'');s.textContent=p;frag.appendChild(s);
          });
          n.replaceWith(frag);
        }else if(n.nodeType===1){walk(n,serif||n.classList.contains('serif'));if(n.classList.contains('serif'))n.classList.remove('serif');}
      });
    };
    walk(el,false);el.classList.add('fill-words');
  });

  /* lengte van getekende paden */
  document.querySelectorAll('.draw path.dr').forEach(p=>{
    try{const l=Math.ceil(p.getTotalLength())+2;p.style.setProperty('--len',l);}catch(e){}
  });

  /* ---------- reveal bij scrollen ---------- */
  if(!reduce){
    root.classList.add('anim');
    const targets=document.querySelectorAll('.split,[data-reveal],[data-clip],.draw');
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});
    },{rootMargin:'0px 0px -8% 0px',threshold:0.01});
    targets.forEach(t=>io.observe(t));
    /* alles dat bij laden al in beeld staat, direct (met animatie) tonen */
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      targets.forEach(t=>{const r=t.getBoundingClientRect();if(r.top<innerHeight*0.98&&r.bottom>0){t.classList.add('is-in');io.unobserve(t);}});
    }));
  }

  /* ---------- smooth scroll (Lenis, als beschikbaar) ---------- */
  let lenis=null;
  if(!reduce && window.Lenis){
    lenis=new Lenis({duration:1.15,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
    const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf);
  }
  /* elke pagina start bovenaan (ook na terug/vooruit en na laden van beeld/fonts) */
  const toTop=()=>{
    if(location.hash&&document.querySelector(location.hash)) return;
    window.scrollTo(0,0);root.scrollTop=0;document.body.scrollTop=0;
    if(lenis) lenis.scrollTo(0,{immediate:true,force:true});
  };
  toTop();requestAnimationFrame(toTop);
  window.addEventListener('load',()=>{toTop();setTimeout(toTop,60);});
  window.addEventListener('pageshow',toTop);
  window.addEventListener('beforeunload',()=>{window.scrollTo(0,0);});

  /* ---------- header ---------- */
  const header=document.querySelector('.site-header');
  let lastY=0;
  const onHeader=()=>{
    const y=window.scrollY;
    header.classList.toggle('is-scrolled',y>20);
    header.classList.toggle('is-hidden',y>lastY&&y>420&&!root.classList.contains('menu-open'));
    lastY=y;
  };

  /* mobiel menu */
  const burger=document.querySelector('.burger');
  if(burger) burger.addEventListener('click',()=>{
    const open=root.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded',open);
    if(lenis){open?lenis.stop():lenis.start();}
  });

  /* ---------- scroll-gestuurde effecten ---------- */
  const pxEls=[...document.querySelectorAll('[data-parallax]')];
  const hs=document.querySelector('.hscroll');
  const track=hs&&hs.querySelector('.track');
  const bar=hs&&hs.querySelector('.hs-progress i');
  const steps=[...document.querySelectorAll('.step[data-step]')];
  const stepImgs=[...document.querySelectorAll('.steps-media .frame')];

  let hsPos=0,hsStep=0;
  const sizeHs=()=>{
    if(!hs||!track) return;
    if(innerWidth<=900){hs.style.height='';track.style.transform='';return;}
    const cards=track.children; if(!cards.length) return;
    const clipW=track.parentElement.clientWidth;
    hsStep=cards[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).columnGap||22);
    const visible=Math.max(1,Math.round((clipW+1)/hsStep));
    hsPos=Math.max(0,cards.length-visible);
    hs.style.height=(innerHeight+hsPos*innerHeight*0.6)+'px';
  };
  const tick=()=>{
    const vh=innerHeight;
    onHeader();
    if(!reduce){
      pxEls.forEach(el=>{
        const r=el.parentElement.getBoundingClientRect();
        if(r.bottom<-100||r.top>vh+100) return;
        const speed=parseFloat(el.dataset.parallax)||0.12;
        const c=(r.top+r.height/2-vh/2)/vh;
        el.style.transform=`translate3d(0,${(-c*speed*100).toFixed(2)}%,0)`;
      });
    }
    if(hs&&track&&innerWidth>900&&hsPos){
      const r=hs.getBoundingClientRect();
      const range=hs.offsetHeight-vh;
      const p=Math.min(1,Math.max(0,-r.top/(range||1)));
      const idx=Math.min(hsPos,Math.round(p*hsPos));
      if(track.dataset.idx!=idx){track.dataset.idx=idx;track.style.transform=`translate3d(${(-idx*hsStep).toFixed(1)}px,0,0)`;if(bar) bar.style.transform=`scaleX(${(idx+1)/(hsPos+1)})`;}
    }
    fillEls.forEach(el=>{
      const r=el.getBoundingClientRect();
      const words=el.querySelectorAll('.fw');
      const p=Math.min(1,Math.max(0,(vh*0.85-r.top)/(r.height+vh*0.35)));
      const n=Math.round(p*words.length);
      words.forEach((w,i)=>w.classList.toggle('on',i<n));
    });
    if(steps.length&&stepImgs.length){
      let act=0;
      steps.forEach((s,i)=>{if(s.getBoundingClientRect().top<vh*0.55) act=i;});
      stepImgs.forEach((im,i)=>im.classList.toggle('on',i===act));
    }
  };
  let ticking=false;
  const req=()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{tick();ticking=false;});}};
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',()=>{sizeHs();req();});
  window.addEventListener('load',()=>{sizeHs();tick();});
  sizeHs();tick();

  /* ---------- paginaovergangen ---------- */
  const curtain=document.querySelector('.curtain');
  const reveal=()=>{if(curtain){curtain.classList.remove('is-down');curtain.classList.add('is-up');}};
  if(curtain){
    if(reduce){curtain.style.display='none';}
    else{requestAnimationFrame(()=>setTimeout(reveal,60));}
    window.addEventListener('pageshow',e=>{if(e.persisted){curtain.classList.remove('is-down');curtain.classList.add('is-up');}});
  }
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');
    if(!a||reduce||!curtain) return;
    const href=a.getAttribute('href');
    if(!href||a.target==='_blank'||e.metaKey||e.ctrlKey||e.shiftKey||a.hasAttribute('download')) return;
    if(/^(mailto:|tel:|https?:|#)/.test(href)) return;
    e.preventDefault();
    curtain.classList.remove('is-up');curtain.classList.add('from-bottom');
    void curtain.offsetWidth;
    curtain.classList.remove('from-bottom');curtain.classList.add('is-down');
    setTimeout(()=>{window.location.href=href;},720);
  });

  /* ankerlinks soepel */
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const t=document.querySelector(a.getAttribute('href'));if(!t) return;e.preventDefault();
    lenis?lenis.scrollTo(t,{offset:-90}):t.scrollIntoView({behavior:'smooth'});
  }));
})();
