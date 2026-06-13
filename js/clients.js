const CLIENTS = {
  searchTerm:'', filterTag:'', filterStatus:'',

  generateClientId(){
    const clients=DB.getClients();
    const existing=clients.map(c=>c.clientId||'').filter(Boolean);
    let n=clients.length+1;
    let id='CLT-'+String(n).padStart(4,'0');
    while(existing.includes(id)){ n++; id='CLT-'+String(n).padStart(4,'0'); }
    return id;
  },

  render(el){
    const clients=DB.getClients(); const settings=DB.getSettings();
    let filtered=clients;
    if(this.searchTerm){ const s=this.searchTerm.toLowerCase(); filtered=filtered.filter(c=>`${c.clientId||''} ${c.lastName} ${c.firstName} ${c.middleName||''} ${c.bankAccountNo||''} ${c.cardNo||''} ${c.office||''}`.toLowerCase().includes(s)); }
    if(this.filterTag) filtered=filtered.filter(c=>c.tag===this.filterTag);
    if(this.filterStatus) filtered=filtered.filter(c=>c.contingencyStatus===this.filterStatus);
    el.innerHTML=`
      <div class="toolbar">
        <div class="toolbar-l">
          <input class="search" placeholder="Search by Client ID, name, account #..." value="${U.escapeHtml(this.searchTerm)}"
            oninput="CLIENTS.searchTerm=this.value;CLIENTS.render(document.getElementById('content'))">
          <select class="fsel" onchange="CLIENTS.filterTag=this.value;CLIENTS.render(document.getElementById('content'))">
            <option value="">All Tags</option>
            ${settings.tags.map(t=>`<option value="${t}" ${this.filterTag===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <select class="fsel" onchange="CLIENTS.filterStatus=this.value;CLIENTS.render(document.getElementById('content'))">
            <option value="">All Statuses</option>
            ${['Active','Inactive','Deceased','Trouble Rogue','Blacklisted','Released'].map(s=>`<option value="${s}" ${this.filterStatus===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="toolbar-r">
          <button type="button" class="btn-primary" onclick="APP.navigate('client_add')">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1v12M1 7h12"/></svg> Add Client
          </button>
        </div>
      </div>
      <div class="tbl-wrap">
        ${filtered.length===0?`<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;margin:0 auto 12px;opacity:0.3;display:block"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg><div class="empty-title">No clients found</div><div class="empty-sub">${clients.length===0?'Add your first client':'Try adjusting your filters'}</div></div>`:
        `<table><thead><tr>
          <th>Client ID</th><th>Full Name</th><th>Gender</th><th>Branch</th>
          <th>Bank</th><th>Cards</th><th>PBs</th><th>Tag</th><th>Status</th><th>Action</th>
        </tr></thead><tbody>
        ${filtered.map(c=>`<tr>
          <td style="font-family:monospace;font-size:11px;color:#1d4ed8;font-weight:500">${U.escapeHtml(c.clientId||'—')}</td>
          <td style="font-weight:500">${U.escapeHtml(U.clientDisplayName(c))}</td>
          <td>${U.escapeHtml(c.gender||'—')}</td>
          <td>${U.escapeHtml(c.office||'—')}</td>
          <td>${U.escapeHtml(c.bankName||'—')}</td>
          <td><span style="font-weight:500;color:#1d4ed8">${(c.cards||[]).length}</span></td>
          <td><span style="font-weight:500;color:#5b21b6">${(c.passbooks||[]).length}</span></td>
          <td>${c.tag?U.boxBadge(c.tag):'—'}</td>
          <td>${c.contingencyStatus?U.statusBadge(c.contingencyStatus):'—'}</td>
          <td>
            <span class="al" onclick="APP.navigate('client_profile',{id:'${c.id}'})">View</span>
            &nbsp;<span class="al" onclick="APP.navigate('client_add',{clientId:'${c.id}'})">Edit</span>
            &nbsp;<span class="al" style="color:#92400e" onclick="CLIENTS.openQuickEdit('${c.id}')">Tag</span>
            &nbsp;<span class="al" style="color:#dc2626" onclick="CLIENTS.deleteClient('${c.id}')">Del</span>
          </td>
        </tr>`).join('')}
        </tbody></table>`}
      </div>
      <div style="margin-top:10px;font-size:11px;color:#9ca3af">Showing ${filtered.length} of ${clients.length} clients</div>`;
  },

  async deleteClient(id){
    U.confirm('Delete this client and all their cards/passbooks?',async()=>{
      APP.showLoader('Deleting client...');
      await DB.deleteClient(id);
      APP.hideLoader();
      U.toast('Client deleted');
      this.render(document.getElementById('content'));
    });
  },

  renderAdd(el,editId){
    const isEdit=!!editId; const c=isEdit?DB.getClient(editId):{}; const s=DB.getSettings();
    if(isEdit) document.getElementById('page-title').textContent='Edit Client';
    el.innerHTML=`
    <div class="form-page">
      <div style="margin-bottom:14px"><button type="button" class="btn-ghost btn-sm" onclick="if(confirm('Leave form? Changes will be lost.'))APP.navigate('clients')">&#8592; Back to Clients</button></div>
      <div class="form-sec">
        <div class="form-sec-hdr"><div class="card-dot" style="background:#1a56db"></div><span>Personal Information</span></div>
        <div class="form-body">
          <div class="g3" style="margin-bottom:12px">
            <div class="fg"><label>Client ID <span class="req">*</span></label>
              <input id="f-clientId" value="${U.escapeHtml(c.clientId||this.generateClientId())}">
              <div class="hint">Unique ID — auto-generated, editable</div>
            </div>
            <div class="fg"><label>Last Name <span class="req">*</span></label><input id="f-lastName" value="${U.escapeHtml(c.lastName||'')}"></div>
            <div class="fg"><label>Gender <span class="req">*</span></label>
              <select id="f-gender"><option value="">Select</option><option ${c.gender==='Male'?'selected':''}>Male</option><option ${c.gender==='Female'?'selected':''}>Female</option></select>
            </div>
          </div>
          <div class="g3">
            <div class="fg"><label>First Name <span class="req">*</span></label><input id="f-firstName" value="${U.escapeHtml(c.firstName||'')}"></div>
            <div class="fg"><label>Middle Name</label><input id="f-middleName" value="${U.escapeHtml(c.middleName||'')}"></div>
            <div class="fg"><label>Spouse</label><input id="f-spouse" value="${U.escapeHtml(c.spouse||'')}"></div>
          </div>
          <div class="g3">
            <div class="fg"><label>Birthdate <span class="req">*</span></label><input id="f-birthdate" type="date" value="${c.birthdate||''}" oninput="document.getElementById('f-age').value=this.value?U.calcAge(this.value)+' years old':''"></div>
            <div class="fg"><label>Age</label><input id="f-age" readonly value="${c.birthdate?U.calcAge(c.birthdate)+' years old':''}"></div>
            <div class="fg"><label>Address <span class="req">*</span></label><input id="f-address" value="${U.escapeHtml(c.address||'')}"></div>
          </div>
        </div>
      </div>
      <div class="form-sec">
        <div class="form-sec-hdr"><div class="card-dot" style="background:#0f6e56"></div><span>Bank &amp; Card Details</span></div>
        <div class="form-body">
          <div class="g3">
            <div class="fg"><label>Bank Name</label><select id="f-bankName"><option value="">Select bank</option>${s.banks.map(b=>`<option ${c.bankName===b?'selected':''}>${b}</option>`).join('')}</select></div>
            <div class="fg"><label>Bank Account #</label><input id="f-bankAccountNo" value="${U.escapeHtml(c.bankAccountNo||'')}"></div>
            <div class="fg"><label>ATM Card #</label><input id="f-cardNo" value="${U.escapeHtml(c.cardNo||'')}"></div>
          </div>
          <div class="g4">
            <div class="fg"><label>Passbook #</label><input id="f-passbookNo" value="${U.escapeHtml(c.passbookNo||'')}"></div>
            <div class="fg"><label>Expiration</label><input id="f-expiration" type="month" value="${c.expiration||''}"></div>
            <div class="fg"><label>Withdrawal Date</label><input id="f-withdrawalDate" type="date" value="${c.withdrawalDate||''}"></div>
            <div class="fg"><label>ATM PIN</label>
              <div class="pin-toggle-wrap">
                <input id="f-atmPin" type="password" maxlength="4" value="${U.escapeHtml(c.atmPin||'')}">
                <button type="button" class="pin-toggle" onclick="var i=document.getElementById('f-atmPin');i.type=i.type==='password'?'text':'password'">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z"/><circle cx="7" cy="7" r="1.5"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="form-sec">
        <div class="form-sec-hdr"><div class="card-dot" style="background:#854f0b"></div><span>Pension Details</span></div>
        <div class="form-body">
          <div class="g3">
            <div class="fg"><label>Pension Type <span class="req">*</span></label><select id="f-pensionType"><option value="">Select type</option>${s.pensionTypes.map(t=>`<option ${c.pensionType===t?'selected':''}>${t}</option>`).join('')}</select></div>
            <div class="fg"><label>Pension Amount (&#8369;)</label><input id="f-pensionAmount" type="number" value="${c.pensionAmount||''}" min="0" step="0.01"></div>
            <div class="fg"><label>Office / Branch <span class="req">*</span></label>
              <input id="f-office" list="f-office-list" placeholder="Type office or branch name..." value="${U.escapeHtml(c.office||'')}">
              <datalist id="f-office-list">${s.branches.map(b=>`<option value="${b}">`).join('')}</datalist>
            </div>
          </div>
        </div>
      </div>
      <div class="form-sec">
        <div class="form-sec-hdr"><div class="card-dot" style="background:#7f77dd"></div><span>Contingency &amp; Status</span></div>
        <div class="form-body">
          <div class="g4">
            <div class="fg"><label>Contingency Status <span class="req">*</span></label><select id="f-contingencyStatus"><option value="">Select</option>${['Active','Inactive','Deceased','Trouble Rogue','Blacklisted','Released'].map(s=>`<option ${c.contingencyStatus===s?'selected':''}>${s}</option>`).join('')}</select></div>
            <div class="fg"><label>Contingency Date</label><input id="f-contingencyDate" type="date" value="${c.contingencyDate||''}"><div class="hint">Date when status was recorded</div></div>
            <div class="fg"><label>Tag / Box Group</label><select id="f-tag"><option value="">Select tag</option>${s.tags.map(t=>`<option ${c.tag===t?'selected':''}>${t}</option>`).join('')}</select></div>
            <div class="fg"><label>Problem Code</label><input id="f-problemCode" value="${U.escapeHtml(c.problemCode||'')}"></div>
          </div>
          <div class="g2" style="margin-top:12px;margin-bottom:0">
            <div class="fg"><label>Collection Status</label><input id="f-collectionStatus" value="${U.escapeHtml(c.collectionStatus||'')}"></div>
          </div>
        </div>
      </div>
      <div class="form-footer">
        <div class="form-footer-note">Fields marked <span class="req">*</span> are required</div>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn-ghost" onclick="if(confirm('Leave form? Changes will be lost.'))APP.navigate('clients')">Cancel</button>
          <button type="button" class="btn-primary" onclick="CLIENTS.saveClient('${editId||''}')">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 7l4 4 6-6"/></svg>
            ${isEdit?'Update Client':'Save Client'}
          </button>
        </div>
      </div>
    </div>`;
  },

  async saveClient(editId){
    const g=id=>document.getElementById(id)?.value?.trim()||'';
    const data={
      clientId:g('f-clientId'),lastName:g('f-lastName'),firstName:g('f-firstName'),middleName:g('f-middleName'),
      gender:g('f-gender'),birthdate:g('f-birthdate'),age:U.calcAge(g('f-birthdate')),
      spouse:g('f-spouse'),address:g('f-address'),bankName:g('f-bankName'),
      bankAccountNo:g('f-bankAccountNo'),cardNo:g('f-cardNo'),passbookNo:g('f-passbookNo'),
      expiration:g('f-expiration'),withdrawalDate:g('f-withdrawalDate'),atmPin:g('f-atmPin'),
      pensionType:g('f-pensionType'),pensionAmount:g('f-pensionAmount'),office:g('f-office'),
      contingencyStatus:g('f-contingencyStatus'),contingencyDate:g('f-contingencyDate'),
      tag:g('f-tag'),problemCode:g('f-problemCode'),collectionStatus:g('f-collectionStatus'),
    };
    if(!data.clientId||!data.lastName||!data.firstName||!data.gender||!data.birthdate||!data.address){U.toast('Please fill in all required fields','error');return;}
    const existing=DB.getClients().find(c=>c.clientId===data.clientId&&c.id!==(editId||''));
    if(existing){U.toast('Client ID "'+data.clientId+'" is already used by '+U.clientDisplayName(existing),'error');return;}
    APP.showLoader(editId?'Updating client...':'Saving client...');
    if(editId){ await DB.updateClient(editId,data); U.toast('Client updated'); }
    else { await DB.addClient(data); U.toast('Client saved'); }
    APP.hideLoader();
    APP.navigate('clients');
  },

  renderProfile(el,clientId){
    const c=DB.getClient(clientId);
    if(!c){el.innerHTML='<div class="empty"><div class="empty-title">Client not found</div></div>';return;}
    const notes=DB.getNotes(clientId);
    const movements=DB.getMovements().filter(m=>m.clientId===clientId);
    const initials=((c.firstName||'')[0]||'')+((c.lastName||'')[0]||'');
    el.innerHTML=`
    <div style="margin-bottom:14px"><button type="button" class="btn-ghost btn-sm" onclick="APP.navigate('clients')">&#8592; Back to Clients</button></div>
    <div class="profile-top">
      <div class="profile-photo">${initials.toUpperCase()}</div>
      <div class="profile-info">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          <div class="profile-name">${U.escapeHtml(U.clientDisplayName(c))}</div>
          <span style="font-family:monospace;font-size:11px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:4px">${U.escapeHtml(c.clientId||'—')}</span>
        </div>
        <div class="profile-meta">
          <span>${U.escapeHtml(c.gender||'—')}</span><span class="meta-sep">·</span>
          <span>${c.birthdate?U.calcAge(c.birthdate)+' yrs old':'—'}</span><span class="meta-sep">·</span>
          <span>Born ${U.fmtDate(c.birthdate)}</span>
          ${c.spouse?`<span class="meta-sep">·</span><span>Spouse: ${U.escapeHtml(c.spouse)}</span>`:''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${c.contingencyStatus?U.statusBadge(c.contingencyStatus):''}
          ${c.tag?U.boxBadge(c.tag):''}
          <span style="font-size:11px;color:#6b7280">${U.escapeHtml(c.office||'—')}</span>
          ${c.contingencyDate?`<span style="font-size:11px;color:#9ca3af">since ${U.fmtDate(c.contingencyDate)}</span>`:''}
        </div>
      </div>
      <div class="profile-actions">
        <button type="button" class="btn-ghost btn-sm" onclick="APP.navigate('client_add',{clientId:'${clientId}'})">&#9998; Edit</button>
        <button type="button" class="btn-ghost btn-sm" style="border-color:#fde68a;color:#92400e;background:#fffbeb" onclick="CLIENTS.openQuickEdit('${clientId}')">&#128204; Tag/Status</button>
        <button type="button" class="btn-primary btn-sm" onclick="MOVEMENT.openLogModal('${clientId}')">&#10140; Log Movement</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
      <div class="card">
        <div class="card-hdr"><div class="card-hdr-l"><div class="card-dot" style="background:#854f0b"></div><span>Pension &amp; Status</span></div></div>
        <div class="card-body">
          <div class="field-grid" style="margin-bottom:10px">
            <div class="field-item"><div class="fi-label">Pension Type</div><div class="fi-val">${U.escapeHtml(c.pensionType||'—')}</div></div>
            <div class="field-item"><div class="fi-label">Amount/Month</div><div class="fi-val">${c.pensionAmount?U.fmtMoney(c.pensionAmount):'—'}</div></div>
            <div class="field-item"><div class="fi-label">Office</div><div class="fi-val">${U.escapeHtml(c.office||'—')}</div></div>
          </div>
          <div class="field-grid g2">
            <div class="field-item"><div class="fi-label">Problem Code</div><div class="fi-val">${U.escapeHtml(c.problemCode||'—')}</div></div>
            <div class="field-item"><div class="fi-label">Collection Status</div><div class="fi-val">${U.escapeHtml(c.collectionStatus||'—')}</div></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-hdr-l"><div class="card-dot" style="background:#0f6e56"></div><span>Bank &amp; Contact</span></div></div>
        <div class="card-body">
          <div class="field-grid g2" style="margin-bottom:8px">
            <div class="field-item"><div class="fi-label">Bank</div><div class="fi-val">${U.escapeHtml(c.bankName||'—')}</div></div>
            <div class="field-item"><div class="fi-label">Account #</div><div class="fi-val" style="font-family:monospace">${U.escapeHtml(c.bankAccountNo||'—')}</div></div>
          </div>
          <div class="field-item"><div class="fi-label">Address</div><div class="fi-val" style="white-space:normal;line-height:1.5">${U.escapeHtml(c.address||'—')}</div></div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-hdr">
        <div class="card-hdr-l"><div class="card-dot" style="background:#0f6e56"></div>
          <span>ATM Cards <span style="font-weight:400;color:#9ca3af">(${(c.cards||[]).length})</span></span>
        </div>
        <button type="button" class="btn-ghost btn-sm" onclick="CLIENTS.toggleForm('add-card-form')">+ Add Card</button>
      </div>
      <div style="padding:14px">
        ${(c.cards||[]).length===0?'<div style="font-size:12px;color:#9ca3af;text-align:center;padding:10px 0">No ATM cards yet</div>':
          (c.cards||[]).map(card=>this.cardItemHTML(c,card)).join('')}
        <div class="inline-form" id="add-card-form">
          <div class="inline-form-title">+ Add new ATM card</div>
          ${this.cardFormHTML(clientId,{})}
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
            <button type="button" class="btn-ghost btn-sm" onclick="CLIENTS.toggleForm('add-card-form')">Cancel</button>
            <button type="button" class="btn-primary btn-sm" onclick="CLIENTS.saveCard('${clientId}')">Save Card</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-hdr">
        <div class="card-hdr-l"><div class="card-dot" style="background:#5b21b6"></div>
          <span>Passbooks <span style="font-weight:400;color:#9ca3af">(${(c.passbooks||[]).length})</span></span>
        </div>
        <button type="button" class="btn-ghost btn-sm" onclick="CLIENTS.toggleForm('add-pb-form')">+ Add Passbook</button>
      </div>
      <div style="padding:14px">
        ${(c.passbooks||[]).length===0?'<div style="font-size:12px;color:#9ca3af;text-align:center;padding:10px 0">No passbooks yet</div>':
          (c.passbooks||[]).map(pb=>this.pbItemHTML(c,pb)).join('')}
        <div class="inline-form" id="add-pb-form">
          <div class="inline-form-title">+ Add new passbook</div>
          ${this.pbFormHTML(clientId,{})}
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
            <button type="button" class="btn-ghost btn-sm" onclick="CLIENTS.toggleForm('add-pb-form')">Cancel</button>
            <button type="button" class="btn-primary btn-sm" onclick="CLIENTS.savePB('${clientId}')">Save Passbook</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-hdr">
        <div class="card-hdr-l"><div class="card-dot" style="background:#1a56db"></div><span>Movement History</span></div>
        <span style="font-size:11px;color:#9ca3af">${movements.length} records</span>
      </div>
      ${movements.length===0?'<div class="empty" style="padding:20px"><div class="empty-title">No movements logged yet</div></div>':
      `<div style="overflow-x:auto"><table><thead><tr>
        <th>Date &amp; Time</th><th>Slot</th><th>Item</th><th>Action</th>
        <th>From &rarr; To</th><th>Staff</th><th>Requested By</th><th>Remarks</th>
      </tr></thead><tbody>
      ${movements.map(m=>`<tr>
        <td>${U.fmtDateTime(m.createdAt)}${m.lastEditedAt?`<br><span style="font-size:9px;color:#92400e;background:#fef3c7;padding:1px 5px;border-radius:3px">edited</span>`:''}</td>
        <td style="font-family:monospace">${U.escapeHtml(m.slot||'—')}</td>
        <td>${U.itemTypeBadge(m.itemType)}</td>
        <td>${U.actionBadge(m.action)}</td>
        <td style="color:#6b7280">${U.escapeHtml(m.fromLocation||'—')} &rarr; ${U.escapeHtml(m.toLocation||'—')}</td>
        <td>${U.escapeHtml(m.staff||'—')}</td>
        <td>${U.escapeHtml(m.requestedBy||'—')}</td>
        <td style="color:#6b7280">${U.escapeHtml(m.remarks||'—')}</td>
      </tr>`).join('')}
      </tbody></table></div>`}
    </div>
    <div class="card">
      <div class="card-hdr">
        <div class="card-hdr-l"><div class="card-dot" style="background:#15803d"></div><span>Follow-up Notes</span></div>
        <span style="font-size:11px;color:#9ca3af">${notes.length} notes</span>
      </div>
      <div id="notes-list">
        ${notes.length===0?'<div class="empty" style="padding:16px"><div class="empty-title">No notes yet</div></div>':
          notes.map(n=>`<div class="note-item">
            <div class="note-av">${U.escapeHtml(n.initials||'?')}</div>
            <div><div class="note-text">${U.escapeHtml(n.text)}</div>
            <div class="note-meta">${U.escapeHtml(n.author||'—')} &middot; ${U.fmtDateTime(n.createdAt)}</div></div>
          </div>`).join('')}
      </div>
      <div class="note-input">
        <input id="note-inp" placeholder="Add a follow-up note..." onkeydown="if(event.key==='Enter'){event.preventDefault();event.stopPropagation();CLIENTS.addNote('${clientId}');}">
        <button type="button" class="btn-primary btn-sm" onclick="CLIENTS.addNote('${clientId}')">Add</button>
      </div>
    </div>`;
  },

  toggleForm(id){ document.getElementById(id)?.classList.toggle('show'); },

  cardItemHTML(c,card){
    return `<div class="item-card">
      <div class="item-card-hdr">
        <div class="item-card-hdr-l">${U.badge('ATM Card','blue')}
          <span style="font-size:12px;font-weight:500">${U.escapeHtml(card.bank||'—')}</span>
          <span style="font-family:monospace;font-size:11px;color:#6b7280">${U.escapeHtml(card.cardNo||'—')}</span>
          ${U.badge(card.flag||'Old','slate')}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${U.locationBadge(card.location||'In Vault')}
          <span class="al" onclick="CLIENTS.openEditCard('${c.id}','${card.id}')">Edit</span>
          <span class="al" style="color:#dc2626" onclick="CLIENTS.delCard('${c.id}','${card.id}')">Remove</span>
        </div>
      </div>
      <div class="item-card-body">
        <div class="item-field"><div class="if-label">Account #</div><div class="if-val" style="font-family:monospace">${U.escapeHtml(card.accountNo||'—')}</div></div>
        <div class="item-field"><div class="if-label">Slot</div><div class="if-val">${U.escapeHtml(card.slot||'—')}</div></div>
        <div class="item-field"><div class="if-label">Box</div><div class="if-val">${card.box?U.boxBadge(card.box):'—'}</div></div>
        <div class="item-field"><div class="if-label">Expiration</div><div class="if-val">${U.escapeHtml(card.expiration||'—')}</div></div>
        <div class="item-field"><div class="if-label">PIN</div>
          <div class="if-val" style="display:flex;align-items:center;gap:5px">
            <span id="pin-disp-${card.id}">&#9679;&#9679;&#9679;&#9679;</span>
            <button type="button" onclick="var el=document.getElementById('pin-disp-${card.id}');el.textContent=el.textContent==='${U.escapeHtml(card.pin||'????')}'?String.fromCharCode(9679).repeat(4):'${U.escapeHtml(card.pin||'????')}'" style="background:none;border:none;cursor:pointer;color:#9ca3af;padding:0">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z"/><circle cx="7" cy="7" r="1.5"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  },

  pbItemHTML(c,pb){
    return `<div class="item-card">
      <div class="item-card-hdr">
        <div class="item-card-hdr-l">${U.badge('Passbook','purple')}
          <span style="font-size:12px;font-weight:500;font-family:monospace">${U.escapeHtml(pb.passBookNo||'—')}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${U.locationBadge(pb.location||'In Vault')}
          <span class="al" onclick="CLIENTS.openEditPB('${c.id}','${pb.id}')">Edit</span>
          <span class="al" style="color:#dc2626" onclick="CLIENTS.delPB('${c.id}','${pb.id}')">Remove</span>
        </div>
      </div>
      <div class="item-card-body" style="grid-template-columns:repeat(4,1fr)">
        <div class="item-field"><div class="if-label">Slot</div><div class="if-val">${U.escapeHtml(pb.slot||'—')}</div></div>
        <div class="item-field"><div class="if-label">Storage Box</div><div class="if-val">${pb.box?U.boxBadge(pb.box):'—'}</div></div>
        <div class="item-field"><div class="if-label">Added On</div><div class="if-val">${U.fmtDate(pb.addedDate)}</div></div>
        <div class="item-field"><div class="if-label">Location</div><div class="if-val">${U.locationBadge(pb.location||'In Vault')}</div></div>
      </div>
    </div>`;
  },

  cardFormHTML(clientId,card){
    const s=DB.getSettings();
    return `<div class="g4">
      <div class="fg"><label>Bank Name</label><select id="cf-bank"><option value="">Select</option>${s.banks.map(b=>`<option ${card.bank===b?'selected':''}>${b}</option>`).join('')}</select></div>
      <div class="fg"><label>Card #</label><input id="cf-cardNo" value="${U.escapeHtml(card.cardNo||'')}"></div>
      <div class="fg"><label>Account #</label><input id="cf-accountNo" value="${U.escapeHtml(card.accountNo||'')}"></div>
      <div class="fg"><label>Expiration</label><input id="cf-expiration" type="month" value="${card.expiration||''}"></div>
      <div class="fg"><label>ATM PIN</label><input id="cf-pin" type="password" maxlength="4" value="${U.escapeHtml(card.pin||'')}"></div>
      <div class="fg"><label>Slot (e.g. EMV1)</label><input id="cf-slot" value="${U.escapeHtml(card.slot||'')}"></div>
      <div class="fg"><label>Storage Box</label><select id="cf-box"><option value="">Select</option>${s.tags.map(t=>`<option ${card.box===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="fg"><label>Flag</label><select id="cf-flag"><option>New</option><option ${card.flag==='Old'?'selected':''}>Old</option></select></div>
    </div>`;
  },

  pbFormHTML(clientId,pb){
    const s=DB.getSettings();
    return `<div class="g3">
      <div class="fg"><label>Passbook #</label><input id="pbf-no" value="${U.escapeHtml(pb.passBookNo||'')}"></div>
      <div class="fg"><label>Slot (e.g. EMV10)</label><input id="pbf-slot" value="${U.escapeHtml(pb.slot||'')}"></div>
      <div class="fg"><label>Storage Box</label><select id="pbf-box"><option value="">Select</option>${s.tags.map(t=>`<option ${pb.box===t?'selected':''}>${t}</option>`).join('')}</select></div>
    </div>`;
  },

  async saveCard(clientId){
    const data={bank:document.getElementById('cf-bank')?.value||'',cardNo:document.getElementById('cf-cardNo')?.value||'',accountNo:document.getElementById('cf-accountNo')?.value||'',expiration:document.getElementById('cf-expiration')?.value||'',pin:document.getElementById('cf-pin')?.value||'',slot:document.getElementById('cf-slot')?.value||'',box:document.getElementById('cf-box')?.value||'',flag:document.getElementById('cf-flag')?.value||'New',location:'In Vault'};
    APP.showLoader('Saving card...');
    await DB.addCard(clientId,data);
    APP.hideLoader(); U.toast('Card added');
    this.renderProfile(document.getElementById('content'),clientId);
  },

  async savePB(clientId){
    const data={passBookNo:document.getElementById('pbf-no')?.value||'',slot:document.getElementById('pbf-slot')?.value||'',box:document.getElementById('pbf-box')?.value||'',location:'In Vault'};
    APP.showLoader('Saving passbook...');
    await DB.addPassbook(clientId,data);
    APP.hideLoader(); U.toast('Passbook added');
    this.renderProfile(document.getElementById('content'),clientId);
  },

  async openEditCard(clientId,cardId){
    const c=DB.getClient(clientId); const card=(c.cards||[]).find(k=>k.id===cardId); if(!card) return;
    U.modal('Edit ATM Card',this.cardFormHTML(clientId,card),async()=>{
      APP.showLoader('Updating card...');
      await DB.updateCard(clientId,cardId,{bank:document.getElementById('cf-bank')?.value||card.bank,cardNo:document.getElementById('cf-cardNo')?.value||card.cardNo,accountNo:document.getElementById('cf-accountNo')?.value||card.accountNo,expiration:document.getElementById('cf-expiration')?.value||card.expiration,pin:document.getElementById('cf-pin')?.value||card.pin,slot:document.getElementById('cf-slot')?.value||card.slot,box:document.getElementById('cf-box')?.value||card.box,flag:document.getElementById('cf-flag')?.value||card.flag});
      APP.hideLoader(); U.closeModal(); U.toast('Card updated');
      this.renderProfile(document.getElementById('content'),clientId);
    });
  },

  async openEditPB(clientId,pbId){
    const c=DB.getClient(clientId); const pb=(c.passbooks||[]).find(p=>p.id===pbId); if(!pb) return;
    U.modal('Edit Passbook',this.pbFormHTML(clientId,pb),async()=>{
      APP.showLoader('Updating passbook...');
      await DB.updatePassbook(clientId,pbId,{passBookNo:document.getElementById('pbf-no')?.value||pb.passBookNo,slot:document.getElementById('pbf-slot')?.value||pb.slot,box:document.getElementById('pbf-box')?.value||pb.box});
      APP.hideLoader(); U.closeModal(); U.toast('Passbook updated');
      this.renderProfile(document.getElementById('content'),clientId);
    });
  },

  async delCard(clientId,cardId){ U.confirm('Remove this card?',async()=>{ APP.showLoader('Removing...'); await DB.deleteCard(clientId,cardId); APP.hideLoader(); U.toast('Card removed'); this.renderProfile(document.getElementById('content'),clientId); }); },
  async delPB(clientId,pbId){ U.confirm('Remove this passbook?',async()=>{ APP.showLoader('Removing...'); await DB.deletePassbook(clientId,pbId); APP.hideLoader(); U.toast('Passbook removed'); this.renderProfile(document.getElementById('content'),clientId); }); },

  async addNote(clientId){
    const inp=document.getElementById('note-inp'); const text=inp?.value?.trim();
    if(!text){U.toast('Please enter a note','error');return;}
    await DB.addNote(clientId,{text,author:AUTH.currentUser?.name||'Unknown',initials:AUTH.currentUser?.initials||'?'});
    inp.value=''; U.toast('Note added');
    this.renderProfile(document.getElementById('content'),clientId);
  },

  async openQuickEdit(clientId){
    const c=DB.getClient(clientId); if(!c){U.toast('Client not found','error');return;}
    const s=DB.getSettings();
    U.modal('Change Tag / Status',`
      <div style="margin-bottom:14px;padding:10px 12px;background:#f8f9fb;border-radius:6px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-family:monospace;font-size:11px;font-weight:500;color:#1d4ed8;background:#dbeafe;padding:2px 8px;border-radius:4px">${U.escapeHtml(c.clientId||'—')}</span>
          <span style="font-size:13px;font-weight:500">${U.escapeHtml(U.clientDisplayName(c))}</span>
        </div>
        <div style="font-size:11px;color:#6b7280">Current: ${c.contingencyStatus||'—'} &middot; Tag: ${c.tag||'None'}</div>
      </div>
      <div class="g2" style="margin-bottom:12px">
        <div class="fg"><label>Contingency Status</label><select id="qe-status">${['Active','Inactive','Deceased','Trouble Rogue','Blacklisted','Released'].map(st=>`<option value="${st}" ${c.contingencyStatus===st?'selected':''}>${st}</option>`).join('')}</select></div>
        <div class="fg"><label>Contingency Date</label><input id="qe-contdate" type="date" value="${c.contingencyDate||''}"></div>
      </div>
      <div class="fg" style="margin-bottom:12px">
        <label>Tag / Storage Box</label>
        <select id="qe-tag"><option value="">No tag</option>${s.tags.map(t=>`<option value="${t}" ${c.tag===t?'selected':''}>${t}</option>`).join('')}</select>
        <div class="hint">Changing the tag moves this client to a different storage box group</div>
      </div>
      <div class="g2">
        <div class="fg"><label>Problem Code</label><input id="qe-problem" value="${U.escapeHtml(c.problemCode||'')}"></div>
        <div class="fg"><label>Collection Status</label><input id="qe-collection" value="${U.escapeHtml(c.collectionStatus||'')}"></div>
      </div>
    `,async()=>{
      const updates={contingencyStatus:document.getElementById('qe-status')?.value,contingencyDate:document.getElementById('qe-contdate')?.value,tag:document.getElementById('qe-tag')?.value,problemCode:document.getElementById('qe-problem')?.value?.trim(),collectionStatus:document.getElementById('qe-collection')?.value?.trim()};
      APP.showLoader('Updating...');
      await DB.updateClient(clientId,updates);
      APP.hideLoader(); U.closeModal(); U.toast('Tag and status updated');
      const cur=APP.currentPage;
      if(cur==='clients') this.render(document.getElementById('content'));
      else if(cur==='client_profile') this.renderProfile(document.getElementById('content'),clientId);
    });
  },
};
