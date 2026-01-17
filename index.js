    /* Minimal SPA + UI logic for preview only. Replace media src with local assets when ready. */
    (function(){
      // helpers
      const save = (k,v)=>localStorage.setItem(k,JSON.stringify(v));
      const load = (k,def)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):def}catch(e){return def}};

      // session keys
      const SESSION_KEY = 'app:session';
      const PROFILE_KEY = 'app:profile';
      const BODY_KEY = 'app:bodyCheck';
      const PASS_KEY = 'app:passcode';
      const SETTINGS_KEY = 'app:settings';

      // initial profile
      if(!load(PROFILE_KEY)) save(PROFILE_KEY,{name:'Salmonxon',weightKg:70,heightCm:175,motto:'Train like a beast'});

      // Passcode logic (simple client-side hashing omitted for preview)
      const passEl = document.getElementById('passcode');
      const circles = document.getElementById('circles');
      const passMsg = document.getElementById('pass-msg');
      const passError = document.getElementById('pass-error');
      const newMask = document.getElementById('new-mask');
      const confirmMask = document.getElementById('confirm-mask');
      let pin = '', newPin = '', confirmPin = '';
      const stored = load(PASS_KEY,null);
      let setupMode = !stored;
      passMsg.textContent = setupMode ? 'Setup a 4-digit passcode' : 'Unlock with your passcode';
      function renderCircles(){
        circles.innerHTML = '';
        const len = setupMode ? (newPin.length || confirmPin.length) : pin.length;
        for(let i=0;i<4;i++){
          const d = document.createElement('div'); d.className='circle'+(i<len?' filled':''); circles.appendChild(d);
        }
        newMask.textContent = newPin.replace(/./g,'•');
        confirmMask.textContent = confirmPin.replace(/./g,'•');
      }
      renderCircles();

      document.querySelectorAll('.key').forEach(btn=>{
        btn.addEventListener('click',async ()=> {
          const v = btn.textContent.trim();
          if(v==='⌫'){
            if(setupMode){
              if(confirmPin) confirmPin = confirmPin.slice(0,-1);
              else if(newPin) newPin = newPin.slice(0,-1);
            } else pin = pin.slice(0,-1);
            renderCircles(); passError.textContent='';
            return;
          }
          if(v==='OK'){
            if(setupMode){
              if(newPin.length!==4 || confirmPin.length!==4){ passError.textContent='Enter 4 digits'; return; }
              if(newPin!==confirmPin){ passError.textContent='Pins do not match'; return; }
              // store simple (preview): store plain pin (replace with hashed storage in real app)
              save(PASS_KEY,{salt:'preview',hash:newPin});
              setupMode=false; passMsg.textContent='Passcode set. Enter to unlock.'; newPin=''; confirmPin=''; renderCircles();
              return;
            } else {
              const s = load(PASS_KEY,null);
              if(!s){ setupMode=true; passMsg.textContent='Setup a 4-digit passcode'; renderCircles(); return; }
              if(pin===s.hash){ // unlocked
                passEl.classList.add('hidden'); restoreSession(); pin=''; renderCircles(); return;
              } else { passError.textContent='Incorrect'; pin=''; renderCircles(); return; }
            }
          }
          // digit
          if(/\d/.test(v)){
            if(setupMode){
              if(newPin.length<4) newPin+=v;
              else if(confirmPin.length<4) confirmPin+=v;
            } else {
              if(pin.length<4) pin+=v;
            }
            renderCircles();
          }
        });
      });

      // header clock
      const headerDate = document.getElementById('headerDate');
      const headerTime = document.getElementById('headerTime');
      const bigTime = document.getElementById('bigTime');
      const bigDate = document.getElementById('bigDate');
      function tick(){
        const now = new Date();
        headerDate.textContent = now.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
        headerTime.textContent = now.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'});
        bigTime.textContent = now.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
        bigDate.textContent = now.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
      }
      tick(); setInterval(tick,1000);

      // profile panel
      const profileBtn = document.getElementById('profileBtn');
      const profilePanel = document.getElementById('profilePanel');
      const closeProfile = document.getElementById('closeProfile');
      const pName = document.getElementById('pName');
      const pWeight = document.getElementById('pWeight');
      const pHeight = document.getElementById('pHeight');
      const pMotto = document.getElementById('pMotto');
      const saveProfile = document.getElementById('saveProfile');
      const resetData = document.getElementById('resetData');

      function openProfile(){
        const p = load(PROFILE_KEY,{name:'',weightKg:'',heightCm:'',motto:''});
        pName.value = p.name; pWeight.value = p.weightKg; pHeight.value = p.heightCm; pMotto.value = p.motto;
        profilePanel.classList.remove('hidden');
        save(SESSION_KEY, Object.assign(load(SESSION_KEY,{}),{profilePanelOpen:true}));
      }
      function closeProfileFn(){
        profilePanel.classList.add('hidden');
        save(SESSION_KEY, Object.assign(load(SESSION_KEY,{}),{profilePanelOpen:false}));
      }
      profileBtn.addEventListener('click', openProfile);
      closeProfile.addEventListener('click', closeProfileFn);
      saveProfile.addEventListener('click', ()=>{ save(PROFILE_KEY,{name:pName.value,weightKg:Number(pWeight.value)||0,heightCm:Number(pHeight.value)||0,motto:pMotto.value}); closeProfileFn(); });
      resetData.addEventListener('click', ()=>{ if(confirm('Reset all app data?')){ localStorage.clear(); location.reload(); } });

      // simple SPA routing
      const pages = document.querySelectorAll('.page');
      const navItems = document.querySelectorAll('.nav-item');
      function showRoute(route, push=true){
        // map route to id
        const map = {'/':'home','/exercises':'exercises','/workouts':'workouts','/bodycheck':'bodycheck','/timers':'timers'};
        const id = map[route] || 'home';
        pages.forEach(p=>p.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
        navItems.forEach(n=>n.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n=>{ if(n.dataset.route===route) n.classList.add('active'); });
        if(push) history.pushState({route},'',route);
        // save session
        const sess = load(SESSION_KEY,{lastRoute:'/',scrollPositions:{},profilePanelOpen:false});
        sess.lastRoute = route; save(SESSION_KEY,sess);
      }
      // nav clicks
      document.querySelectorAll('[data-route]').forEach(el=>el.addEventListener('click',e=>{ const r=el.dataset.route; showRoute(r); }));
      // buttons with data-route
      document.querySelectorAll('button[data-route]').forEach(b=>b.addEventListener('click',()=>showRoute(b.dataset.route)));
      // back/forward
      window.addEventListener('popstate', e=>{ const r = (e.state && e.state.route) || '/'; showRoute(r,false); });

      // restore session after unlock
      function restoreSession(){
        const sess = load(SESSION_KEY,{lastRoute:'/',scrollPositions:{},profilePanelOpen:false});
        showRoute(sess.lastRoute || '/', false);
        if(sess.profilePanelOpen) openProfile();
        // restore scroll pos if any
        setTimeout(()=>{ const pos = (sess.scrollPositions && sess.scrollPositions[sess.lastRoute])||0; window.scrollTo(0,pos); },50);
      }

      // save scroll positions on navigation and scroll
      window.addEventListener('scroll', ()=> {
        const sess = load(SESSION_KEY,{lastRoute:window.location.pathname,scrollPositions:{},profilePanelOpen:false});
        sess.scrollPositions = sess.scrollPositions || {};
        sess.scrollPositions[window.location.pathname] = window.scrollY;
        save(SESSION_KEY,sess);
      });

      // Exercises toggle
      document.querySelectorAll('[data-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
        const id = btn.dataset.toggle;
        const el = document.getElementById(id);
        if(el) el.classList.toggle('hidden');
      }));

      // Workouts open
      document.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>{
        const id = btn.dataset.open; const el = document.getElementById(id); if(el) el.classList.toggle('hidden');
      }));

      // Body check
      const bcDate = document.getElementById('bcDate'); const bcWeight = document.getElementById('bcWeight'); const addBc = document.getElementById('addBc'); const bcList = document.getElementById('bcList'); const bcChart = document.getElementById('bcChart');
      bcDate.value = new Date().toISOString().slice(0,10);
      function renderBc(){
        const entries = load(BODY_KEY,[]);
        bcList.innerHTML = entries.map(e=>`<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #111"><div>${new Date(e.dateISO).toLocaleDateString()}</div><div style="font-weight:700">${e.weightKg} kg</div></div>`).join('');
        // draw chart
        const ctx = bcChart.getContext('2d'); const w=bcChart.width; const h=bcChart.height; ctx.clearRect(0,0,w,h); if(!entries.length){ ctx.fillStyle='#111'; ctx.fillRect(0,0,w,h); ctx.fillStyle='#888'; ctx.fillText('No data',w/2-20,h/2); return; }
        const weights = entries.slice().reverse().map(d=>d.weightKg); const max=Math.max(...weights); const min=Math.min(...weights); const range=Math.max(1,max-min);
        ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath();
        weights.forEach((val,i)=>{ const x = (i/(weights.length-1||1))*(w-20)+10; const y = h - ((val-min)/range)*(h-20)-10; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
      }
      addBc.addEventListener('click', ()=> {
        const date = bcDate.value; const weight = Number(bcWeight.value); if(!date || !weight) return alert('Enter date and weight');
        const entries = load(BODY_KEY,[]); entries.unshift({id:Date.now().toString(),dateISO:date,weightKg:weight}); save(BODY_KEY,entries); bcWeight.value=''; renderBc();
      });
      renderBc();

      // Timer
      const timerDisplay = document.getElementById('timerDisplay'); const add30 = document.getElementById('add30'); const sub30 = document.getElementById('sub30'); const startPause = document.getElementById('startPause'); const resetTimer = document.getElementById('resetTimer');
      let settings = load(SETTINGS_KEY,{timerDefaultSeconds:60,use24Hour:true});
      let seconds = settings.timerDefaultSeconds; let running=false; let interval=null;
      function updateTimer(){ timerDisplay.textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; }
      updateTimer();
      add30.addEventListener('click', ()=>{ seconds+=30; updateTimer(); });
      sub30.addEventListener('click', ()=>{ seconds=Math.max(0,seconds-30); updateTimer(); });
      startPause.addEventListener('click', ()=>{ running=!running; startPause.textContent = running ? 'Pause' : 'Start'; if(running){ interval=setInterval(()=>{ seconds=Math.max(0,seconds-1); updateTimer(); if(seconds===0){ clearInterval(interval); running=false; startPause.textContent='Start'; } },1000); } else clearInterval(interval); });
      resetTimer.addEventListener('click', ()=>{ seconds=settings.timerDefaultSeconds; running=false; clearInterval(interval); startPause.textContent='Start'; updateTimer(); });

      // initial route: if passcode not set, show setup; else show passcode entry
      if(!stored) { setupMode=true; passMsg.textContent='Setup a 4-digit passcode'; } else { setupMode=false; passMsg.textContent='Unlock with your passcode'; }
      // if no passcode stored, keep passcode visible; otherwise keep visible until correct entry
      // For preview, keep passcode visible until user unlocks.

      // restore session if unlocked (not in preview)
      // showRoute default
      showRoute('/', false);
    })();