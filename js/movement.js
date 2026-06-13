const MOVEMENT = {
  filterAction:'', filterBox:'', searchTerm:'',

  async render(el){
    const settings = DB.getSettings();
    let movs = DB.getMovements();
    if(this.searchTerm){ const s=this.searchTerm.toLowerCase(); movs=movs.filter(m=>`${m.clientName||''} ${m.slot||''} ${m.staff||''}`.toLowerCase().includes(s)); }
    if(this.filterAction) movs=movs.filter(m=>m.action===this.filterAction);
    if(this.filterBox) movs=movs.filter(m=>m.box===this.filterBox);

    el.innerHTML=`
      <div class="toolbar">
        <div class="toolbar-l">
          <input class="search" placeholder="Search client, slot, staff..." value="${U.escapeHtml(this.searchTerm)}"
            oninput="MOVEMENT.searchTerm=this.value;MOVEMENT.render(document.getElementById('content'))">
          <select class="fsel" onchange="MOVEMENT.filterAction=this.value;MOVEMENT.render(document.getElementById('content'))">
            <option value="">All Actions</option>
            <option>Pull Out</option><option>Return</option><option>Receive</option><option>Inter-dept</option>
          </select>
          <select class="fsel" onchange="MOVEMENT.filterBox=this.value;MOVEMENT.render(document.getElementById('content'))">
            <option value="">All Boxes</option>
            ${settings.tags.map(t=>`<option ${this.filterBox===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="toolbar-r">
          <button type="button" class="btn-pdf" onclick="MOVEMENT.exportPDF()">Export PDF</button>
          <button type="button" class="btn-xl" onclick="MOVEMENT.exportExcel()">Export Excel</button>
          <button type="button" class="btn-primary" onclick="MOVEMENT.openLogModal(null)">+ Log Movement</button>
        </div>
      </div>
      <div class="tbl-wrap">
        ${movs.length===0?`<div class="empty"><div class="empty-title">No movements logged yet</div></div>`:
        `<div style="overflow-x:auto"><table><thead><tr>
          <th>Date &amp; Time</th><th>Client</th><th>Slot</th><th>Item</th><th>Action</th>
          <th>From &rarr; To</th><th>Box</th><th>Staff</th><th>Requested By</th><th>Dept/Office</th><th>Withdrawal</th><th>Remarks</th><th>Edit</th>
        </tr></thead><tbody>
        ${movs.map(m=>`<tr>
          <td>${U.fmtDateTime(m.createdAt)}${m.lastEditedAt?`<br><span style='font-size:9px;color:#92400e;background:#fef3c7;padding:1px 5px;border-radius:3px'>edited</span>`:''}</td>
          <td style="cursor:pointer;color:#1a56db" onclick="APP.navigate('client_profile',{id:'${m.clientId}'})">${U.escapeHtml(m.clientName||'—')}</td>
          <td style="font-family:monospace">${U.escapeHtml(m.slot||'—')}</td>
          <td>${U.itemTypeBadge(m.itemType)}</td>
          <td>${U.actionBadge(m.action)}</td>
          <td style="color:#6b7280">${U.escapeHtml(m.fromLocation||'—')} &rarr; ${U.escapeHtml(m.toLocation||'—')}</td>
          <td>${m.box?U.boxBadge(m.box):'—'}</td>
          <td>${U.escapeHtml(m.staff||'—')}</td>
          <td>${U.escapeHtml(m.requestedBy||'—')}</td>
          <td>${U.escapeHtml(m.dept||'—')} / ${U.escapeHtml(m.office||'—')}</td>
          <td>${m.withdrawalAmount?U.fmtMoney(m.withdrawalAmount):'—'}</td>
          <td style="color:#6b7280">${U.escapeHtml(m.remarks||'—')}</td>
          <td>${AUTH.isAdmin()?`<span class="al" onclick="MOVEMENT.openEditModal('${m.id}')">Edit</span>`:'—'}</td>
        </tr>`).join('')}
        </tbody></table></div>`}
      </div>
      <div style="margin-top:10px;font-size:11px;color:#9ca3af">${movs.length} records</div>
    `;
  },

  openLogModal(clientId){
    const clients = DB.getClients();
    const settings = DB.getSettings();
    const users = DB.getUsers();
    const preClient = clientId ? DB.getClient(clientId) : null;

    const clientOpts = clients.map(c=>`<option value="${c.id}" ${clientId===c.id?'selected':''}>${U.escapeHtml(c.clientId||'?')} — ${U.escapeHtml(U.clientDisplayName(c))}</option>`).join('');
    const staffOpts = users.map(u=>`<option value="${u.name}">${u.name}</option>`).join('');

    const body=`
      <div class="fg" style="margin-bottom:12px">
        <label>Action Type <span class="req">*</span></label>
        <select id="ml-action" onchange="MOVEMENT.onActionChange()">
          <option value="">Select action</option>
          <option>Pull Out</option><option>Return</option><option>Receive</option><option>Inter-dept</option>
        </select>
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Date <span class="req">*</span></label>
          <input id="ml-date" type="date" value="${new Date().toISOString().split('T')[0]}" oninput="MOVEMENT.onDateChange(this.value)">
        </div>
        <div class="fg"><label>Time <span class="req">*</span></label>
          <input id="ml-time" type="time" value="${new Date().toTimeString().slice(0,5)}">
        </div>
      </div>
      <div id="ml-cycle-banner" style="display:none;margin-bottom:12px"></div>
      <div class="fg" style="margin-bottom:8px">
        <label>Client <span class="req">*</span></label>
        <input id="ml-client-search" placeholder="Type Client ID or name..."
          oninput="MOVEMENT.filterClientSearch(this.value)"
          style="padding:7px 10px;border:0.5px solid #d1d5db;border-radius:5px;font-size:12px;width:100%">
        <div id="ml-client-results" style="border:0.5px solid #d1d5db;border-top:none;border-radius:0 0 5px 5px;max-height:150px;overflow-y:auto;display:none;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
          ${clients.map(c=>`
            <div class="ml-c-opt" data-id="${c.id}" data-label="${U.escapeHtml(c.clientId||'')} ${U.escapeHtml(U.clientDisplayName(c))}"
              onclick="MOVEMENT.selectClient('${c.id}')"
              style="padding:8px 12px;cursor:pointer;border-bottom:0.5px solid #f3f4f6;display:flex;align-items:center;gap:10px">
              <span style="font-family:monospace;font-size:10px;font-weight:500;color:#1d4ed8;background:#dbeafe;padding:2px 6px;border-radius:3px;flex-shrink:0">${U.escapeHtml(c.clientId||'—')}</span>
              <span style="font-size:12px">${U.escapeHtml(U.clientDisplayName(c))}</span>
              <span style="font-size:10px;color:#9ca3af;margin-left:auto">${U.escapeHtml(c.office||'')}</span>
            </div>
          `).join('')}
        </div>
        <input type="hidden" id="ml-client">
        <div id="ml-client-chip" style="display:none;margin-top:6px;padding:7px 10px;background:#eff6ff;border:0.5px solid #bfdbfe;border-radius:5px;display:none;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <span id="ml-chip-id" style="font-family:monospace;font-size:10px;font-weight:500;color:#1d4ed8;background:#dbeafe;padding:2px 6px;border-radius:3px"></span>
            <span id="ml-chip-name" style="font-size:12px;font-weight:500;color:#111827"></span>
            <span id="ml-chip-office" style="font-size:11px;color:#6b7280"></span>
          </div>
          <button type="button" onclick="MOVEMENT.clearClient()" style="font-size:11px;color:#6b7280;cursor:pointer;padding:2px 8px;border-radius:3px;background:#e5e7eb;border:none">&#10005; Clear</button>
        </div>
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Item Type <span class="req">*</span></label>
          <select id="ml-itemtype" onchange="MOVEMENT.onItemTypeChange()">
            <option value="">Select type</option><option>ATM Card</option><option>Passbook</option>
          </select>
        </div>
        <div class="fg"><label>Select Item <span class="req">*</span></label>
          <select id="ml-item"><option value="">Select client &amp; type first</option></select>
        </div>
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>From Location</label>
          <select id="ml-from"><option>In Vault</option><option>Pulled Out</option><option>With Other Dept</option><option>Released</option></select>
        </div>
        <div class="fg"><label>To Location <span class="req">*</span></label>
          <select id="ml-to"><option>In Vault</option><option>Pulled Out</option><option>With Other Dept</option><option>Released</option></select>
        </div>
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Staff Handling <span class="req">*</span></label>
          <select id="ml-staff"><option value="">Select staff</option>${staffOpts}</select>
        </div>
        <div class="fg"><label>Storage Box</label>
          <select id="ml-box"><option value="">Select box</option>${settings.tags.map(t=>`<option>${t}</option>`).join('')}</select>
        </div>
      </div>
      <div id="ml-interdept-section" style="display:none">
        <div style="font-size:11px;font-weight:500;color:#5b21b6;padding:8px 10px;background:#f5f3ff;border-radius:5px;margin-bottom:10px">Inter-department request details</div>
        <div class="g4" style="margin-bottom:12px">
          <div class="fg"><label>Requested By</label><input id="ml-reqby" placeholder="Full name"></div>
          <div class="fg"><label>Request Date</label><input id="ml-reqdate" type="date"></div>
          <div class="fg"><label>Department</label><select id="ml-dept"><option value="">Select</option><option>Collection Dept</option><option>Audit Dept</option><option>Other</option></select></div>
          <div class="fg"><label>Office</label><input id="ml-office" list="ml-office-list" placeholder="Type office or branch name...">
              <datalist id="ml-office-list">${settings.branches.map(b=>`<option value="${b}">`).join('')}</datalist></div>
        </div>
      </div>
      <div id="ml-withdrawal-section" style="display:none;margin-bottom:12px">
        <div style="font-size:11px;font-weight:500;color:#1d4ed8;padding:8px 10px;background:#eff6ff;border-radius:5px;margin-bottom:10px">Withdrawal details — linked to cycle</div>
        <div class="g2">
          <div class="fg"><label>Withdrawal Amount (&#8369;)</label><input id="ml-amount" type="number" min="0" step="0.01" placeholder="0.00"></div>
          <div class="fg"><label>Cycle</label><input id="ml-cycle" readonly></div>
        </div>
      </div>
      <div class="fg">
        <label>Remarks / Reason <span class="req">*</span></label>
        <input id="ml-remarks" placeholder="Enter reason for this movement">
      </div>
    `;

    U.modal('Log Movement', body, ()=>MOVEMENT.saveMovement(clientId));

    // Auto-detect cycle on today's date
    this.onDateChange(new Date().toISOString().split('T')[0]);
    // Pre-select client if given
    if(clientId) this.onClientChange(clientId);
  },

  filterClientSearch(val){
    const results = document.getElementById('ml-client-results');
    if(!results) return;
    const opts = results.querySelectorAll('.ml-c-opt');
    const q = val.trim().toLowerCase();
    let visible = 0;
    opts.forEach(opt=>{
      const label = (opt.dataset.label||'').toLowerCase();
      const show = !q || label.includes(q);
      opt.style.display = show ? 'flex' : 'none';
      if(show) visible++;
    });
    results.style.display = q && visible>0 ? 'block' : 'none';
  },

  selectClient(clientId){
    const c = DB.getClient(clientId);
    if(!c) return;
    // Set hidden input
    const hiddenInp = document.getElementById('ml-client');
    if(hiddenInp) hiddenInp.value = clientId;
    // Hide results, update search field
    const results = document.getElementById('ml-client-results');
    if(results) results.style.display = 'none';
    const search = document.getElementById('ml-client-search');
    if(search) search.value = '';
    // Show chip
    const chip = document.getElementById('ml-client-chip');
    if(chip){ chip.style.display='flex'; }
    const chipId = document.getElementById('ml-chip-id');
    const chipName = document.getElementById('ml-chip-name');
    const chipOffice = document.getElementById('ml-chip-office');
    if(chipId) chipId.textContent = c.clientId||'—';
    if(chipName) chipName.textContent = U.clientDisplayName(c);
    if(chipOffice) chipOffice.textContent = c.office||'';
    // Trigger item population
    this.onClientChange(clientId);
  },

  clearClient(){
    const hiddenInp = document.getElementById('ml-client');
    if(hiddenInp) hiddenInp.value = '';
    const chip = document.getElementById('ml-client-chip');
    if(chip) chip.style.display='none';
    const search = document.getElementById('ml-client-search');
    if(search){ search.value=''; search.focus(); }
    // Reset item selects
    const itemSel = document.getElementById('ml-item');
    if(itemSel) itemSel.innerHTML='<option value="">Select client & type first</option>';
  },

  onDateChange(dateStr){
    const cycle = U.detectCycle(dateStr);
    const banner = document.getElementById('ml-cycle-banner');
    const wdSection = document.getElementById('ml-withdrawal-section');
    const cycleInp = document.getElementById('ml-cycle');
    if(!banner) return;
    if(cycle){
      banner.style.display='block';
      banner.innerHTML=`<div class="alert alert-info"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v1"/></svg>
        <div><strong>Cycle date detected: ${cycle}</strong> — this movement will be linked to the cycle audit record.</div></div>`;
      if(wdSection) wdSection.style.display='block';
      if(cycleInp) cycleInp.value=cycle;
    } else {
      banner.style.display='none';
      if(wdSection) wdSection.style.display='none';
      if(cycleInp) cycleInp.value='';
    }
  },

  onActionChange(){
    const action = document.getElementById('ml-action')?.value;
    const idSection = document.getElementById('ml-interdept-section');
    if(idSection) idSection.style.display = action==='Inter-dept'?'block':'none';
  },

  onClientChange(clientId){
    this.onItemTypeChange(clientId);
  },

  onItemTypeChange(forcedClientId){
    const clientId = forcedClientId || document.getElementById('ml-client')?.value;
    const type = document.getElementById('ml-itemtype')?.value;
    const itemSel = document.getElementById('ml-item');
    if(!itemSel) return;
    if(!clientId||!type){ itemSel.innerHTML='<option value="">Select client &amp; type first</option>'; return; }
    const c = DB.getClient(clientId);
    if(!c){ return; }
    const items = type==='ATM Card' ? (c.cards||[]) : (c.passbooks||[]);
    itemSel.innerHTML = items.length===0?'<option value="">No items found</option>':
      items.map(i=>`<option value="${i.id}|${i.slot||''}|${i.box||''}|${i.location||''}">${i.slot||'—'} — ${type==='ATM Card'?(i.cardNo||i.bank||'Card'):(i.passBookNo||'Passbook')}</option>`).join('');
  },

  async saveMovement(defaultClientId){
    const g=id=>document.getElementById(id)?.value?.trim()||'';
    const clientId = document.getElementById('ml-client')?.value||'';
    const action = g('ml-action');
    const itemVal = g('ml-item');
    const staff = g('ml-staff');
    const remarks = g('ml-remarks');

    if(!action||!clientId||!itemVal||!staff||!remarks){
      U.toast('Please fill in all required fields','error'); return;
    }

    const [itemId,slot,box,fromLocation] = itemVal.split('|');
    const itemType = g('ml-itemtype');
    const client = DB.getClient(clientId);
    const toLocation = g('ml-to');
    const cycle = g('ml-cycle');

    const mov = {
      clientId, clientName: U.clientDisplayName(client),
      action, itemId, itemType, slot, box,
      fromLocation: g('ml-from')||fromLocation,
      toLocation,
      staff,
      requestedBy: g('ml-reqby'),
      dept: g('ml-dept'),
      office: g('ml-office'),
      remarks,
      cycle: cycle||null,
      withdrawalAmount: g('ml-amount')||null,
      date: g('ml-date'),
      time: g('ml-time'),
    };

    await await DB.addMovement(mov);
    U.closeModal();
    U.toast('Movement logged');

    // Refresh current page
    const cur = APP.currentPage;
    if(cur==='movement') MOVEMENT.render(document.getElementById('content'));
    else if(cur==='client_profile') CLIENTS.renderProfile(document.getElementById('content'), defaultClientId||clientId);
    else if(cur==='dashboard') DASHBOARD.render(document.getElementById('content'));
  },

  openEditModal(movId){
    if(!AUTH.isAdmin()){U.toast('Only admins can edit movements','error');return;}
    const movs = DB.getMovements();
    const m = movs.find(x=>x.id===movId);
    if(!m){U.toast('Movement not found','error');return;}
    const users = DB.getUsers();
    const settings = DB.getSettings();
    const staffOpts = users.map(u=>`<option value="${u.name}" ${m.staff===u.name?'selected':''}>${u.name}</option>`).join('');

    const body=`
      <div class="alert alert-warn" style="margin-bottom:14px">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v1"/></svg>
        <div><strong>Admin edit — all changes are tracked.</strong><br>Original: logged by ${U.escapeHtml(m.staff||'—')} on ${U.fmtDateTime(m.createdAt)}</div>
      </div>
      ${m.editHistory&&m.editHistory.length>0?`
        <div style="margin-bottom:14px;padding:10px 12px;background:#f8f9fb;border:0.5px solid #e5e7eb;border-radius:6px">
          <div style="font-size:11px;font-weight:500;color:#374151;margin-bottom:6px">Previous edits</div>
          ${m.editHistory.map(h=>`
            <div style="font-size:11px;color:#6b7280;padding:5px 0;border-bottom:0.5px solid #f3f4f6">
              <strong>${U.escapeHtml(h.editedBy)}</strong> &mdash; ${U.fmtDateTime(h.editedAt)}<br>
              Reason: ${U.escapeHtml(h.reason)}<br>
              ${Object.entries(h.changes).map(([k,v])=>`${k}: <del>${U.escapeHtml(String(v.from||'—'))}</del> &rarr; <strong>${U.escapeHtml(String(v.to||'—'))}</strong>`).join(' · ')}
            </div>
          `).join('')}
        </div>
      `:''}
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Action Type</label>
          <select id="em-action">
            <option value="Pull Out" ${m.action==='Pull Out'?'selected':''}>Pull Out</option>
            <option value="Return" ${m.action==='Return'?'selected':''}>Return</option>
            <option value="Receive" ${m.action==='Receive'?'selected':''}>Receive</option>
            <option value="Inter-dept" ${m.action==='Inter-dept'?'selected':''}>Inter-dept</option>
          </select>
        </div>
        <div class="fg"><label>Staff Handling</label>
          <select id="em-staff">${staffOpts}</select>
        </div>
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>From Location</label>
          <select id="em-from">
            <option value="In Vault" ${m.fromLocation==='In Vault'?'selected':''}>In Vault</option>
            <option value="Pulled Out" ${m.fromLocation==='Pulled Out'?'selected':''}>Pulled Out</option>
            <option value="With Other Dept" ${m.fromLocation==='With Other Dept'?'selected':''}>With Other Dept</option>
            <option value="Released" ${m.fromLocation==='Released'?'selected':''}>Released</option>
          </select>
        </div>
        <div class="fg"><label>To Location</label>
          <select id="em-to">
            <option value="In Vault" ${m.toLocation==='In Vault'?'selected':''}>In Vault</option>
            <option value="Pulled Out" ${m.toLocation==='Pulled Out'?'selected':''}>Pulled Out</option>
            <option value="With Other Dept" ${m.toLocation==='With Other Dept'?'selected':''}>With Other Dept</option>
            <option value="Released" ${m.toLocation==='Released'?'selected':''}>Released</option>
          </select>
        </div>
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Slot</label><input id="em-slot" value="${U.escapeHtml(m.slot||'')}"></div>
        <div class="fg"><label>Storage Box</label>
          <select id="em-box">
            <option value="">No box</option>
            ${settings.tags.map(t=>`<option value="${t}" ${m.box===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Withdrawal Amount (&#8369;)</label>
          <input id="em-amount" type="number" min="0" step="0.01" value="${m.withdrawalAmount||''}">
        </div>
        <div class="fg"><label>Requested By</label>
          <input id="em-reqby" value="${U.escapeHtml(m.requestedBy||'')}">
        </div>
      </div>
      <div class="fg" style="margin-bottom:12px">
        <label>Remarks <span class="req">*</span></label>
        <input id="em-remarks" value="${U.escapeHtml(m.remarks||'')}">
      </div>
      <div class="fg">
        <label>Reason for this correction <span class="req">*</span></label>
        <input id="em-reason" placeholder="Why is this record being corrected?">
        <div class="hint">Required — this will be saved in the edit history</div>
      </div>
    `;
    U.modal('Edit Movement — '+U.escapeHtml(m.clientName||'Unknown'), body, ()=>MOVEMENT.saveEdit(movId,m));
  },

  async saveEdit(movId, original){
    if(!AUTH.isAdmin()){U.toast('Only admins can edit movements','error');return;}
    const g=id=>document.getElementById(id)?.value?.trim()||'';
    const remarks=g('em-remarks');
    const reason=g('em-reason');
    if(!remarks){U.toast('Remarks cannot be empty','error');return;}
    if(!reason){U.toast('Please enter a reason for this correction','error');return;}
    const newData={
      action:g('em-action'), staff:g('em-staff'),
      fromLocation:g('em-from'), toLocation:g('em-to'),
      slot:g('em-slot'), box:g('em-box'),
      withdrawalAmount:g('em-amount')?Number(g('em-amount')):null,
      requestedBy:g('em-reqby'), remarks,
    };
    const labels={action:'Action',staff:'Staff',fromLocation:'From',toLocation:'To',slot:'Slot',box:'Box',withdrawalAmount:'Withdrawal',requestedBy:'Requested By',remarks:'Remarks'};
    const changes={};
    Object.keys(newData).forEach(k=>{
      const ov=String(original[k]||''); const nv=String(newData[k]||'');
      if(ov!==nv) changes[labels[k]||k]={from:original[k],to:newData[k]};
    });
    if(Object.keys(changes).length===0){U.toast('No changes detected','error');return;}
    const histEntry={editedBy:AUTH.currentUser?.name||'Admin',editedAt:new Date().toISOString(),reason,changes};
    const movs=DB.getMovements();
    const idx=movs.findIndex(x=>x.id===movId);
    if(idx>-1){
      movs[idx]={...movs[idx],...newData,editHistory:[...(movs[idx].editHistory||[]),histEntry],lastEditedBy:AUTH.currentUser?.name,lastEditedAt:new Date().toISOString()};
      await DB.saveMovementEdit(movs[idx].id, movs[idx]);
    }
    U.closeModal();
    U.toast('Movement corrected — edit logged');
    this.render(document.getElementById('content'));
  },

  exportPDF(){
    const movs = DB.getMovements();
    U.exportPDF('Movement Log',
      ['Date/Time','Client','Slot','Type','Action','From','To','Box','Staff','Remarks'],
      movs.map(m=>[U.fmtDateTime(m.createdAt),m.clientName||'',m.slot||'',m.itemType,m.action,m.fromLocation||'',m.toLocation||'',m.box||'',m.staff||'',m.remarks||''])
    );
  },

  exportExcel(){
    const movs = DB.getMovements();
    U.exportExcel('Movement_Log',
      ['Date/Time','Client','Slot','Type','Action','From','To','Box','Staff','Requested By','Dept','Withdrawal','Remarks'],
      movs.map(m=>[U.fmtDateTime(m.createdAt),m.clientName||'',m.slot||'',m.itemType,m.action,m.fromLocation||'',m.toLocation||'',m.box||'',m.staff||'',m.requestedBy||'',m.dept||'',m.withdrawalAmount||'',m.remarks||''])
    );
  },
};
