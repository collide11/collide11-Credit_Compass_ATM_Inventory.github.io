const SETTINGS = {
  async render(el){
    const s = DB.getSettings();
    const users = await DB.getUsers();

    const scriptUrl = localStorage.getItem('atm_script_url')||'';
    const isConnected = DB.isOnline();

    el.innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">

        <!-- GOOGLE SHEET CONNECTION -->
        <div class="card" style="grid-column:span 2;margin-bottom:0">
          <div class="card-hdr">
            <div class="card-hdr-l">
              <div class="card-dot" style="background:${isConnected?'#15803d':'#dc2626'}"></div>
              <span>Google Sheet Connection</span>
            </div>
            <span style="font-size:11px;font-weight:500;padding:2px 10px;border-radius:20px;background:${isConnected?'#dcfce7':'#fee2e2'};color:${isConnected?'#15803d':'#991b1b'}">
              ${isConnected?'Connected':'Not connected — using local storage'}
            </span>
          </div>
          <div class="card-body">
            <div style="font-size:12px;color:#6b7280;margin-bottom:12px;line-height:1.6">
              Paste your <strong>Google Apps Script Web App URL</strong> here to enable shared data across all staff computers.
              All changes will sync to your Google Sheet in real time — exactly like the PCT app.
            </div>
            <div style="display:flex;gap:8px;align-items:flex-end">
              <div class="fg" style="flex:1;margin-bottom:0">
                <label>Google Apps Script URL</label>
                <input id="script-url-input" value="${U.escapeHtml(scriptUrl)}"
                  placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                  style="font-size:11px;font-family:monospace">
              </div>
              <button type="button" class="btn-primary" onclick="SETTINGS.saveScriptUrl()">Save &amp; Connect</button>
              ${isConnected?`<button type="button" class="btn-ghost" onclick="SETTINGS.syncNow()">Sync Now</button>`:''}
            </div>
            ${isConnected?`
              <div style="margin-top:10px;font-size:11px;color:#6b7280">
                &#10003; Connected. Data syncs automatically on every save. Click <strong>Sync Now</strong> to pull latest data from the sheet manually.
              </div>
            `:`
              <div style="margin-top:10px">
                <div style="font-size:11px;color:#6b7280;margin-bottom:6px">No script URL set — don&apos;t have one yet? Follow the setup guide:</div>
                <button type="button" class="btn-ghost btn-sm" onclick="SETTINGS.showSetupGuide()">&#128196; View Setup Guide</button>
              </div>
            `}
          </div>
        </div>

        <!-- TAGS -->
        <div class="card">
          <div class="card-hdr"><div class="card-hdr-l"><div class="card-dot" style="background:#1a56db"></div><span>Tags / Storage Boxes</span></div></div>
          <div class="card-body">
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
              ${s.tags.map(t=>`<span class="chip">${U.escapeHtml(t)} <span onclick="SETTINGS.removeTag('${U.escapeHtml(t)}')" style="margin-left:4px;cursor:pointer;color:#9ca3af">&#10005;</span></span>`).join('')}
            </div>
            <div style="display:flex;gap:8px">
              <input id="new-tag" class="search" placeholder="New tag name..." style="flex:1">
              <button type="button" class="btn-primary btn-sm" onclick="SETTINGS.addTag()">Add</button>
            </div>
          </div>
        </div>

        <!-- BRANCHES -->
        <div class="card">
          <div class="card-hdr"><div class="card-hdr-l"><div class="card-dot" style="background:#0f6e56"></div><span>Branch Offices</span></div></div>
          <div class="card-body">
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
              ${s.branches.map(b=>`<span class="chip">${U.escapeHtml(b)} <span onclick="SETTINGS.removeBranch('${U.escapeHtml(b)}')" style="margin-left:4px;cursor:pointer;color:#9ca3af">&#10005;</span></span>`).join('')}
            </div>
            <div style="display:flex;gap:8px">
              <input id="new-branch" class="search" placeholder="New branch name..." style="flex:1">
              <button type="button" class="btn-primary btn-sm" onclick="SETTINGS.addBranch()">Add</button>
            </div>
          </div>
        </div>

        <!-- ACCOUNT TYPES -->
        <div class="card">
          <div class="card-hdr"><div class="card-hdr-l"><div class="card-dot" style="background:#854f0b"></div><span>Account Types</span></div></div>
          <div class="card-body">
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
              ${s.accountTypes.map(a=>`<span class="chip">${U.escapeHtml(a)} <span onclick="SETTINGS.removeAccountType('${U.escapeHtml(a)}')" style="margin-left:4px;cursor:pointer;color:#9ca3af">&#10005;</span></span>`).join('')}
            </div>
            <div style="display:flex;gap:8px">
              <input id="new-actype" class="search" placeholder="New account type..." style="flex:1">
              <button type="button" class="btn-primary btn-sm" onclick="SETTINGS.addAccountType()">Add</button>
            </div>
          </div>
        </div>

        <!-- BANKS -->
        <div class="card">
          <div class="card-hdr"><div class="card-hdr-l"><div class="card-dot" style="background:#475569"></div><span>Banks</span></div></div>
          <div class="card-body">
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
              ${s.banks.map(b=>`<span class="chip">${U.escapeHtml(b)} <span onclick="SETTINGS.removeBank('${U.escapeHtml(b)}')" style="margin-left:4px;cursor:pointer;color:#9ca3af">&#10005;</span></span>`).join('')}
            </div>
            <div style="display:flex;gap:8px">
              <input id="new-bank" class="search" placeholder="New bank name..." style="flex:1">
              <button type="button" class="btn-primary btn-sm" onclick="SETTINGS.addBank()">Add</button>
            </div>
          </div>
        </div>

        <!-- STAFF -->
        <div class="card" style="grid-column:span 2">
          <div class="card-hdr">
            <div class="card-hdr-l"><div class="card-dot" style="background:#7f77dd"></div><span>Staff Accounts</span></div>
            ${AUTH.isAdmin()?`<button type="button" class="btn-primary btn-sm" onclick="SETTINGS.addStaff()">+ Add Staff</button>`:''}
          </div>
          <div>
            ${users.map(u=>`
              <div class="settings-row">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;background:${u.type==='admin'?'#fef3c7':'#dbeafe'};color:${u.type==='admin'?'#92400e':'#1d4ed8'}">${u.initials}</div>
                  <div>
                    <div class="settings-row-l"><div class="sr-title">${U.escapeHtml(u.name)}</div>
                    <div class="sr-desc">${u.type==='admin'?'★ Admin':'Staff'}</div></div>
                  </div>
                </div>
                ${AUTH.isAdmin()?`
                  <div style="display:flex;gap:8px">
                    <button type="button" class="btn-ghost btn-sm" onclick="SETTINGS.editStaff(\'${u.id}\')">Edit</button>
                    <button class="btn-ghost btn-sm" onclick="SETTINGS.changePassword('${u.id}')">Change Password</button>
                    ${u.id!==AUTH.currentUser?.id?`<button type="button" class="btn-danger btn-sm" onclick="SETTINGS.removeStaff('${u.id}')">Remove</button>`:''}
                  </div>
                `:''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- DATA MANAGEMENT -->
        <div class="card" style="grid-column:span 2">
          <div class="card-hdr"><div class="card-hdr-l"><div class="card-dot" style="background:#dc2626"></div><span>Data Management</span></div></div>
          <div class="card-body">
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <button type="button" class="btn-ghost" onclick="SETTINGS.exportAll()">&#8595; Export All Data (JSON)</button>
              <button type="button" class="btn-ghost" onclick="SETTINGS.importData()">&#8593; Import Data (JSON)</button>
              ${AUTH.isAdmin()?`<button type="button" class="btn-danger" onclick="SETTINGS.clearAll()">&#128465; Clear All Data</button>`:''}
            </div>
            <div class="hint" style="margin-top:8px">Export regularly to back up your data. All data is stored in your browser's localStorage.</div>
          </div>
        </div>

      </div>
      </div>
    `;
  },

  saveScriptUrl(){
    const url = document.getElementById('script-url')?.value?.trim();
    if(!url){ U.toast('Please enter a script URL','error'); return; }
    if(!url.startsWith('https://script.google.com')){
      U.toast('Invalid URL — must start with https://script.google.com','error'); return;
    }
    DB.setScriptUrl(url);
    U.toast('Script URL saved — syncing now...');
    DB.syncAll(false).then(ok=>{
      if(ok){ U.toast('Connected and synced successfully'); }
      else { U.toast('URL saved but sync failed — check the URL','error'); }
      this.render(document.getElementById('content'));
    });
  },

  disconnectScript(){
    if(!confirm('Disconnect from Google Sheets? Data will stay on this device only.')) return;
    DB.setScriptUrl('');
    U.toast('Disconnected from Google Sheets');
    this.render(document.getElementById('content'));
  },

  syncNow(){
    U.toast('Syncing...','info');
    DB.syncAll(false).then(ok=>{
      if(ok){
        U.toast('Synced successfully');
        // Refresh current page
        APP.navigate(APP.currentPage);
      } else {
        U.toast('Sync failed — check script URL','error');
      }
    });
  },

  showSetupGuide(){
    U.modal('Google Apps Script Setup Guide', `
      <div style="font-size:12px;line-height:1.8;color:#374151">
        <div style="font-weight:600;margin-bottom:10px;font-size:13px">Follow these steps to connect your Google Sheet:</div>

        <div style="margin-bottom:12px">
          <div style="font-weight:500;color:#1a56db;margin-bottom:4px">Step 1 — Create a Google Sheet</div>
          <div>Go to <a href="https://sheets.google.com" target="_blank" style="color:#1a56db">sheets.google.com</a> and create a new spreadsheet. Name it <strong>Credit Compass</strong>.</div>
        </div>

        <div style="margin-bottom:12px">
          <div style="font-weight:500;color:#1a56db;margin-bottom:4px">Step 2 — Open Apps Script</div>
          <div>In your Sheet, click <strong>Extensions → Apps Script</strong>. Delete the default code.</div>
        </div>

        <div style="margin-bottom:12px">
          <div style="font-weight:500;color:#1a56db;margin-bottom:4px">Step 3 — Paste the Script</div>
          <div>Paste the contents of <strong>google-apps-script.gs</strong> (included in your download) into the editor. Click Save.</div>
        </div>

        <div style="margin-bottom:12px">
          <div style="font-weight:500;color:#1a56db;margin-bottom:4px">Step 4 — Deploy as Web App</div>
          <div>Click <strong>Deploy → New deployment → Web app</strong>.<br>
          Set <strong>Execute as: Me</strong> and <strong>Who has access: Anyone</strong>. Click Deploy.<br>
          Copy the Web App URL.</div>
        </div>

        <div style="margin-bottom:12px">
          <div style="font-weight:500;color:#1a56db;margin-bottom:4px">Step 5 — Paste URL here</div>
          <div>Paste the copied URL in the Script URL field above and click <strong>Save &amp; Connect</strong>.</div>
        </div>

        <div style="padding:10px 12px;background:#fef3c7;border-radius:6px;font-size:11px;color:#92400e">
          <strong>Note:</strong> This is the same process as setting up your PCT app. If you need help, check how PCT was configured.
        </div>
      </div>
    `, ()=>U.closeModal());
    // Change Save button to Close
    setTimeout(()=>{
      const btn = document.getElementById('modal-save-btn');
      if(btn){ btn.textContent='Close'; }
    }, 50);
  },

  async addTag(){ const v=document.getElementById('new-tag')?.value?.trim(); if(!v)return; const s=DB.getSettings(); if(!s.tags.includes(v)){s.tags.push(v);await DB.saveSettings(s);} document.getElementById('new-tag').value=''; this.render(document.getElementById('content')); U.toast('Tag added'); },
  async removeTag(t){ const s=DB.getSettings(); s.tags=s.tags.filter(x=>x!==t); await DB.saveSettings(s); this.render(document.getElementById('content')); U.toast('Tag removed'); },
  async addBranch(){ const v=document.getElementById('new-branch')?.value?.trim(); if(!v)return; const s=DB.getSettings(); if(!s.branches.includes(v)){s.branches.push(v);await DB.saveSettings(s);} document.getElementById('new-branch').value=''; this.render(document.getElementById('content')); U.toast('Branch added'); },
  async removeBranch(b){ const s=DB.getSettings(); s.branches=s.branches.filter(x=>x!==b); await DB.saveSettings(s); this.render(document.getElementById('content')); U.toast('Branch removed'); },
  async addAccountType(){ const v=document.getElementById('new-actype')?.value?.trim(); if(!v)return; const s=DB.getSettings(); if(!s.accountTypes.includes(v)){s.accountTypes.push(v);await DB.saveSettings(s);} document.getElementById('new-actype').value=''; this.render(document.getElementById('content')); U.toast('Account type added'); },
  async removeAccountType(a){ const s=DB.getSettings(); s.accountTypes=s.accountTypes.filter(x=>x!==a); await DB.saveSettings(s); this.render(document.getElementById('content')); U.toast('Account type removed'); },
  async addBank(){ const v=document.getElementById('new-bank')?.value?.trim(); if(!v)return; const s=DB.getSettings(); if(!s.banks.includes(v)){s.banks.push(v);await DB.saveSettings(s);} document.getElementById('new-bank').value=''; this.render(document.getElementById('content')); U.toast('Bank added'); },
  async removeBank(b){ const s=DB.getSettings(); s.banks=s.banks.filter(x=>x!==b); await DB.saveSettings(s); this.render(document.getElementById('content')); U.toast('Bank removed'); },

  async addStaff(){
    U.modal('Add Staff Member', `
      <div class="g2"><div class="fg"><label>Full Name</label><input id="ns-name" placeholder="Full name"></div>
      <div class="fg"><label>Initials (2 chars)</label><input id="ns-initials" maxlength="2" placeholder="e.g. AB"></div></div>
      <div class="g2" style="margin-top:12px"><div class="fg"><label>Role</label><select id="ns-role"><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
      <div class="fg"><label>Password <span class="req">*</span></label><input id="ns-pin" type="password" placeholder="Password (min 3 chars)"><div class="hint">Used to log in to Credit Compass</div></div></div>
    `, async ()=>{
      const name=document.getElementById('ns-name')?.value?.trim();
      const initials=document.getElementById('ns-initials')?.value?.trim().toUpperCase();
      const type=document.getElementById('ns-role')?.value;
      const pin=document.getElementById('ns-pin')?.value;
      if(!name||!initials||!pin||pin.length<3){U.toast('Please fill all fields. Password must be at least 3 characters.','error');return;}
      const users=await DB.getUsers();
      users.push({id:'u_'+Date.now(),name,initials,role:type==='admin'?'Admin':'Staff',type,pin,password:pin});
      await DB.saveUsers(users);
      U.closeModal(); U.toast('Staff added');
      this.render(document.getElementById('content'));
    });
  },

  async editStaff(userId){
    if(!AUTH.isAdmin()){U.toast('Only admins can edit staff accounts','error');return;}
    const users = await DB.getUsers();
    const u = users.find(x=>x.id===userId);
    if(!u) return;

    U.modal('Edit Staff Account', `
      <div style="margin-bottom:14px;padding:10px 12px;background:#f8f9fb;border-radius:6px;font-size:12px;color:#6b7280">
        Editing: <strong>${U.escapeHtml(u.name)}</strong> &mdash; ${u.type==='admin'?'Admin':'Staff'}
        ${u.id===AUTH.currentUser?.id?' <span style="color:#1d4ed8">(that&apos;s you)</span>':''}
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg">
          <label>Full Name <span class="req">*</span></label>
          <input id="es-name" value="${U.escapeHtml(u.name)}" placeholder="Full name">
        </div>
        <div class="fg">
          <label>Initials (2 chars) <span class="req">*</span></label>
          <input id="es-initials" maxlength="2" value="${U.escapeHtml(u.initials)}" placeholder="e.g. RS" style="text-transform:uppercase">
        </div>
      </div>
      <div class="fg">
        <label>Role</label>
        <select id="es-role">
          <option value="admin" ${u.type==='admin'?'selected':''}>Admin</option>
          <option value="staff" ${u.type==='staff'?'selected':''}>Staff</option>
        </select>
        ${u.id===AUTH.currentUser?.id?'<div class="hint" style="color:#dc2626">Warning: changing your own role will take effect on next login.</div>':''}
      </div>
    `, async ()=>{
      const name = document.getElementById('es-name')?.value?.trim();
      const initials = document.getElementById('es-initials')?.value?.trim().toUpperCase();
      const type = document.getElementById('es-role')?.value;

      if(!name){ U.toast('Name cannot be empty','error'); return; }
      if(!initials||initials.length<1){ U.toast('Initials cannot be empty','error'); return; }

      const idx = users.findIndex(x=>x.id===userId);
      if(idx>-1){
        users[idx] = {
          ...users[idx],
          name,
          initials,
          type,
          role: type==='admin'?'Admin':'Staff',
        };
        await DB.saveUsers(users);
        // If editing current user, update session
        if(userId===AUTH.currentUser?.id){
          AUTH.currentUser = {...AUTH.currentUser, name, initials, type, role:type==='admin'?'Admin':'Staff'};
          sessionStorage.setItem('cc_session', JSON.stringify(AUTH.currentUser));
          // Update topbar immediately
          APP.renderTopbar();
        }
      }
      U.closeModal();
      U.toast('Staff account updated');
      this.render(document.getElementById('content'));
    });
  },

  async changePassword(userId){
    U.modal('Change Password', `
      <div class="fg"><label>New PIN (4 digits)</label><input id="cp-pin" type="password" maxlength="4" placeholder="Enter new 4-digit PIN"></div>
    `, async ()=>{
      const pin=document.getElementById('cp-pin')?.value;
      if(!pin||pin.length<3){U.toast('Password must be at least 3 characters','error');return;}
      const users=await DB.getUsers();
      const i=users.findIndex(u=>u.id===userId);
      if(i>-1){users[i].pin=pin;await DB.saveUsers(users);}
      U.closeModal(); U.toast('PIN updated');
    });
  },

  async removeStaff(userId){
    U.confirm('Remove this staff member?',async ()=>{
      const users=await DB.getUsers().filter(u=>u.id!==userId);
      await DB.saveUsers(users);
      U.toast('Staff removed');
      this.render(document.getElementById('content'));
    });
  },

  exportAll(){
    const data={clients:DB.getClients(),movements:DB.getMovements(),audits:DB.getAudits(),interdept:DB.getInterdept(),settings:DB.getSettings(),offcycle:DB.getOffcycleLogs(),exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`atm_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); U.toast('Data exported');
  },

  async importData(){
    const inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
    inp.onchange=e=>{
      const file=e.target.files[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=async ev=>{
        try{
          const data=JSON.parse(ev.target.result);
          if(data.clients) DB.saveClients(data.clients);
          if(data.movements) DB.saveMovements(data.movements);
          if(data.audits) DB.saveAudits(data.audits);
          if(data.interdept) await DB.saveInterdept(data.interdept);
          if(data.settings) await DB.saveSettings(data.settings);
          U.toast('Data imported successfully');
          this.render(document.getElementById('content'));
        }catch(err){U.toast('Invalid JSON file','error');}
      };
      reader.readAsText(file);
    };
    inp.click();
  },

  clearAll(){
    U.confirm('CLEAR ALL DATA? This will delete all clients, movements, and audit records. This cannot be undone.',()=>{
      Object.values(DB.KEYS).forEach(k=>localStorage.removeItem(k));
      U.toast('All data cleared');
      this.render(document.getElementById('content'));
    });
  },
};
