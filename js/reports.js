const REPORTS = {
  selected: 'tag',

  templates: [
    {id:'tag',title:'Report by Tag',color:'#1a56db',icon:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 2h5l7 7-5 5-7-7V2z"/><circle cx="5" cy="5" r="1" fill="currentColor" stroke="none"/></svg>',bg:'#dbeafe',desc:'All clients grouped by tag with card/passbook details.'},
    {id:'cycle',title:'Withdrawal Cycle Report',color:'#15803d',icon:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 2"/></svg>',bg:'#dcfce7',desc:'All withdrawals per cycle — amounts, audit counts, discrepancies.'},
    {id:'movement',title:'Movement Log Report',color:'#92400e',icon:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 8h10M8 3l5 5-5 5"/></svg>',bg:'#fef3c7',desc:'Full movement history filtered by date range, action, or staff.'},
    {id:'discrepancy',title:'Discrepancy Report',color:'#991b1b',icon:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v1"/></svg>',bg:'#fee2e2',desc:'All audit cycles with missing or extra items per box.'},
    {id:'interdept',title:'Inter-dept Report',color:'#5b21b6',icon:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 8h5M9 8h5M11 5l3 3-3 3M5 5L2 8l3 3"/></svg>',bg:'#ede9fe',desc:'All outgoing and incoming requests by dept, office, or date.'},
    {id:'clients',title:'Client Directory',color:'#0f6e56',icon:'<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6" cy="5" r="3"/><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>',bg:'#ccfbf1',desc:'Full client list with status, bank details, and item counts.'},
  ],

  render(el){
    const settings = DB.getSettings();
    el.innerHTML=`
      <div class="sec-label">Report Templates</div>
      <div class="report-grid">
        ${this.templates.map(t=>`
          <div class="report-card ${this.selected===t.id?'sel':''}" onclick="REPORTS.selected='${t.id}';REPORTS.render(document.getElementById('content'))"
            style="--rc-color:${t.color}">
            <style>.report-card[onclick*="${t.id}"]::before{background:${t.color}}</style>
            <div class="rc-icon" style="background:${t.bg};color:${t.color}">${t.icon}</div>
            <div class="rc-title">${t.title}</div>
            <div class="rc-desc">${t.desc}</div>
            <div class="rc-badges">${U.badge('PDF','red')} ${U.badge('Excel','green')}</div>
          </div>
        `).join('')}
      </div>
      <div id="report-filters"></div>
      <div id="report-preview"></div>
    `;
    this.renderFilters(settings);
    this.renderPreview();
  },

  renderFilters(settings){
    const el = document.getElementById('report-filters');
    const t = this.selected;
    let html = `<div class="card" style="margin-bottom:14px">
      <div class="card-hdr"><div class="card-hdr-l"><div class="card-dot" style="background:#475569"></div><span>Configure — ${this.templates.find(x=>x.id===t)?.title}</span></div></div>
      <div class="card-body">`;

    if(t==='tag'){
      html+=`<div class="g3"><div class="fg"><label>Date From</label><input id="rf-from" type="date"></div>
        <div class="fg"><label>Date To</label><input id="rf-to" type="date"></div>
        <div class="fg"><label>Office</label><input id="rf-office" list="rf-office-list" placeholder="All offices"><datalist id="rf-office-list"><option value="">All offices</option>${settings.branches.map(b=>`<option value="${b}">`).join('')}</datalist></div></div>
        <div class="fg" style="margin-top:12px"><label>Include Tags</label><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
          ${settings.tags.map(t=>`<span class="chip" onclick="this.classList.toggle('active');this.style.background=this.classList.contains('active')?'#dbeafe':'#f3f4f6';this.style.color=this.classList.contains('active')?'#1d4ed8':'#374151'" data-tag="${t}">${t}</span>`).join('')}
        </div></div>`;
    } else if(t==='cycle'){
      html+=`<div class="g3"><div class="fg"><label>Month</label><select id="rf-month"><option>All months</option><option>January</option><option>February</option><option>March</option><option>April</option><option>May</option><option>June</option><option>July</option><option>August</option><option>September</option><option>October</option><option>November</option><option>December</option></select></div>
        <div class="fg"><label>Cycle</label><select id="rf-cycle"><option value="">All cycles</option><option>7th & 8th</option><option>15th & 16th</option><option>29th & 30th</option></select></div>
        <div class="fg"><label>Box</label><select id="rf-box"><option value="">All boxes</option>${settings.tags.map(b=>`<option>${b}</option>`).join('')}</select></div></div>`;
    } else if(t==='movement'){
      const users = DB.getUsers();
      html+=`<div class="g4"><div class="fg"><label>Date From</label><input id="rf-from" type="date"></div>
        <div class="fg"><label>Date To</label><input id="rf-to" type="date"></div>
        <div class="fg"><label>Action</label><select id="rf-action"><option value="">All actions</option><option>Pull Out</option><option>Return</option><option>Receive</option><option>Inter-dept</option></select></div>
        <div class="fg"><label>Staff</label><select id="rf-staff"><option value="">All staff</option>${users.map(u=>`<option>${u.name}</option>`).join('')}</select></div></div>`;
    } else if(t==='discrepancy'){
      html+=`<div class="g3"><div class="fg"><label>Month</label><select id="rf-month"><option value="">All months</option><option>May</option><option>April</option><option>March</option></select></div>
        <div class="fg"><label>Box</label><select id="rf-box"><option value="">All boxes</option>${settings.tags.map(b=>`<option>${b}</option>`).join('')}</select></div>
        <div class="fg"><label>Status</label><select id="rf-status"><option value="">All</option><option>Unresolved</option><option>Resolved</option></select></div></div>`;
    } else if(t==='interdept'){
      html+=`<div class="g4"><div class="fg"><label>Date From</label><input id="rf-from" type="date"></div>
        <div class="fg"><label>Date To</label><input id="rf-to" type="date"></div>
        <div class="fg"><label>Department</label><select id="rf-dept"><option value="">All depts</option><option>Collection Dept</option><option>Audit Dept</option></select></div>
        <div class="fg"><label>Type</label><select id="rf-type"><option value="">All</option><option>Outgoing</option><option>Incoming</option></select></div></div>`;
    } else if(t==='clients'){
      html+=`<div class="g4"><div class="fg"><label>Office</label><input id="rf-office" list="rf-office-list" placeholder="All offices"><datalist id="rf-office-list"><option value="">All offices</option>${settings.branches.map(b=>`<option value="${b}">`).join('')}</datalist></div>
        <div class="fg"><label>Status</label><select id="rf-status"><option value="">All statuses</option><option>Active</option><option>Deceased</option><option>Blacklisted</option><option>Trouble Rogue</option></select></div>
        <div class="fg"><label>Pension Type</label><select id="rf-pension"><option value="">All types</option><option>SSS</option><option>GSIS</option></select></div>
        <div class="fg"><label>Has Passbook</label><select id="rf-pb"><option value="">All</option><option>Yes</option><option>No</option></select></div></div>`;
    }

    html+=`</div></div>`;
    el.innerHTML = html;
  },

  renderPreview(){
    const el = document.getElementById('report-preview');
    const t = this.selected;
    let cols=[], rows=[];

    if(t==='tag'){
      cols=['Client Name','Gender','Branch','Bank','Account #','Cards','Passbooks','Tag','Status','Pension','Amount'];
      rows = DB.getClients().slice(0,5).map(c=>[
        U.clientDisplayName(c),c.gender||'',c.office||'',c.bankName||'',c.bankAccountNo||'',
        (c.cards||[]).length,(c.passbooks||[]).length,c.tag||'',c.contingencyStatus||'',c.pensionType||'',c.pensionAmount||''
      ]);
    } else if(t==='movement'){
      cols=['Date/Time','Client','Slot','Type','Action','From','To','Box','Staff','Withdrawal'];
      rows = DB.getMovements().slice(0,5).map(m=>[
        U.fmtDateTime(m.createdAt),m.clientName||'',m.slot||'',m.itemType,m.action,
        m.fromLocation||'',m.toLocation||'',m.box||'',m.staff||'',m.withdrawalAmount||''
      ]);
    } else if(t==='clients'){
      cols=['Full Name','Gender','Birthdate','Office','Bank','Tag','Status','Pension Type','Amount'];
      rows = DB.getClients().slice(0,5).map(c=>[
        U.clientDisplayName(c),c.gender||'',c.birthdate||'',c.office||'',c.bankName||'',
        c.tag||'',c.contingencyStatus||'',c.pensionType||'',c.pensionAmount||''
      ]);
    } else if(t==='interdept'){
      cols=['Ref #','Type','Client','Item','Slot','Requested By','Dept','Date','Status'];
      rows = DB.getInterdept().slice(0,5).map(r=>[r.id,r.type,r.clientName||'',r.itemType,r.slot||'',r.requestedBy||'',r.dept||'',U.fmtDate(r.date),r.status||'']);
    } else {
      cols=['Report','Details','Status'];
      rows = [['No preview available for this report type','—','—']];
    }

    el.innerHTML=`
      <div class="card">
        <div class="card-hdr">
          <div class="card-hdr-l"><div class="card-dot" style="background:#475569"></div><span>Preview — first 5 rows</span></div>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn-pdf" onclick="REPORTS.exportPDF()">Export PDF</button>
            <button type="button" class="btn-xl" onclick="REPORTS.exportExcel()">Export Excel</button>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${U.escapeHtml(String(c))}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  getFullData(){
    const t = this.selected;
    if(t==='tag'||t==='clients'){
      return {
        cols:['Client Name','Gender','Birthdate','Address','Office','Bank','Account #','Cards','Passbooks','Tag','Status','Pension','Amount','Problem Code'],
        rows: DB.getClients().map(c=>[U.clientDisplayName(c),c.gender||'',c.birthdate||'',c.address||'',c.office||'',c.bankName||'',c.bankAccountNo||'',(c.cards||[]).length,(c.passbooks||[]).length,c.tag||'',c.contingencyStatus||'',c.pensionType||'',c.pensionAmount||'',c.problemCode||''])
      };
    } else if(t==='movement'){
      return {
        cols:['Date/Time','Client','Slot','Type','Action','From','To','Box','Staff','Requested By','Dept','Withdrawal','Remarks'],
        rows: DB.getMovements().map(m=>[U.fmtDateTime(m.createdAt),m.clientName||'',m.slot||'',m.itemType,m.action,m.fromLocation||'',m.toLocation||'',m.box||'',m.staff||'',m.requestedBy||'',m.dept||'',m.withdrawalAmount||'',m.remarks||''])
      };
    } else if(t==='interdept'){
      return {
        cols:['Ref #','Type','Client','Item','Slot','Requested By','Dept','Office','Date','Due Back','Status','Purpose','Remarks'],
        rows: DB.getInterdept().map(r=>[r.id,r.type,r.clientName||'',r.itemType,r.slot||'',r.requestedBy||'',r.dept||'',r.office||'',U.fmtDate(r.date),U.fmtDate(r.dueBack),r.status||'',r.purpose||'',r.remarks||''])
      };
    } else if(t==='cycle'){
      const audits = DB.getAudits();
      const rows = [];
      audits.forEach(a=>{
        Object.entries(a.boxes||{}).forEach(([box,data])=>{
          rows.push([a.cycle,a.month,a.year,box,data.expected||0,data.actual||0,(data.actual||0)-(data.expected||0),data.withdrawal||0,a.auditedBy||'']);
        });
      });
      return {cols:['Cycle','Month','Year','Box','Expected','Actual','Difference','Withdrawal','Audited By'],rows};
    } else {
      return {cols:['No data'],rows:[]};
    }
  },

  exportPDF(){
    const title = this.templates.find(t=>t.id===this.selected)?.title||'Report';
    const {cols,rows} = this.getFullData();
    U.exportPDF(title, cols, rows);
  },

  exportExcel(){
    const title = this.templates.find(t=>t.id===this.selected)?.title||'Report';
    const {cols,rows} = this.getFullData();
    U.exportExcel(title.replace(/\s/g,'_'), cols, rows);
  },
};
