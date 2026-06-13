// ── DATA LAYER ──
// Supports two modes:
//   1. ONLINE  — Google Apps Script (all staff share same data)
//   2. OFFLINE — localStorage (single computer fallback)
// Set the Script URL in Settings to switch to online mode.

const DB = {
  SCRIPT_URL_KEY: 'atm_script_url',
  CACHE_KEY:      'atm_cache',
  KEYS: {
    users:'atm_users', clients:'atm_clients', movements:'atm_movements',
    cycles:'atm_cycles', audits:'atm_audits', interdept:'atm_interdept',
    offcycle:'atm_offcycle', settings:'atm_settings', notes:'atm_notes',
  },

  // ── MODE ─────────────────────────────────────────────────
  getScriptUrl(){ return localStorage.getItem(this.SCRIPT_URL_KEY)||''; },
  setScriptUrl(url){ localStorage.setItem(this.SCRIPT_URL_KEY, url); },
  isOnline(){ return !!this.getScriptUrl(); },

  // ── CACHE (for offline fallback & speed) ─────────────────
  _cache: null,
  getCache(){ if(!this._cache){ try{ this._cache=JSON.parse(localStorage.getItem(this.CACHE_KEY)||'null'); }catch(e){} } return this._cache||{}; },
  setCache(data){ this._cache=data; localStorage.setItem(this.CACHE_KEY, JSON.stringify(data)); },
  updateCache(key, val){ const c=this.getCache(); c[key]=val; this.setCache(c); },

  // ── API CALL ──────────────────────────────────────────────
  async call(action, data={}){
    const url = this.getScriptUrl();
    if(!url) throw new Error('No Script URL set');
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action, data }),
    });
    const json = await res.json();
    if(json.error) throw new Error(json.error);
    return json;
  },

  // ── LOCAL FALLBACK ────────────────────────────────────────
  get(key){ try{ return JSON.parse(localStorage.getItem(key)||'null'); }catch(e){return null;} },
  set(key,val){ localStorage.setItem(key,JSON.stringify(val)); },

  // ══════════════════════════════════════════════════════════
  // USERS
  // ══════════════════════════════════════════════════════════
  async getUsers(){
    if(this.isOnline()){
      const users = await this.call('getUsers');
      this.updateCache('users', users);
      return users;
    }
    return this.get(this.KEYS.users) || this.seedUsers();
  },
  seedUsers(){
    const users=[
      {id:'u1',name:'aRaR',initials:'RR',role:'Admin',type:'admin',pin:'1234',password:'Betterme.11'},
      {id:'u2',name:'Jose Ramos',initials:'JR',role:'Admin',type:'admin',pin:'1234',password:'1234'},
      {id:'u3',name:'R. Santos',initials:'RS',role:'Staff',type:'staff',pin:'1234',password:'1234'},
      {id:'u4',name:'L. Cruz',initials:'LC',role:'Staff',type:'staff',pin:'1234',password:'1234'},
      {id:'u5',name:'M. Diaz',initials:'MD',role:'Staff',type:'staff',pin:'1234',password:'1234'},
      {id:'u6',name:'B. Reyes',initials:'BR',role:'Staff',type:'staff',pin:'1234',password:'1234'},
    ];
    this.set(this.KEYS.users,users); return users;
  },
  async saveUsers(users){
    if(this.isOnline()) await this.call('saveUsers',{users});
    this.set(this.KEYS.users,users);
    this.updateCache('users',users);
  },

  // ══════════════════════════════════════════════════════════
  // ALL DATA LOAD (called on app launch)
  // ══════════════════════════════════════════════════════════
  async loadAll(){
    if(this.isOnline()){
      try {
        const data = await this.call('getAllData');
        this.setCache(data);
        return data;
      } catch(e){
        console.warn('Online load failed, using cache:', e.message);
        return this.getCache();
      }
    }
    return null; // offline mode uses individual get calls
  },

  // ══════════════════════════════════════════════════════════
  // CLIENTS
  // ══════════════════════════════════════════════════════════
  getClients(){
    if(this.isOnline()) return this.getCache().clients || [];
    return this.get(this.KEYS.clients)||[];
  },
  saveClients(c){ this.set(this.KEYS.clients,c); this.updateCache('clients',c); },

  async addClient(c){
    c.cards=[]; c.passbooks=[];
    if(this.isOnline()){
      const res = await this.call('addClient', c);
      c.id = res.id;
      const clients = this.getClients();
      clients.push(c);
      this.updateCache('clients', clients);
      return c;
    }
    c.id='cl_'+Date.now();
    const clients=this.getClients(); clients.push(c); this.saveClients(clients); return c;
  },

  async updateClient(id, data){
    if(this.isOnline()){
      await this.call('updateClient',{id,...data});
      const clients=this.getClients(); const i=clients.findIndex(c=>c.id===id);
      if(i>-1){ clients[i]={...clients[i],...data}; this.updateCache('clients',clients); }
      return clients[i];
    }
    const clients=this.getClients(); const i=clients.findIndex(c=>c.id===id);
    if(i>-1){ clients[i]={...clients[i],...data}; this.saveClients(clients); } return clients[i];
  },

  async deleteClient(id){
    if(this.isOnline()){
      await this.call('deleteClient',{id});
      const clients=this.getClients().filter(c=>c.id!==id);
      this.updateCache('clients',clients); return;
    }
    this.saveClients(this.getClients().filter(c=>c.id!==id));
  },

  getClient(id){ return this.getClients().find(c=>c.id===id); },

  // ══════════════════════════════════════════════════════════
  // CARDS
  // ══════════════════════════════════════════════════════════
  async addCard(clientId, card){
    card.addedDate=new Date().toISOString().split('T')[0];
    card.location='In Vault';
    if(this.isOnline()){
      const res=await this.call('addCard',{clientId,...card});
      card.id=res.id;
    } else {
      card.id='card_'+Date.now();
    }
    const clients=this.getClients(); const i=clients.findIndex(c=>c.id===clientId);
    if(i>-1){ clients[i].cards=clients[i].cards||[]; clients[i].cards.push(card); this.saveClients(clients); }
    return card;
  },

  async updateCard(clientId, cardId, data){
    if(this.isOnline()) await this.call('updateCard',{clientId,cardId,...data});
    const clients=this.getClients(); const ci=clients.findIndex(c=>c.id===clientId);
    if(ci>-1){ const ki=clients[ci].cards.findIndex(k=>k.id===cardId);
      if(ki>-1){ clients[ci].cards[ki]={...clients[ci].cards[ki],...data}; this.saveClients(clients); } }
  },

  async deleteCard(clientId, cardId){
    if(this.isOnline()) await this.call('deleteCard',{clientId,cardId});
    const clients=this.getClients(); const ci=clients.findIndex(c=>c.id===clientId);
    if(ci>-1){ clients[ci].cards=clients[ci].cards.filter(k=>k.id!==cardId); this.saveClients(clients); }
  },

  // ══════════════════════════════════════════════════════════
  // PASSBOOKS
  // ══════════════════════════════════════════════════════════
  async addPassbook(clientId, pb){
    pb.addedDate=new Date().toISOString().split('T')[0];
    pb.location='In Vault';
    if(this.isOnline()){
      const res=await this.call('addPassbook',{clientId,...pb});
      pb.id=res.id;
    } else {
      pb.id='pb_'+Date.now();
    }
    const clients=this.getClients(); const i=clients.findIndex(c=>c.id===clientId);
    if(i>-1){ clients[i].passbooks=clients[i].passbooks||[]; clients[i].passbooks.push(pb); this.saveClients(clients); }
    return pb;
  },

  async updatePassbook(clientId, pbId, data){
    if(this.isOnline()) await this.call('updatePassbook',{clientId,pbId,...data});
    const clients=this.getClients(); const ci=clients.findIndex(c=>c.id===clientId);
    if(ci>-1){ const pi=clients[ci].passbooks.findIndex(p=>p.id===pbId);
      if(pi>-1){ clients[ci].passbooks[pi]={...clients[ci].passbooks[pi],...data}; this.saveClients(clients); } }
  },

  async deletePassbook(clientId, pbId){
    if(this.isOnline()) await this.call('deletePassbook',{clientId,pbId});
    const clients=this.getClients(); const ci=clients.findIndex(c=>c.id===clientId);
    if(ci>-1){ clients[ci].passbooks=clients[ci].passbooks.filter(p=>p.id!==pbId); this.saveClients(clients); }
  },

  // ══════════════════════════════════════════════════════════
  // MOVEMENTS
  // ══════════════════════════════════════════════════════════
  getMovements(){ if(this.isOnline()) return this.getCache().movements||[]; return this.get(this.KEYS.movements)||[]; },
  saveMovements(m){ this.set(this.KEYS.movements,m); this.updateCache('movements',m); },

  async addMovement(m){
    m.createdAt=new Date().toISOString();
    if(this.isOnline()){
      const res=await this.call('addMovement',m); m.id=res.id;
    } else {
      m.id='mov_'+Date.now();
    }
    const movs=this.getMovements(); movs.unshift(m); this.saveMovements(movs);
    if(m.clientId&&m.itemId&&m.itemType){
      if(m.itemType==='ATM Card') await this.updateCard(m.clientId,m.itemId,{location:m.toLocation});
      else await this.updatePassbook(m.clientId,m.itemId,{location:m.toLocation});
    }
    return m;
  },

  async saveMovementEdit(id, data){
    if(this.isOnline()) await this.call('updateMovement',{id,...data});
    const movs=this.getMovements(); const i=movs.findIndex(m=>m.id===id);
    if(i>-1){ movs[i]={...movs[i],...data}; this.saveMovements(movs); }
  },

  // ══════════════════════════════════════════════════════════
  // OFF-CYCLE LOGS
  // ══════════════════════════════════════════════════════════
  getOffcycleLogs(){ if(this.isOnline()) return this.getCache().offcycleLogs||[]; return this.get(this.KEYS.offcycle)||[]; },
  async addOffcycleLog(log){
    log.createdAt=new Date().toISOString();
    if(this.isOnline()){ await this.call('addOffcycleLog',log); }
    const logs=this.getOffcycleLogs(); logs.unshift(log);
    this.set(this.KEYS.offcycle,logs); this.updateCache('offcycleLogs',logs);
  },

  // ══════════════════════════════════════════════════════════
  // INTER-DEPT
  // ══════════════════════════════════════════════════════════
  getInterdept(){ if(this.isOnline()) return this.getCache().interdept||[]; return this.get(this.KEYS.interdept)||[]; },
  saveInterdept(d){ this.set(this.KEYS.interdept,d); this.updateCache('interdept',d); },

  async addInterdept(r){
    r.createdAt=new Date().toISOString();
    if(this.isOnline()){
      const res=await this.call('addInterdept',r); r.id=res.id;
    } else {
      const reqs=this.getInterdept(); r.id='IDR-'+String(reqs.length+1).padStart(4,'0');
    }
    const reqs=this.getInterdept(); reqs.unshift(r); this.saveInterdept(reqs); return r;
  },

  async updateInterdept(id, data){
    if(this.isOnline()) await this.call('updateInterdept',{id,...data});
    const reqs=this.getInterdept(); const i=reqs.findIndex(r=>r.id===id);
    if(i>-1){ reqs[i]={...reqs[i],...data}; this.saveInterdept(reqs); }
  },

  // ══════════════════════════════════════════════════════════
  // AUDITS
  // ══════════════════════════════════════════════════════════
  getAudits(){ if(this.isOnline()) return this.getCache().audits||[]; return this.get(this.KEYS.audits)||[]; },
  saveAudits(a){ this.set(this.KEYS.audits,a); this.updateCache('audits',a); },

  async addAudit(a){
    a.createdAt=new Date().toISOString();
    if(this.isOnline()){
      const res=await this.call('addAudit',a); a.id=res.id;
    } else {
      a.id='aud_'+Date.now();
    }
    const audits=this.getAudits(); audits.unshift(a); this.saveAudits(audits); return a;
  },

  getAudit(id){ return this.getAudits().find(a=>a.id===id); },
  async updateAudit(id,data){
    const audits=this.getAudits(); const i=audits.findIndex(a=>a.id===id);
    if(i>-1){ audits[i]={...audits[i],...data}; this.saveAudits(audits); }
  },

  // ══════════════════════════════════════════════════════════
  // NOTES
  // ══════════════════════════════════════════════════════════
  getNotes(clientId){
    if(this.isOnline()){
      const all=this.getCache().notes||{}; return all[clientId]||[];
    }
    return (this.get(this.KEYS.notes)||{})[clientId]||[];
  },
  async addNote(clientId, note){
    note.createdAt=new Date().toISOString();
    if(this.isOnline()){
      const res=await this.call('addNote',{clientId,...note}); note.id=res.id;
    } else {
      note.id='note_'+Date.now();
    }
    const all=this.isOnline()?(this.getCache().notes||{}):(this.get(this.KEYS.notes)||{});
    if(!all[clientId]) all[clientId]=[];
    all[clientId].unshift(note);
    if(this.isOnline()) this.updateCache('notes',all);
    else this.set(this.KEYS.notes,all);
    return note;
  },

  // ══════════════════════════════════════════════════════════
  // SETTINGS
  // ══════════════════════════════════════════════════════════
  getSettings(){
    if(this.isOnline()) return this.getCache().settings || this._defaultSettings();
    return this.get(this.KEYS.settings)||this._defaultSettings();
  },
  _defaultSettings(){
    return {
      tags:['Deceased 1st','Deceased 16th','Blacklisted','Trouble Rogue','TR3','GSIS','Unahan','Error','New/Old','Inactive'],
      branches:['Trouble Rouge','TR3','Makati Office'],
      accountTypes:['Savings','Current','Payroll','GSIS','SSS'],
      pensionTypes:['SSS','GSIS','SSS + GSIS','Other'],
      banks:['BDO Unibank','BPI','Metrobank','UnionBank','Security Bank','Landbank','DBP','Other'],
    };
  },
  async saveSettings(s){
    if(this.isOnline()) await this.call('saveSettings',s);
    this.set(this.KEYS.settings,s); this.updateCache('settings',s);
  },

  // ══════════════════════════════════════════════════════════
  // COMPUTED
  // ══════════════════════════════════════════════════════════
  getAllItems(){
    const clients=this.getClients(); const items=[];
    clients.forEach(cl=>{
      (cl.cards||[]).forEach(c=>items.push({...c,clientId:cl.id,clientName:`${cl.lastName}, ${cl.firstName}`,itemType:'ATM Card'}));
      (cl.passbooks||[]).forEach(p=>items.push({...p,clientId:cl.id,clientName:`${cl.lastName}, ${cl.firstName}`,itemType:'Passbook'}));
    });
    return items;
  },
  getBoxCounts(){
    const items=this.getAllItems(); const counts={};
    (this.getSettings().tags||[]).forEach(t=>counts[t]=0);
    items.forEach(i=>{ if(i.box&&counts[i.box]!==undefined) counts[i.box]++; });
    return counts;
  },

  // Aliases for compatibility
  isConnected(){ return this.isOnline(); },
  async syncAll(showToast=true){
    try{
      const data = await this.loadAll();
      if(data){ this.setCache(data); if(showToast) U.toast('Synced with Google Sheets'); return true; }
      return false;
    } catch(e){ console.error('Sync failed:',e); return false; }
  },
};
