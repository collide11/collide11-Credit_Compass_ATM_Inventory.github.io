// ── AUTH ── Username/Password login, cycle detection, session

const CYCLE_DAYS = [7,8,15,16,29,30];
const CYCLE_NAMES = {7:'7th & 8th',8:'7th & 8th',15:'15th & 16th',16:'15th & 16th',29:'29th & 30th',30:'29th & 30th'};

const AUTH = {
  currentUser: null,
  selectedUser: null,

  async init(){
    // Check saved session
    const saved = sessionStorage.getItem('cc_session');
    if(saved){
      try{
        this.currentUser = JSON.parse(saved);
        APP.launch();
        return;
      }catch(e){}
    }
    this.renderCycleBadge();
    this.showStep('login');
    this.bindKeyboard();
  },

  renderCycleBadge(){
    const day = new Date().getDate();
    const isWD = CYCLE_DAYS.includes(day);
    const el = document.getElementById('cycle-badge');
    if(!el) return;
    el.className = 'cycle-badge ' + (isWD ? 'cycle-on' : 'cycle-off');
    el.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 2"/></svg>
      <span>${isWD ? `Withdrawal day &mdash; ${CYCLE_NAMES[day]} cycle` : 'Off-cycle day &mdash; Staff must provide login reason'}</span>`;
  },

  togglePw(){
    const inp = document.getElementById('login-password');
    if(inp) inp.type = inp.type==='password' ? 'text' : 'password';
  },

  async submitLogin(){
    const username = (document.getElementById('login-username')?.value||'').trim();
    const password = (document.getElementById('login-password')?.value||'').trim();
    const errEl = document.getElementById('login-error');

    if(!username || !password){
      if(errEl){ errEl.textContent='Please enter both username and password.'; errEl.style.display='block'; }
      return;
    }

    // Load users (async - from GAS or localStorage)
    const users = await DB.getUsers();

    // Match by username (name, case-insensitive) and password
    const user = users.find(u =>
      u.name.toLowerCase() === username.toLowerCase() &&
      (u.password || u.pin) === password
    );

    if(!user){
      if(errEl){ errEl.textContent='Incorrect username or password.'; errEl.style.display='block'; }
      // Shake animation
      const card = document.querySelector('.login-card');
      if(card){ card.style.animation='shake 0.35s ease'; setTimeout(()=>card.style.animation='',400); }
      return;
    }

    if(errEl) errEl.style.display='none';
    this.selectedUser = user;

    const day = new Date().getDate();
    const isWD = CYCLE_DAYS.includes(day);

    if(user.type==='admin' || isWD){
      await this.doLogin('');
    } else {
      document.getElementById('remarks-input').value='';
      document.getElementById('btn-login').disabled=true;
      this.showStep('remarks');
    }
  },

  checkRemarks(){
    const v = document.getElementById('remarks-input')?.value?.trim();
    const btn = document.getElementById('btn-login');
    if(btn) btn.disabled = !v || v.length < 5;
  },

  confirmLogin(){
    const remarks = document.getElementById('remarks-input')?.value?.trim();
    if(!remarks || remarks.length < 5) return;
    this.doLogin(remarks);
  },

  async doLogin(remarks){
    const day = new Date().getDate();
    const isOffCycle = this.selectedUser.type==='staff' && !CYCLE_DAYS.includes(day);
    this.currentUser = {
      ...this.selectedUser,
      offCycle: isOffCycle,
      remarks: remarks,
      loginTime: new Date().toISOString(),
      cycleName: CYCLE_NAMES[day]||null,
    };
    if(isOffCycle && remarks){
      await DB.addOffcycleLog({
        staff: this.selectedUser.name,
        initials: this.selectedUser.initials,
        date: new Date().toLocaleDateString('en-US'),
        time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
        reason: remarks,
      });
    }
    sessionStorage.setItem('cc_session', JSON.stringify(this.currentUser));
    APP.launch();
  },

  async logout(){
    sessionStorage.removeItem('cc_session');
    this.currentUser = null;
    this.selectedUser = null;
    document.getElementById('app').style.display='none';
    document.getElementById('login-screen').style.display='flex';
    // Clear fields
    const u = document.getElementById('login-username');
    const p = document.getElementById('login-password');
    const e = document.getElementById('login-error');
    if(u) u.value='';
    if(p) p.value='';
    if(e) e.style.display='none';
    this.renderCycleBadge();
    this.showStep('login');
  },

  goBack(step){
    this.showStep(step);
  },

  showStep(step){
    ['login','remarks'].forEach(s=>{
      const el = document.getElementById('step-'+s);
      if(el) el.style.display = s===step ? 'block' : 'none';
    });
    // Focus username field when showing login
    if(step==='login'){
      setTimeout(()=>{ const u=document.getElementById('login-username'); if(u) u.focus(); }, 100);
    }
  },

  bindKeyboard(){
    // Enter key on login fields is handled inline via onkeydown
    // ESC on remarks goes back
    document.addEventListener('keydown', e=>{
      if(e.key==='Escape' && document.getElementById('step-remarks')?.style.display==='block'){
        this.goBack('login');
      }
    });
  },

  isWithdrawalDay(){ return CYCLE_DAYS.includes(new Date().getDate()); },
  getCycleName(){ return CYCLE_NAMES[new Date().getDate()]||null; },
  isAdmin(){ return this.currentUser && this.currentUser.type==='admin'; },
};
