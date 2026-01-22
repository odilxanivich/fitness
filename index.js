(function(){
  // Storage helpers - using in-memory storage instead of localStorage
  let appData = {
    session: {lastRoute:'/', scrollPositions:{}, profilePanelOpen:false},
    profile: {name:'Salmonxon', weightKg:70, heightCm:175, motto:'Train like a beast'},
    bodyCheck: [],
    passcode: null,
    settings: {timerDefaultSeconds:60, use24Hour:true}
  };

  const save = (k, v) => { appData[k] = v; };
  const load = (k, def) => { return appData[k] !== undefined ? appData[k] : def; };

  // Session keys
  const SESSION_KEY = 'session';
  const PROFILE_KEY = 'profile';
  const BODY_KEY = 'bodyCheck';
  const PASS_KEY = 'passcode';
  const SETTINGS_KEY = 'settings';

  // Passcode logic
  const passEl = document.getElementById('passcode');
  const circles = document.getElementById('circles');
  const passMsg = document.getElementById('pass-msg');
  const passError = document.getElementById('pass-error');
  const newMask = document.getElementById('new-mask');
  const confirmMask = document.getElementById('confirm-mask');
  let pin = '', newPin = '', confirmPin = '';
  const stored = load(PASS_KEY, null);
  let setupMode = !stored;
  passMsg.textContent = setupMode ? 'Setup a 4-digit passcode' : 'Unlock with your passcode';
  
  function renderCircles(){
    circles.innerHTML = '';
    const len = setupMode ? (newPin.length || confirmPin.length) : pin.length;
    for(let i=0; i<4; i++){
      const d = document.createElement('div');
      d.className = 'w-5 h-5 border-2 border-white ' + (i<len ? 'bg-white' : 'bg-transparent');
      circles.appendChild(d);
    }
    newMask.textContent = newPin.replace(/./g,'•');
    confirmMask.textContent = confirmPin.replace(/./g,'•');
  }
  renderCircles();

  // Vibration helper
  function vibrate(duration = 50) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  // Audio helper - very short beep
  let audioContext;
  function playShortBeep() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05); // 50ms beep
    } catch(e) {
      console.log('Audio not available');
    }
  }

  document.querySelectorAll('.key').forEach(btn => {
    btn.addEventListener('click', () => {
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
          if(newPin.length!==4 || confirmPin.length!==4){ 
            passError.textContent='Enter 4 digits'; 
            vibrate(200);
            return; 
          }
          if(newPin!==confirmPin){ 
            passError.textContent='Pins do not match'; 
            vibrate(200);
            return; 
          }
          save(PASS_KEY, {salt:'preview', hash:newPin});
          setupMode=false; 
          passMsg.textContent='Passcode set. Enter to unlock.'; 
          newPin=''; confirmPin=''; 
          renderCircles();
          vibrate();
          return;
        } else {
          const s = load(PASS_KEY, null);
          if(!s){ 
            setupMode=true; 
            passMsg.textContent='Setup a 4-digit passcode'; 
            renderCircles(); 
            return; 
          }
          if(pin===s.hash){
            passEl.classList.add('hidden'); 
            restoreSession(); 
            pin=''; 
            renderCircles(); 
            vibrate();
            return;
          } else { 
            passError.textContent='Incorrect'; 
            pin=''; 
            renderCircles(); 
            vibrate(200);
            return; 
          }
        }
      }
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

  // Header clock
  const headerDate = document.getElementById('headerDate');
  const headerTime = document.getElementById('headerTime');
  const bigTime = document.getElementById('bigTime');
  const bigDate = document.getElementById('bigDate');
  
  function tick(){
    const now = new Date();
    headerDate.textContent = now.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
    headerTime.textContent = now.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    bigTime.textContent = now.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
    bigDate.textContent = now.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
  }
  tick(); 
  setInterval(tick, 1000);

  // Profile panel
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
    const p = load(PROFILE_KEY, {name:'', weightKg:'', heightCm:'', motto:''});
    pName.value = p.name; 
    pWeight.value = p.weightKg; 
    pHeight.value = p.heightCm; 
    pMotto.value = p.motto;
    profilePanel.classList.remove('hidden');
    const sess = load(SESSION_KEY, {});
    sess.profilePanelOpen = true;
    save(SESSION_KEY, sess);
  }
  
  function closeProfileFn(){
    profilePanel.classList.add('hidden');
    const sess = load(SESSION_KEY, {});
    sess.profilePanelOpen = false;
    save(SESSION_KEY, sess);
  }
  
  profileBtn.addEventListener('click', openProfile);
  closeProfile.addEventListener('click', closeProfileFn);
  saveProfile.addEventListener('click', () => { 
    save(PROFILE_KEY, {
      name: pName.value, 
      weightKg: Number(pWeight.value) || 0, 
      heightCm: Number(pHeight.value) || 0, 
      motto: pMotto.value
    }); 
    closeProfileFn();
    vibrate();
  });
  resetData.addEventListener('click', () => { 
    if(confirm('Reset all app data?')){ 
      appData = {
        session: {lastRoute:'/', scrollPositions:{}, profilePanelOpen:false},
        profile: {name:'Salmonxon', weightKg:70, heightCm:175, motto:'Train like a beast'},
        bodyCheck: [],
        passcode: null,
        settings: {timerDefaultSeconds:60, use24Hour:true}
      };
      location.reload(); 
    } 
  });

  // SPA routing
  const pages = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.nav-item');
  
  function showRoute(route, push=true){
    const map = {'/':'home', '/exercises':'exercises', '/workouts':'workouts', '/bodycheck':'bodycheck', '/timers':'timers'};
    const id = map[route] || 'home';
    pages.forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    navItems.forEach(n => {
      n.classList.remove('active', 'text-red-800');
      n.classList.add('text-neutral-500');
    });
    document.querySelectorAll('.nav-item').forEach(n => { 
      if(n.dataset.route === route) {
        n.classList.add('active', 'text-red-800');
        n.classList.remove('text-neutral-500');
      }
    });
    if(push) history.pushState({route}, '', route);
    const sess = load(SESSION_KEY, {lastRoute:'/', scrollPositions:{}, profilePanelOpen:false});
    sess.lastRoute = route; 
    save(SESSION_KEY, sess);
  }
  
  document.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', e => { 
      const r = el.dataset.route; 
      showRoute(r);
      vibrate();
    });
  });
  
  window.addEventListener('popstate', e => { 
    const r = (e.state && e.state.route) || '/'; 
    showRoute(r, false); 
  });

  function restoreSession(){
    const sess = load(SESSION_KEY, {lastRoute:'/', scrollPositions:{}, profilePanelOpen:false});
    showRoute(sess.lastRoute || '/', false);
    if(sess.profilePanelOpen) openProfile();
    setTimeout(() => { 
      const pos = (sess.scrollPositions && sess.scrollPositions[sess.lastRoute]) || 0; 
      window.scrollTo(0, pos); 
    }, 50);
  }

  window.addEventListener('scroll', () => {
    const sess = load(SESSION_KEY, {lastRoute:window.location.pathname, scrollPositions:{}, profilePanelOpen:false});
    sess.scrollPositions = sess.scrollPositions || {};
    sess.scrollPositions[window.location.pathname] = window.scrollY;
    save(SESSION_KEY, sess);
  });

  // Exercises toggle
  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toggle;
      const el = document.getElementById(id);
      if(el) {
        el.classList.toggle('hidden');
        vibrate();
      }
    });
  });

  // Workouts - collapse other rows when one is opened
  document.querySelectorAll('.workout-card').forEach(card => {
    const toggle = card.querySelector('.workout-toggle');
    const content = card.querySelector('.workout-content');
    
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCurrentlyOpen = !content.classList.contains('hidden');
      
      // Close all workout contents
      document.querySelectorAll('.workout-content').forEach(c => c.classList.add('hidden'));
      document.querySelectorAll('.workout-toggle').forEach(t => t.textContent = '+');
      
      // If this one wasn't open, open it
      if (!isCurrentlyOpen) {
        content.classList.remove('hidden');
        toggle.textContent = '−';
      }
      
      vibrate();
    });
  });

  // Body check
  const bcDate = document.getElementById('bcDate');
  const bcWeight = document.getElementById('bcWeight');
  const addBc = document.getElementById('addBc');
  const bcList = document.getElementById('bcList');
  const bcChart = document.getElementById('bcChart');
  bcDate.value = new Date().toISOString().slice(0, 10);
  
  function renderBc(){
    const entries = load(BODY_KEY, []);
    bcList.innerHTML = entries.map(e => 
      `<div class="flex justify-between py-2 border-b border-zinc-900">
        <div class="text-xs">${new Date(e.dateISO).toLocaleDateString()}</div>
        <div class="text-xs font-bold">${e.weightKg} kg</div>
      </div>`
    ).join('');
    
    // Draw chart
    const ctx = bcChart.getContext('2d');
    const w = bcChart.width;
    const h = bcChart.height;
    ctx.clearRect(0, 0, w, h);
    
    if(!entries.length){ 
      ctx.fillStyle = '#111'; 
      ctx.fillRect(0, 0, w, h); 
      ctx.fillStyle = '#888'; 
      ctx.fillText('No data', w/2-20, h/2); 
      return; 
    }
    
    const weights = entries.slice().reverse().map(d => d.weightKg);
    const max = Math.max(...weights);
    const min = Math.min(...weights);
    const range = Math.max(1, max - min);
    
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    weights.forEach((val, i) => { 
      const x = (i / (weights.length - 1 || 1)) * (w - 20) + 10;
      const y = h - ((val - min) / range) * (h - 20) - 10;
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  
  addBc.addEventListener('click', () => {
    const date = bcDate.value;
    const weight = Number(bcWeight.value);
    if(!date || !weight) {
      alert('Enter date and weight');
      vibrate(200);
      return;
    }
    const entries = load(BODY_KEY, []);
    entries.unshift({id: Date.now().toString(), dateISO: date, weightKg: weight});
    save(BODY_KEY, entries);
    bcWeight.value = '';
    renderBc();
    vibrate();
  });
  renderBc();

  // Timer
  const timerDisplay = document.getElementById('timerDisplay');
  const add30 = document.getElementById('add30');
  const sub30 = document.getElementById('sub30');
  const startPause = document.getElementById('startPause');
  const resetTimer = document.getElementById('resetTimer');
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  let settings = load(SETTINGS_KEY, {timerDefaultSeconds: 60, use24Hour: true});
  let seconds = settings.timerDefaultSeconds;
  let running = false;
  let interval = null;
  
  function updateTimer(){ 
    timerDisplay.textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; 
  }
  updateTimer();
  
  // Preset buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      seconds = parseInt(btn.dataset.seconds);
      updateTimer();
      vibrate();
      if(running) {
        running = false;
        clearInterval(interval);
        startPause.textContent = '▶';
      }
    });
  });
  
  add30.addEventListener('click', () => { 
    seconds += 30; 
    updateTimer();
    vibrate();
  });
  
  sub30.addEventListener('click', () => { 
    seconds = Math.max(0, seconds - 30); 
    updateTimer();
    vibrate();
  });
  
  startPause.addEventListener('click', () => { 
    running = !running;
    startPause.textContent = running ? '⏸' : '▶';
    vibrate();
    
    if(running){
      interval = setInterval(() => {
        seconds = Math.max(0, seconds - 1);
        updateTimer();
        if(seconds === 0){
          clearInterval(interval);
          running = false;
          startPause.textContent = '▶';
          // Timer finished - vibrate and beep
          vibrate([100, 50, 100, 50, 100]);
          playShortBeep();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
  });
  
  resetTimer.addEventListener('click', () => { 
    seconds = settings.timerDefaultSeconds;
    running = false;
    clearInterval(interval);
    startPause.textContent = '▶';
    updateTimer();
    vibrate();
  });

  // Initial setup
  if(!stored) { 
    setupMode = true; 
    passMsg.textContent = 'Setup a 4-digit passcode'; 
  } else { 
    setupMode = false; 
    passMsg.textContent = 'Unlock with your passcode'; 
  }
  
  showRoute('/', false);
})();