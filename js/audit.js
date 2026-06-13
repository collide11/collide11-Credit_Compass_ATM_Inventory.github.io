const AUDIT = {
  activeCycle: '7th & 8th',
  cycles: ['7th & 8th','15th & 16th','29th & 30th'],
  cycleLabels: {'7th & 8th':'7-8','15th & 16th':'15-16','29th & 30th':'29-30'},

  async render(el){
    const today = new Date();
    const month = today.toLocaleString('default',{month:'long'});
    const year = today.getFullYear();
    const settings = DB.getSettings();
    const boxCounts = DB.getBoxCounts();
    const audits = DB.getAudits();

    el.innerHTML=`
      <div class="tabs">
        ${this.cycles.map(c=>`
          <div class="tab ${this.activeCycle===c?'active':''}" onclick="AUDIT.activeCycle='${c}';AUDIT.render(document.getElementById('content'))">
            ${c} Cycle
            <span class="tab-sub">${month} ${this.cycleLabels[c]}, ${year}</span>
          </div>
        `).join('')}
      </div>
      <div id="audit-cycle-content"></div>
    `;

    this.renderCycle(document.getElementById('audit-cycle-content'), this.activeCycle, settings, boxCounts, audits, month, year);
  },

  renderCycle(el, cycleName, settings, boxCounts, audits, month, year){
    // Find existing audit for this cycle/month
    const existing = audits.find(a=>a.cycle===cycleName && a.month===month && a.year===String(year));
    const isCompleted = !!existing;

    // Calculate summary
    const totalExpected = Object.values(boxCounts).reduce((a,b)=>a+b,0);
    const totalActual = existing ? Object.values(existing.boxes||{}).reduce((a,b)=>a+Number(b.actual||0),0) : null;
    const discrepancies = existing ? Object.entries(existing.boxes||{}).filter(([k,v])=>Number(v.actual||0)!==Number(v.expected||0)).length : 0;

    el.innerHTML=`
      ${isCompleted ? `
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:14px">
          <div class="stat-card"><div class="stat-label">Expected</div><div class="stat-val">${totalExpected}</div><div class="stat-sub">System count</div></div>
          <div class="stat-card"><div class="stat-label">Actual Count</div><div class="stat-val" style="color:${totalActual===totalExpected?'#15803d':'#991b1b'}">${totalActual}</div><div class="stat-sub">Physical count</div></div>
          <div class="stat-card"><div class="stat-label">Discrepancies</div><div class="stat-val" style="color:${discrepancies===0?'#15803d':'#991b1b'}">${discrepancies}</div><div class="stat-sub">Boxes with issues</div></div>
          <div class="stat-card"><div class="stat-label">Total Withdrawal</div><div class="stat-val" style="font-size:16px">${U.fmtMoney(existing.totalWithdrawal||0)}</div><div class="stat-sub">This cycle</div></div>
          <div class="stat-card"><div class="stat-label">Audited By</div><div class="stat-val" style="font-size:14px">${U.escapeHtml(existing.auditedBy||'—')}</div><div class="stat-sub">${U.fmtDate(existing.createdAt)}</div></div>
        </div>
        <div class="audit-banner ${discrepancies===0?'audit-ok':'audit-miss'}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/>${discrepancies===0?'<path d="M5 8l2 2 4-4"/>':'<path d="M8 5v4M8 11v1"/>'}</svg>
          <div>
            <div style="font-weight:500">${discrepancies===0?`Accurate count — all ${totalExpected} items accounted for`:`${discrepancies} box(es) with discrepancies — ${totalExpected-totalActual} item(s) unaccounted`}</div>
            <div style="font-size:11px;margin-top:2px">Audited by ${U.escapeHtml(existing.auditedBy||'—')} · ${U.fmtDateTime(existing.createdAt)}</div>
          </div>
        </div>
      ` : `
        <div class="audit-banner audit-pend">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 2"/></svg>
          <div>
            <div style="font-weight:500">Audit not yet completed for this cycle</div>
            <div style="font-size:11px;margin-top:2px">Enter actual counts per box below and save to complete the audit.</div>
          </div>
        </div>
      `}

      <div class="tbl-wrap">
        <div class="card-hdr" style="padding:10px 14px;border-bottom:0.5px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between">
          <div class="card-hdr-l"><div class="card-dot" style="background:#1a56db"></div>
            <span>${isCompleted?'Per-box results':'Enter actual counts'} — ${cycleName} cycle</span>
          </div>
          ${!isCompleted?`
            <div style="display:flex;gap:8px;align-items:center">
              <div class="fg" style="margin:0"><input id="audit-by" placeholder="Audited by (name)" style="padding:6px 10px;border:0.5px solid #d1d5db;border-radius:5px;font-size:12px;width:180px"></div>
              <div class="fg" style="margin:0"><input id="audit-wd" type="number" placeholder="Total withdrawal ₱" style="padding:6px 10px;border:0.5px solid #d1d5db;border-radius:5px;font-size:12px;width:160px"></div>
              <button type="button" class="btn-primary btn-sm" onclick="AUDIT.async saveAudit('${cycleName}','${month}','${year}')">Save Audit</button>
            </div>
          `:
          `<div style="display:flex;gap:8px">
            <button type="button" class="btn-pdf btn-sm" onclick="AUDIT.exportPDF('${cycleName}')">Export PDF</button>
            <button type="button" class="btn-xl btn-sm" onclick="AUDIT.exportExcel('${cycleName}')">Export Excel</button>
          </div>`}
        </div>
        <div style="overflow-x:auto"><table><thead><tr>
          <th>Box</th><th>Expected</th>
          ${isCompleted?'<th>Actual</th><th>Difference</th><th>Status</th>':'<th>Actual Count (enter here)</th><th>Difference</th><th>Status</th>'}
          <th>Withdrawal (₱)</th>
        </tr></thead><tbody>
        ${settings.tags.map((tag,i)=>{
          const exp = boxCounts[tag]||0;
          const boxData = existing?.boxes?.[tag]||{};
          const act = isCompleted ? Number(boxData.actual||0) : null;
          const diff = act!==null ? act-exp : null;
          const wd = boxData.withdrawal||'';
          return `<tr ${diff!==null&&diff!==0?'style="background:#fff5f5"':''}>
            <td style="font-weight:500">${tag}</td>
            <td>${exp}</td>
            ${isCompleted?
              `<td style="font-weight:500;color:${diff===0?'#15803d':'#991b1b'}">${act}</td>
               <td class="${diff===0?'diff-zero':diff<0?'diff-miss':'diff-ok'}">${diff===0?'0':diff>0?'+'+diff:diff}</td>
               <td>${diff===0?U.badge('Matched','green'):diff<0?U.badge('Missing '+Math.abs(diff),'red'):U.badge('Extra +'+diff,'yellow')}</td>`:
              `<td><input class="count-input" id="ac-${i}" type="number" min="0" placeholder="0"
                  oninput="AUDIT.calcDiff('ac-${i}',${exp},'diff-${i}','stat-${i}')"></td>
               <td id="diff-${i}" class="diff-zero">—</td>
               <td id="stat-${i}">—</td>`}
            <td>${isCompleted?U.fmtMoney(wd):
              `<input type="number" id="wd-${i}" placeholder="0.00" min="0" step="0.01" style="width:100px;padding:5px 8px;border:0.5px solid #d1d5db;border-radius:5px;font-size:12px">`}
            </td>
          </tr>`;
        }).join('')}
        </tbody></table></div>
      </div>

      ${isCompleted && discrepancies>0?`
        <div class="sec-label" style="margin-top:14px">Discrepancy Details</div>
        <div class="tbl-wrap">
          ${Object.entries(existing.boxes||{}).filter(([k,v])=>Number(v.actual||0)!==Number(v.expected||0)).map(([box,data])=>`
            <div style="padding:12px 14px;border-bottom:0.5px solid #f3f4f6;display:flex;align-items:flex-start;justify-content:space-between">
              <div>
                <div style="font-size:12px;font-weight:500;color:#991b1b">${box} — ${Math.abs(Number(data.actual)-Number(data.expected))} item(s) ${Number(data.actual)<Number(data.expected)?'missing':'extra'}</div>
                <div style="font-size:11px;color:#6b7280;margin-top:3px">Expected ${data.expected}, found ${data.actual}</div>
              </div>
              ${U.badge('Unresolved','red')}
            </div>
          `).join('')}
        </div>
      `:''}
    `;
  },

  calcDiff(inputId, expected, diffId, statId){
    const v = parseInt(document.getElementById(inputId)?.value)||0;
    const inp = document.getElementById(inputId);
    const diffEl = document.getElementById(diffId);
    const statEl = document.getElementById(statId);
    if(!inp||!diffEl||!statEl) return;
    if(v===0){ diffEl.textContent='—'; diffEl.className='diff-zero'; statEl.innerHTML='—'; inp.className='count-input'; return; }
    const diff = v-expected;
    if(diff===0){
      diffEl.textContent='0'; diffEl.className='diff-zero';
      statEl.innerHTML=U.badge('Matched','green');
      inp.className='count-input exact';
    } else if(diff<0){
      diffEl.textContent=diff; diffEl.className='diff-miss';
      statEl.innerHTML=U.badge('Missing '+Math.abs(diff),'red');
      inp.className='count-input miss';
    } else {
      diffEl.textContent='+'+diff; diffEl.className='diff-ok';
      statEl.innerHTML=U.badge('Extra +'+diff,'yellow');
      inp.className='count-input exact';
    }
  },

  async saveAudit(cycleName, month, year){
    const settings = DB.getSettings();
    const boxCounts = DB.getBoxCounts();
    const auditedBy = document.getElementById('audit-by')?.value?.trim();
    const totalWithdrawal = document.getElementById('audit-wd')?.value||0;
    if(!auditedBy){ U.toast('Please enter the name of the staff who audited','error'); return; }

    const boxes = {};
    settings.tags.forEach((tag,i)=>{
      const actual = document.getElementById(`ac-${i}`)?.value||'0';
      const wd = document.getElementById(`wd-${i}`)?.value||'0';
      boxes[tag] = { expected: boxCounts[tag]||0, actual: Number(actual), withdrawal: Number(wd) };
    });

    await await DB.addAudit({ cycle:cycleName, month, year:String(year), boxes, auditedBy, totalWithdrawal:Number(totalWithdrawal) });
    U.toast('Audit saved');
    this.render(document.getElementById('content'));
  },

  exportPDF(cycleName){
    const settings = DB.getSettings();
    const boxCounts = DB.getBoxCounts();
    const audits = DB.getAudits();
    const today = new Date();
    const month = today.toLocaleString('default',{month:'long'});
    const year = today.getFullYear();
    const existing = audits.find(a=>a.cycle===cycleName&&a.month===month&&a.year===String(year));
    if(!existing){ U.toast('No audit data to export','error'); return; }
    const rows = settings.tags.map(tag=>{
      const d = existing.boxes?.[tag]||{};
      return [tag, d.expected||0, d.actual||0, (d.actual||0)-(d.expected||0), (d.actual||0)===(d.expected||0)?'Matched':'Discrepancy', U.fmtMoney(d.withdrawal||0)];
    });
    U.exportPDF(`Audit_${cycleName.replace(/\s/g,'_')}`,['Box','Expected','Actual','Difference','Status','Withdrawal'],rows);
  },

  exportExcel(cycleName){
    const settings = DB.getSettings();
    const audits = DB.getAudits();
    const today = new Date();
    const month = today.toLocaleString('default',{month:'long'});
    const year = today.getFullYear();
    const existing = audits.find(a=>a.cycle===cycleName&&a.month===month&&a.year===String(year));
    if(!existing){ U.toast('No audit data to export','error'); return; }
    const rows = settings.tags.map(tag=>{
      const d = existing.boxes?.[tag]||{};
      return [tag, d.expected||0, d.actual||0, (d.actual||0)-(d.expected||0), (d.actual||0)===(d.expected||0)?'Matched':'Discrepancy', d.withdrawal||0];
    });
    U.exportExcel(`Audit_${cycleName.replace(/\s/g,'_')}`,['Box','Expected','Actual','Difference','Status','Withdrawal'],rows);
  },
};
