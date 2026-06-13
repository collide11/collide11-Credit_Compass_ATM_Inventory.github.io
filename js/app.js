const NAV = [
  { section:'Main', items:[
    { id:'dashboard', label:'Dashboard', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>' },
    { id:'clients', label:'Clients', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>' },
  ]},
  { section:'Inventory', items:[
    { id:'inventory', label:'Inventory Directory', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="1" width="14" height="4" rx="1"/><rect x="1" y="7" width="14" height="4" rx="1"/><rect x="1" y="13" width="14" height="2" rx="1"/></svg>' },
    { id:'movement', label:'Movement Log', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 8h10M8 3l5 5-5 5"/></svg>' },
    { id:'cycles', label:'Withdrawal Cycles', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 2"/></svg>' },
    { id:'audit', label:'Audit Count', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 4h12M2 8h8M2 12h10"/></svg>' },
    { id:'interdept', label:'Inter-dept Requests', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 8h5M9 8h5M11 5l3 3-3 3M5 5L2 8l3 3"/></svg>' },
  ]},
  { section:'System', items:[
    { id:'reports', label:'Reports', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 12h12M2 8h8M2 4h5"/></svg>' },
    { id:'settings', label:'Settings', icon:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>' },
  ]},
];

const PAGE_TITLES = {
  dashboard:'Dashboard', clients:'Clients', inventory:'Inventory Directory',
  movement:'Movement Log', cycles:'Withdrawal Cycles', audit:'Audit Count',
  interdept:'Inter-dept Requests', reports:'Reports', settings:'Settings',
  client_add:'Add New Client', client_profile:'Client Profile',
};

const APP = {
  currentPage: 'dashboard',

  async launch(){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='flex';
    this.renderSidebar();
    this.renderTopbar();

    // Load all data from Google Sheets (or use localStorage cache)
    if(DB.isOnline()){
      this.showLoader('Loading data from Google Sheets...');
      try {
        await DB.loadAll();
      } catch(e) {
        U.toast('Could not reach Google Sheets — using cached data','error');
      }
      this.hideLoader();
    }

    this.navigate('dashboard');

    // Global Enter key guard
    document.getElementById('content').addEventListener('keydown', e=>{
      if(e.key==='Enter' && e.target.tagName!=='TEXTAREA' && e.target.tagName!=='BUTTON'){
        e.preventDefault(); e.stopPropagation();
      }
    });
  },

  showLoader(msg){
    let el = document.getElementById('app-loader');
    if(!el){
      el = document.createElement('div');
      el.id = 'app-loader';
      el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(22,33,62,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;color:#fff;font-family:inherit';
      el.innerHTML = `<div style="width:36px;height:36px;border:3px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:14px"></div>
        <div style="font-size:13px;font-weight:500" id="loader-msg">${msg||'Loading...'}</div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
      document.body.appendChild(el);
    } else {
      document.getElementById('loader-msg').textContent = msg||'Loading...';
      el.style.display = 'flex';
    }
  },

  hideLoader(){
    const el = document.getElementById('app-loader');
    if(el) el.style.display = 'none';
  },

  renderSidebar(){
    const nav = document.getElementById('sb-nav');
    const parentPage = {'client_add':'clients','client_profile':'clients'};
    const activePage = parentPage[this.currentPage]||this.currentPage;
    nav.innerHTML = NAV.map(section=>`
      <div class="nav-sec">${section.section}</div>
      ${section.items.map(item=>`
        <div class="nav-item ${activePage===item.id?'active':''}" id="nav-${item.id}" onclick="APP.navigate('${item.id}')">
          ${item.icon} ${item.label}
        </div>
      `).join('')}
    `).join('');
  },

  renderTopbar(){
    const u = AUTH.currentUser; if(!u) return;
    const av = document.getElementById('tb-av');
    av.textContent=u.initials;
    av.style.background=u.type==='admin'?'#fef3c7':'#dbeafe';
    av.style.color=u.type==='admin'?'#92400e':'#1d4ed8';
    document.getElementById('tb-name').textContent=u.name;
    const badge=document.getElementById('tb-badge');
    badge.textContent=u.type==='admin'?'Admin':'Staff';
    badge.style.background=u.type==='admin'?'#fef3c7':'#f1f5f9';
    badge.style.color=u.type==='admin'?'#92400e':'#475569';
    // Show online/offline indicator
    const existing = document.getElementById('tb-mode');
    if(existing) existing.remove();
    const mode = document.createElement('span');
    mode.id = 'tb-mode';
    mode.style.cssText = `font-size:10px;padding:2px 8px;border-radius:20px;font-weight:500;${DB.isOnline()?'background:#dcfce7;color:#15803d':'background:#fef3c7;color:#92400e'}`;
    mode.textContent = DB.isOnline() ? '● Online' : '○ Offline';
    document.getElementById('tb-badge').insertAdjacentElement('afterend', mode);
  },

  navigate(page, params={}){
    if(this.currentPage==='client_add' && page!=='client_add' && page!=='clients'){
      if(!window.confirm('Leave this form? Unsaved changes will be lost.')) return;
    }
    this.currentPage=page;
    const parentPage={'client_add':'clients','client_profile':'clients'};
    const activePage=parentPage[page]||page;
    document.querySelectorAll('.nav-item').forEach(el=>{
      el.classList.toggle('active', el.id==='nav-'+activePage);
    });
    document.getElementById('page-title').textContent=PAGE_TITLES[page]||page;
    const content=document.getElementById('content');
    switch(page){
      case 'dashboard':      DASHBOARD.render(content); break;
      case 'clients':        CLIENTS.render(content); break;
      case 'client_add':     CLIENTS.renderAdd(content, params.clientId); break;
      case 'client_profile': CLIENTS.renderProfile(content, params.id); break;
      case 'inventory':      INVENTORY.render(content); break;
      case 'movement':       MOVEMENT.render(content); break;
      case 'cycles':         CYCLES.render(content); break;
      case 'audit':          AUDIT.render(content); break;
      case 'interdept':      INTERDEPT.render(content); break;
      case 'reports':        REPORTS.render(content); break;
      case 'settings':       SETTINGS.render(content); break;
      default: content.innerHTML='<div class="empty"><div class="empty-title">Page not found</div></div>';
    }
    content.scrollTop=0;
  },
};

window.addEventListener('DOMContentLoaded', ()=>{ AUTH.init(); });
