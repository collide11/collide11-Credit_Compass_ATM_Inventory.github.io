const CYCLES = {
  async render(el){
    const today = new Date();
    const month = today.toLocaleString('default',{month:'long'});
    const year = today.getFullYear();
    const movs = DB.getMovements();

    const cycleData = [
      {name:'7th & 8th Cycle',days:[7,8],label:`${month} 7-8, ${year}`},
      {name:'15th & 16th Cycle',days:[15,16],label:`${month} 15-16, ${year}`},
      {name:'29th & 30th Cycle',days:[29,30],label:`${month} 29-30, ${year}`},
    ];

    const cycleSummary = cycleData.map(c=>{
      const cycleMovs = movs.filter(m=>m.cycle===c.name.replace(' Cycle','').trim());
      const totalWithdrawal = cycleMovs.reduce((sum,m)=>sum+Number(m.withdrawalAmount||0),0);
      const withdrawalMovs = cycleMovs.filter(m=>m.withdrawalAmount);
      return {...c, movs:cycleMovs, totalWithdrawal, withdrawalCount:withdrawalMovs.length};
    });

    const adhoc = movs.filter(m=>!m.cycle).slice(0,10);
    const clients = DB.getClients();

    el.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div style="font-size:12px;color:#6b7280">${month} ${year} — Withdrawal Cycles</div>
        <button type="button" class="btn-primary btn-sm" onclick="CYCLES.openWithdrawalForm()">&#8369; Record Withdrawal</button>
      </div>

      <!-- CYCLE CARDS -->
      <div class="cycle-grid">
        ${cycleSummary.map(c=>`
          <div class="cycle-card">
            <div class="cycle-card-hdr">
              <div class="ct">${c.name}</div>
              <div class="cd">${c.label}</div>
            </div>
            <div class="cycle-body">
              <div class="cycle-row"><span class="cl">Total Movements</span><span class="cv">${c.movs.length}</span></div>
              <div class="cycle-row"><span class="cl">Withdrawals Made</span><span class="cv">${c.withdrawalCount}</span></div>
              <div class="cycle-row"><span class="cl">Total Amount</span><span class="cv">${c.totalWithdrawal>0?U.fmtMoney(c.totalWithdrawal):'—'}</span></div>
            </div>
            <div class="cycle-foot">
              ${c.movs.length===0?U.badge('No entries yet','slate'):U.badge(c.withdrawalCount+' withdrawals','green')}
              <button type="button" class="btn-ghost btn-sm" style="margin-left:auto;padding:3px 8px;font-size:10px" onclick="CYCLES.openWithdrawalForm('${c.name}')">+ Add</button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- ALL CYCLE MOVEMENTS -->
      <div class="sec-label">All Cycle Movements This Month</div>
      <div class="tbl-wrap" style="margin-bottom:16px">
        ${movs.filter(m=>m.cycle).length===0?`<div class="empty"><div class="empty-title">No cycle movements logged yet</div></div>`:
        `<div style="overflow-x:auto"><table><thead><tr>
          <th>Date &amp; Time</th><th>Client</th><th>Slot</th><th>Item</th><th>Action</th>
          <th>Box</th><th>Cycle</th><th>Staff</th><th>Withdrawal</th><th>Remarks</th>
        </tr></thead><tbody>
        ${movs.filter(m=>m.cycle).map(m=>`<tr>
          <td>${U.fmtDateTime(m.createdAt)}</td>
          <td style="cursor:pointer;color:#1a56db" onclick="APP.navigate('client_profile',{id:'${m.clientId}'})">${U.escapeHtml(m.clientName||'—')}</td>
          <td style="font-family:monospace">${U.escapeHtml(m.slot||'—')}</td>
          <td>${U.itemTypeBadge(m.itemType)}</td>
          <td>${U.actionBadge(m.action)}</td>
          <td>${m.box?U.boxBadge(m.box):'—'}</td>
          <td>${U.badge(m.cycle||'—','blue')}</td>
          <td>${U.escapeHtml(m.staff||'—')}</td>
          <td style="font-weight:500;color:#15803d">${m.withdrawalAmount?U.fmtMoney(m.withdrawalAmount):'—'}</td>
          <td style="color:#6b7280">${U.escapeHtml(m.remarks||'—')}</td>
        </tr>`).join('')}
        </tbody></table></div>`}
      </div>

      <!-- AD HOC -->
      <div class="sec-label">Ad Hoc Movements (Non-cycle)</div>
      <div class="tbl-wrap">
        ${adhoc.length===0?`<div class="empty"><div class="empty-title">No ad hoc movements</div></div>`:
        `<table><thead><tr>
          <th>Date &amp; Time</th><th>Client</th><th>Slot</th><th>Action</th><th>Staff</th><th>Remarks</th>
        </tr></thead><tbody>
        ${adhoc.map(m=>`<tr>
          <td>${U.fmtDateTime(m.createdAt)}</td>
          <td>${U.escapeHtml(m.clientName||'—')}</td>
          <td style="font-family:monospace">${U.escapeHtml(m.slot||'—')}</td>
          <td>${U.actionBadge(m.action)}</td>
          <td>${U.escapeHtml(m.staff||'—')}</td>
          <td style="color:#6b7280">${U.escapeHtml(m.remarks||'—')}</td>
        </tr>`).join('')}
        </tbody></table>`}
      </div>
    `;
  },

  openWithdrawalForm(presetCycle){
    const clients = DB.getClients();
    const users = DB.getUsers();
    const today = new Date().toISOString().split('T')[0];
    const day = new Date().getDate();
    const autoDetected = U.detectCycle(today);
    const cycleName = presetCycle || autoDetected || '';

    const clientOpts = clients.map(c=>`<option value="${c.id}">${U.escapeHtml(c.clientId||'?')} — ${U.escapeHtml(U.clientDisplayName(c))}</option>`).join('');
    const staffOpts = users.map(u=>`<option value="${u.name}">${u.name}</option>`).join('');

    const body = `
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Date <span class="req">*</span></label>
          <input id="wd-date" type="date" value="${today}" oninput="CYCLES.onDateChange(this.value)">
        </div>
        <div class="fg"><label>Cycle (auto-detected)</label>
          <input id="wd-cycle" readonly value="${cycleName}" placeholder="Detected from date" style="background:#f9fafb;color:#6b7280">
        </div>
      </div>

      <div class="fg" style="margin-bottom:8px">
        <label>Client <span class="req">*</span></label>
        <input id="wd-client-search" placeholder="Type Client ID or name..."
          oninput="CYCLES.filterClientSearch(this.value)"
          style="padding:7px 10px;border:0.5px solid #d1d5db;border-radius:5px;font-size:12px;width:100%">
        <div id="wd-client-results" style="border:0.5px solid #d1d5db;border-top:none;border-radius:0 0 5px 5px;max-height:150px;overflow-y:auto;display:none;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
          ${clients.map(c=>`
            <div class="wd-c-opt" data-id="${c.id}" data-label="${U.escapeHtml(c.clientId||'')} ${U.escapeHtml(U.clientDisplayName(c))}"
              onclick="CYCLES.selectClient('${c.id}')"
              style="padding:8px 12px;cursor:pointer;border-bottom:0.5px solid #f3f4f6;display:flex;align-items:center;gap:10px">
              <span style="font-family:monospace;font-size:10px;font-weight:500;color:#1d4ed8;background:#dbeafe;padding:2px 6px;border-radius:3px;flex-shrink:0">${U.escapeHtml(c.clientId||'—')}</span>
              <span style="font-size:12px">${U.escapeHtml(U.clientDisplayName(c))}</span>
              <span style="font-size:10px;color:#9ca3af;margin-left:auto">${U.escapeHtml(c.office||'')}</span>
            </div>
          `).join('')}
        </div>
        <input type="hidden" id="wd-client">
        <div id="wd-client-chip" style="display:none;margin-top:6px;padding:7px 10px;background:#eff6ff;border:0.5px solid #bfdbfe;border-radius:5px;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <span id="wd-chip-id" style="font-family:monospace;font-size:10px;font-weight:500;color:#1d4ed8;background:#dbeafe;padding:2px 6px;border-radius:3px"></span>
            <span id="wd-chip-name" style="font-size:12px;font-weight:500;color:#111827"></span>
          </div>
          <button type="button" onclick="CYCLES.clearWdClient()" style="font-size:11px;color:#6b7280;cursor:pointer;padding:2px 8px;border-radius:3px;background:#e5e7eb;border:none">&#10005; Clear</button>
        </div>
      </div>

      <!-- Client info strip — shows after selection -->
      <div id="wd-client-info" style="display:none;margin-bottom:12px;padding:10px 12px;background:#f8f9fb;border:0.5px solid #e5e7eb;border-radius:6px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span id="wd-client-id" style="font-family:monospace;font-size:11px;font-weight:500;color:#1d4ed8;background:#dbeafe;padding:2px 8px;border-radius:4px"></span>
            <span id="wd-client-name" style="font-size:13px;font-weight:500;color:#111827"></span>
            <span id="wd-client-office" style="font-size:11px;color:#6b7280"></span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span id="wd-client-tag" style="font-size:10px"></span>
            <span id="wd-client-status" style="font-size:10px"></span>
            <button onclick="CYCLES.openQuickEdit(document.getElementById('wd-client').value)" style="font-size:10px;color:#1a56db;background:#eff6ff;border:0.5px solid #bfdbfe;border-radius:4px;padding:2px 8px;cursor:pointer">Change Tag/Status</button>
          </div>
        </div>
        <div id="wd-client-cards" style="margin-top:8px;font-size:11px;color:#6b7280"></div>
      </div>

      <div id="wd-items-section" style="display:none;margin-bottom:12px">
        <div class="g2">
          <div class="fg"><label>Item Type <span class="req">*</span></label>
            <select id="wd-itemtype" onchange="CYCLES.onItemTypeChange()">
              <option value="">Select type</option>
              <option>ATM Card</option>
              <option>Passbook</option>
            </select>
          </div>
          <div class="fg"><label>Select Item <span class="req">*</span></label>
            <select id="wd-item"><option value="">Select type first</option></select>
          </div>
        </div>
      </div>

      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Withdrawal Amount (&#8369;) <span class="req">*</span></label>
          <input id="wd-amount" type="number" min="0" step="0.01" placeholder="0.00">
        </div>
        <div class="fg"><label>Staff Who Made Withdrawal <span class="req">*</span></label>
          <select id="wd-staff"><option value="">Select staff</option>${staffOpts}</select>
        </div>
      </div>

      <div class="fg" style="margin-bottom:12px">
        <label>Remarks</label>
        <input id="wd-remarks" placeholder="e.g. Monthly pension withdrawal — 7th cycle">
      </div>
    `;

    U.modal('Record Withdrawal', body, ()=>CYCLES.saveWithdrawal());
  },

  onDateChange(dateStr){
    const cycle = U.detectCycle(dateStr);
    const el = document.getElementById('wd-cycle');
    if(el) el.value = cycle || 'No cycle — ad hoc';
  },

  filterClientSearch(val){
    const results = document.getElementById('wd-client-results');
    if(!results) return;
    const opts = results.querySelectorAll('.wd-c-opt');
    const q = val.trim().toLowerCase();
    let visible=0;
    opts.forEach(opt=>{
      const label=(opt.dataset.label||'').toLowerCase();
      const show=!q||label.includes(q);
      opt.style.display=show?'flex':'none';
      if(show) visible++;
    });
    results.style.display=q&&visible>0?'block':'none';
  },

  selectClient(clientId){
    const c=DB.getClient(clientId);
    if(!c) return;
    const hidden=document.getElementById('wd-client');
    if(hidden) hidden.value=clientId;
    const results=document.getElementById('wd-client-results');
    if(results) results.style.display='none';
    const search=document.getElementById('wd-client-search');
    if(search) search.value='';
    const chip=document.getElementById('wd-client-chip');
    if(chip) chip.style.display='flex';
    const chipId=document.getElementById('wd-chip-id');
    const chipName=document.getElementById('wd-chip-name');
    if(chipId) chipId.textContent=c.clientId||'—';
    if(chipName) chipName.textContent=U.clientDisplayName(c);
    this.onClientChange(clientId);
  },

  clearWdClient(){
    const hidden=document.getElementById('wd-client');
    if(hidden) hidden.value='';
    const chip=document.getElementById('wd-client-chip');
    if(chip) chip.style.display='none';
    const search=document.getElementById('wd-client-search');
    if(search){search.value='';search.focus();}
    const section=document.getElementById('wd-items-section');
    if(section) section.style.display='none';
    const infoStrip=document.getElementById('wd-client-info');
    if(infoStrip) infoStrip.style.display='none';
  },

  onClientChange(clientId){
    const section = document.getElementById('wd-items-section');
    const infoStrip = document.getElementById('wd-client-info');
    if(!clientId){
      if(section) section.style.display='none';
      if(infoStrip) infoStrip.style.display='none';
      return;
    }
    if(section) section.style.display='block';
    if(infoStrip) infoStrip.style.display='block';
    document.getElementById('wd-itemtype').value = '';
    document.getElementById('wd-item').innerHTML = '<option value="">Select type first</option>';

    const c = DB.getClient(clientId);
    if(!c) return;

    // Populate info strip
    const idEl = document.getElementById('wd-client-id');
    const nameEl = document.getElementById('wd-client-name');
    const officeEl = document.getElementById('wd-client-office');
    const tagEl = document.getElementById('wd-client-tag');
    const statusEl = document.getElementById('wd-client-status');
    const cardsEl = document.getElementById('wd-client-cards');

    if(idEl) idEl.textContent = c.clientId || '—';
    if(nameEl) nameEl.textContent = U.clientDisplayName(c);
    if(officeEl) officeEl.textContent = c.office || '';

    // Tag badge
    const tagColors = {'Deceased 1st':'#991b1b','Deceased 16th':'#991b1b','Blacklisted':'#475569','Trouble Rogue':'#92400e','TR3':'#92400e','GSIS':'#1d4ed8','Unahan':'#5b21b6','Error':'#dc2626','New/Old':'#15803d','Inactive':'#475569'};
    const tagBg = {'Deceased 1st':'#fee2e2','Deceased 16th':'#fee2e2','Blacklisted':'#f1f5f9','Trouble Rogue':'#fef3c7','TR3':'#fef3c7','GSIS':'#dbeafe','Unahan':'#ede9fe','Error':'#fee2e2','New/Old':'#dcfce7','Inactive':'#f1f5f9'};
    if(tagEl) tagEl.innerHTML = c.tag ? `<span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500;background:${tagBg[c.tag]||'#f1f5f9'};color:${tagColors[c.tag]||'#475569'}">${c.tag}</span>` : '';

    const statusColors = {'Active':'#15803d','Inactive':'#475569','Deceased':'#991b1b','Trouble Rogue':'#92400e','Blacklisted':'#991b1b','Released':'#1d4ed8'};
    const statusBg = {'Active':'#dcfce7','Inactive':'#f1f5f9','Deceased':'#fee2e2','Trouble Rogue':'#fef3c7','Blacklisted':'#fee2e2','Released':'#dbeafe'};
    if(statusEl) statusEl.innerHTML = c.contingencyStatus ? `<span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500;background:${statusBg[c.contingencyStatus]||'#f1f5f9'};color:${statusColors[c.contingencyStatus]||'#475569'}">${c.contingencyStatus}</span>` : '';

    // Cards/passbooks summary
    const cardCount = (c.cards||[]).length;
    const pbCount = (c.passbooks||[]).length;
    if(cardsEl) cardsEl.textContent = `${cardCount} ATM card${cardCount!==1?'s':''} · ${pbCount} passbook${pbCount!==1?'s':''} · Pension: ${c.pensionType||'—'} ${c.pensionAmount?'· ₱'+Number(c.pensionAmount).toLocaleString()+'/ mo':''}`;
  },

  async openQuickEdit(clientId){
    if(!clientId){ U.toast('Select a client first','error'); return; }
    const c = DB.getClient(clientId);
    if(!c) return;
    const s = DB.getSettings();

    U.modal('Change Tag / Status — '+U.clientDisplayName(c), `
      <div style="margin-bottom:14px;padding:10px 12px;background:#f8f9fb;border-radius:6px;font-size:12px">
        <span style="font-family:monospace;color:#1d4ed8">${U.escapeHtml(c.clientId||'—')}</span>
        &nbsp;·&nbsp; ${U.escapeHtml(U.clientDisplayName(c))}
        &nbsp;·&nbsp; ${U.escapeHtml(c.office||'—')}
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg">
          <label>Contingency Status</label>
          <select id="qe-status">
            ${['Active','Inactive','Deceased','Trouble Rogue','Blacklisted','Released'].map(s=>`<option value="${s}" ${c.contingencyStatus===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="fg">
          <label>Contingency Date</label>
          <input id="qe-contdate" type="date" value="${c.contingencyDate||''}">
        </div>
      </div>
      <div class="fg" style="margin-bottom:12px">
        <label>Tag / Storage Box</label>
        <select id="qe-tag">
          <option value="">No tag</option>
          ${s.tags.map(t=>`<option value="${t}" ${c.tag===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="g2">
        <div class="fg">
          <label>Problem Code</label>
          <input id="qe-problem" value="${U.escapeHtml(c.problemCode||'')}" placeholder="Free text">
        </div>
        <div class="fg">
          <label>Collection Status</label>
          <input id="qe-collection" value="${U.escapeHtml(c.collectionStatus||'')}" placeholder="Free text">
        </div>
      </div>
    `, async ()=>{
      const newStatus = document.getElementById('qe-status')?.value;
      const newTag = document.getElementById('qe-tag')?.value;
      const newDate = document.getElementById('qe-contdate')?.value;
      const newProblem = document.getElementById('qe-problem')?.value;
      const newCollection = document.getElementById('qe-collection')?.value;
      await DB.updateClient(clientId, {
        contingencyStatus: newStatus,
        contingencyDate: newDate,
        tag: newTag,
        problemCode: newProblem,
        collectionStatus: newCollection,
      });
      U.closeModal();
      U.toast('Client status and tag updated');
      // Refresh the client info strip
      this.onClientChange(clientId);
    });
  },

  onItemTypeChange(){
    const clientId = document.getElementById('wd-client')?.value;
    const type = document.getElementById('wd-itemtype')?.value;
    const itemSel = document.getElementById('wd-item');
    if(!itemSel) return;
    if(!clientId||!type){ itemSel.innerHTML='<option value="">Select type first</option>'; return; }
    const c = DB.getClient(clientId);
    if(!c) return;
    const items = type==='ATM Card' ? (c.cards||[]) : (c.passbooks||[]);
    itemSel.innerHTML = items.length===0 ?
      '<option value="">No items found — add from client profile</option>' :
      items.map(i=>`<option value="${i.id}|${i.slot||''}|${i.box||''}|${i.location||''}">${i.slot||'—'} — ${type==='ATM Card'?(i.bank||'')+'  '+(i.cardNo||''):(i.passBookNo||'')}</option>`).join('');
  },

  async saveWithdrawal(){
    const g = id => document.getElementById(id)?.value?.trim()||'';
    const clientId = document.getElementById('wd-client')?.value||'';
    const amount = g('wd-amount');
    const staff = g('wd-staff');
    const date = g('wd-date');
    const itemVal = g('wd-item');
    const itemType = g('wd-itemtype');

    if(!clientId||!amount||!staff||!date){U.toast('Please fill all required fields','error');return;}

    const client = DB.getClient(clientId);
    const cycle = U.detectCycle(date);
    const [itemId,slot,box] = itemVal ? itemVal.split('|') : ['','',''];

    await await DB.addMovement({
      clientId,
      clientName: U.clientDisplayName(client),
      action: 'Pull Out',
      itemId: itemId||'',
      itemType: itemType||'ATM Card',
      slot: slot||'',
      box: box||'',
      fromLocation: 'In Vault',
      toLocation: 'Pulled Out',
      staff,
      requestedBy: '',
      dept: '',
      office: client?.office||'',
      remarks: g('wd-remarks') || 'Withdrawal — '+( cycle||'ad hoc'),
      cycle: cycle||null,
      withdrawalAmount: Number(amount),
      date,
      time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
    });

    U.closeModal();
    U.toast('Withdrawal recorded — ₱'+Number(amount).toLocaleString());
    this.render(document.getElementById('content'));
  },
};
