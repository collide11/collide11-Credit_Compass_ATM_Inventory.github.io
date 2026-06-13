const INTERDEPT = {
  view: 'list',
  filterType: '',
  filterStatus: '',

  async render(el){
    if(this.view==='form') this.renderForm(el);
    else this.renderList(el);
  },

  async renderList(el){
    const settings = DB.getSettings();
    let reqs = DB.getInterdept();
    if(this.filterType) reqs = reqs.filter(r=>r.type===this.filterType);
    if(this.filterStatus) reqs = reqs.filter(r=>r.status===this.filterStatus);

    el.innerHTML=`
      <div class="toolbar">
        <div class="toolbar-l">
          <select class="fsel" onchange="INTERDEPT.filterType=this.value;INTERDEPT.render(document.getElementById('content'))">
            <option value="">All Types</option>
            <option value="Outgoing" ${this.filterType==='Outgoing'?'selected':''}>Outgoing (we release)</option>
            <option value="Incoming" ${this.filterType==='Incoming'?'selected':''}>Incoming (we receive)</option>
          </select>
          <select class="fsel" onchange="INTERDEPT.filterStatus=this.value;INTERDEPT.render(document.getElementById('content'))">
            <option value="">All Statuses</option>
            <option>Pending</option><option>Released</option><option>Returned</option><option>Overdue</option>
          </select>
        </div>
        <div class="toolbar-r">
          <button type="button" class="btn-ghost" onclick="INTERDEPT.exportExcel()">Export Excel</button>
          <button type="button" class="btn-primary" onclick="INTERDEPT.view='form';INTERDEPT.render(document.getElementById('content'))">+ New Request</button>
        </div>
      </div>
      <div class="tbl-wrap">
        ${reqs.length===0?`<div class="empty"><div class="empty-title">No inter-dept requests yet</div></div>`:
        `<div style="overflow-x:auto"><table><thead><tr>
          <th>Ref #</th><th>Type</th><th>Client</th><th>Item</th><th>Slot</th>
          <th>Requested By</th><th>Dept</th><th>Office</th><th>Date</th><th>Due Back</th><th>Status</th><th>Action</th>
        </tr></thead><tbody>
        ${reqs.map(r=>`<tr>
          <td style="font-weight:500;font-family:monospace">${U.escapeHtml(r.id)}</td>
          <td>${r.type==='Outgoing'?U.badge('Outgoing','purple'):U.badge('Incoming','blue')}</td>
          <td>${U.escapeHtml(r.clientName||'—')}</td>
          <td>${U.itemTypeBadge(r.itemType)}</td>
          <td style="font-family:monospace">${U.escapeHtml(r.slot||'—')}</td>
          <td>${U.escapeHtml(r.requestedBy||'—')}</td>
          <td>${U.escapeHtml(r.dept||'—')}</td>
          <td>${U.escapeHtml(r.office||'—')}</td>
          <td>${U.fmtDate(r.date)}</td>
          <td>${U.fmtDate(r.dueBack)||'—'}</td>
          <td>${U.statusBadge(r.status||'Pending')}</td>
          <td>
            <span class="al" onclick="INTERDEPT.async updateStatus('${r.id}','Returned')">Mark Returned</span>
            &nbsp;<span class="al" style="color:#dc2626" onclick="INTERDEPT.async deleteReq('${r.id}')">Del</span>
          </td>
        </tr>`).join('')}
        </tbody></table></div>`}
      </div>
    `;
  },

  renderForm(el){
    const clients = DB.getClients();
    const settings = DB.getSettings();
    const users = DB.getUsers();

    el.innerHTML=`
      <div style="margin-bottom:14px">
        <button type="button" class="btn-ghost btn-sm" onclick="INTERDEPT.view='list';INTERDEPT.render(document.getElementById('content'))">&#8592; Back to Requests</button>
      </div>
      <div class="form-page">
        <!-- TYPE -->
        <div class="form-sec">
          <div class="form-sec-hdr"><div class="card-dot" style="background:#1a56db"></div><span>Step 1 — Request Type</span></div>
          <div class="form-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div id="rt-out" onclick="INTERDEPT.selType('out')" style="border:0.5px solid #fde68a;background:#fffbeb;border-radius:8px;padding:14px;cursor:pointer;display:flex;gap:10px">
                <div style="width:32px;height:32px;background:#fef3c7;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#92400e" stroke-width="1.5" stroke-linecap="round"><path d="M3 8h10M10 5l3 3-3 3"/></svg>
                </div>
                <div><div style="font-size:12px;font-weight:500;margin-bottom:3px">Outgoing — We release to other dept</div>
                <div style="font-size:11px;color:#6b7280">Another department is requesting a card/passbook from our vault.</div></div>
              </div>
              <div id="rt-in" onclick="INTERDEPT.selType('in')" style="border:0.5px solid #e5e7eb;background:#fff;border-radius:8px;padding:14px;cursor:pointer;display:flex;gap:10px">
                <div style="width:32px;height:32px;background:#dbeafe;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#1d4ed8" stroke-width="1.5" stroke-linecap="round"><path d="M13 8H3M6 5L3 8l3 3"/></svg>
                </div>
                <div><div style="font-size:12px;font-weight:500;margin-bottom:3px">Incoming — We receive from other dept</div>
                <div style="font-size:11px;color:#6b7280">Another department is returning or transferring to our vault.</div></div>
              </div>
            </div>
            <input type="hidden" id="id-type" value="Outgoing">
          </div>
        </div>

        <!-- REQUESTER -->
        <div class="form-sec">
          <div class="form-sec-hdr"><div class="card-dot" style="background:#0f6e56"></div><span>Step 2 — Requester / Sender Information</span></div>
          <div class="form-body">
            <div class="g4">
              <div class="fg"><label>Full Name <span class="req">*</span></label><input id="id-reqby" placeholder="Name of requester"></div>
              <div class="fg"><label>Department <span class="req">*</span></label>
                <select id="id-dept"><option value="">Select</option><option>Collection Dept</option><option>Audit Dept</option><option>Other</option></select>
              </div>
              <div class="fg"><label>Office / Branch <span class="req">*</span></label>
                <input id="id-office" list="id-office-list" placeholder="Type office or branch name...">
              <datalist id="id-office-list">${settings.branches.map(b=>`<option value="${b}">`).join('')}</datalist>
              </div>
              <div class="fg"><label>Request Date <span class="req">*</span></label><input id="id-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
            <div class="g3">
              <div class="fg"><label>Expected Return Date</label><input id="id-dueback" type="date"><div class="hint">Leave blank if no return expected</div></div>
              <div class="fg"><label>P&amp;R Staff Handling <span class="req">*</span></label>
                <select id="id-staff"><option value="">Select staff</option>${users.map(u=>`<option>${u.name}</option>`).join('')}</select>
              </div>
              <div class="fg"><label>Purpose / Reason <span class="req">*</span></label><input id="id-purpose" placeholder="e.g. For audit review"></div>
            </div>
          </div>
        </div>

        <!-- ITEMS -->
        <div class="form-sec">
          <div class="form-sec-hdr">
            <div class="card-dot" style="background:#854f0b"></div>
            <span>Step 3 — Select Items</span>
            <span style="margin-left:auto;font-size:11px;color:#9ca3af" id="sel-count">0 items selected</span>
          </div>
          <div class="form-body">
            <input class="search" id="item-search" placeholder="Search by client name, slot, card #..." oninput="INTERDEPT.filterItems(this.value)" style="margin-bottom:10px;width:100%">
            <div style="border:0.5px solid #e5e7eb;border-radius:6px;overflow:hidden;max-height:240px;overflow-y:auto" id="item-results">
              ${DB.getAllItems().map(i=>`
                <div class="id-item-row" data-id="${i.id}" data-cid="${i.clientId}" data-slot="${U.escapeHtml(i.slot||'')}" data-type="${i.itemType}" onclick="INTERDEPT.toggleItem(this)"
                  style="padding:9px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:0.5px solid #f3f4f6;cursor:pointer">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="id-chk" style="width:16px;height:16px;border-radius:4px;border:0.5px solid #d1d5db;flex-shrink:0"></div>
                    <span style="font-family:monospace;font-size:11px;font-weight:500">${U.escapeHtml(i.slot||'—')}</span>
                    <span style="font-size:11px;color:#6b7280">${U.escapeHtml(i.clientName||'—')} — ${i.itemType} ${U.escapeHtml(i.cardNo||i.passBookNo||'')}</span>
                  </div>
                  <div style="display:flex;gap:6px">
                    ${U.locationBadge(i.location||'In Vault')}
                    ${i.box?U.boxBadge(i.box):''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- REMARKS -->
        <div class="form-sec">
          <div class="form-sec-hdr"><div class="card-dot" style="background:#7f77dd"></div><span>Step 4 — Remarks</span></div>
          <div class="form-body">
            <div class="fg"><label>Remarks / Notes</label><textarea id="id-remarks" placeholder="Any additional instructions or conditions..."></textarea></div>
          </div>
        </div>

        <div class="form-footer">
          <div class="form-footer-note">This request will be logged in the Movement Log and each client's profile.</div>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn-ghost" onclick="INTERDEPT.view='list';INTERDEPT.render(document.getElementById('content'))">Cancel</button>
            <button type="button" class="btn-primary" onclick="INTERDEPT.saveRequest()">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 7l4 4 6-6"/></svg>
              Save Request
            </button>
          </div>
        </div>
      </div>
    `;
  },

  selType(t){
    document.getElementById('id-type').value = t==='out'?'Outgoing':'Incoming';
    const out = document.getElementById('rt-out');
    const inc = document.getElementById('rt-in');
    if(t==='out'){
      out.style.cssText='border:0.5px solid #fde68a;background:#fffbeb;border-radius:8px;padding:14px;cursor:pointer;display:flex;gap:10px';
      inc.style.cssText='border:0.5px solid #e5e7eb;background:#fff;border-radius:8px;padding:14px;cursor:pointer;display:flex;gap:10px';
    } else {
      inc.style.cssText='border:0.5px solid #93c5fd;background:#eff6ff;border-radius:8px;padding:14px;cursor:pointer;display:flex;gap:10px';
      out.style.cssText='border:0.5px solid #e5e7eb;background:#fff;border-radius:8px;padding:14px;cursor:pointer;display:flex;gap:10px';
    }
  },

  selectedItems: new Set(),

  toggleItem(row){
    const id = row.dataset.id;
    const chk = row.querySelector('.id-chk');
    if(this.selectedItems.has(id)){
      this.selectedItems.delete(id);
      chk.style.cssText='width:16px;height:16px;border-radius:4px;border:0.5px solid #d1d5db;flex-shrink:0';
      row.style.background='';
    } else {
      this.selectedItems.add(id);
      chk.style.cssText='width:16px;height:16px;border-radius:4px;background:#1a56db;border-color:#1a56db;flex-shrink:0';
      row.style.background='#eff6ff';
    }
    const cnt = document.getElementById('sel-count');
    if(cnt) cnt.textContent=`${this.selectedItems.size} item${this.selectedItems.size!==1?'s':''} selected`;
  },

  filterItems(val){
    const rows = document.querySelectorAll('.id-item-row');
    rows.forEach(r=>{
      r.style.display = r.textContent.toLowerCase().includes(val.toLowerCase())?'':'none';
    });
  },

  async saveRequest(){
    const g=id=>document.getElementById(id)?.value?.trim()||'';
    const type = g('id-type');
    const reqBy = g('id-reqby');
    const dept = g('id-dept');
    const office = g('id-office');
    const date = g('id-date');
    const staff = g('id-staff');
    const purpose = g('id-purpose');

    if(!reqBy||!dept||!office||!date||!staff||!purpose){U.toast('Please fill all required fields','error');return;}
    if(this.selectedItems.size===0){U.toast('Please select at least one item','error');return;}

    const allItems = DB.getAllItems();
    for(const itemId of this.selectedItems){
      const item = allItems.find(i=>i.id===itemId);
      if(!item) continue;
      await DB.addInterdept({
        type, clientId:item.clientId, clientName:item.clientName,
        itemType:item.itemType, slot:item.slot, box:item.box,
        requestedBy:reqBy, dept, office, date,
        dueBack:g('id-dueback'), staff, purpose,
        remarks:g('id-remarks'), status:'Pending',
      });
    }

    this.selectedItems.clear();
    U.toast('Request saved');
    this.view='list';
    this.render(document.getElementById('content'));
  },

  async updateStatus(id, status){
    await DB.updateInterdept(id,{status});
    U.toast('Status updated');
    this.render(document.getElementById('content'));
  },

  async deleteReq(id){
    U.confirm('Delete this request?',async ()=>{
      const reqs = DB.getInterdept().filter(r=>r.id!==id);
      await DB.saveInterdept(reqs);
      U.toast('Request deleted');
      this.render(document.getElementById('content'));
    });
  },

  exportExcel(){
    const reqs = DB.getInterdept();
    U.exportExcel('Interdept_Requests',
      ['Ref #','Type','Client','Item','Slot','Requested By','Dept','Office','Date','Due Back','Status','Purpose'],
      reqs.map(r=>[r.id,r.type,r.clientName||'',r.itemType,r.slot||'',r.requestedBy||'',r.dept||'',r.office||'',U.fmtDate(r.date),U.fmtDate(r.dueBack),r.status,r.purpose||''])
    );
  },
};
