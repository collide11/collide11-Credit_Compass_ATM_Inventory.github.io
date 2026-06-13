// ── UTILS ── shared helpers

const U = {
  badge(text, variant){
    const map = {
      green:'badge-green',yellow:'badge-yellow',red:'badge-red',
      blue:'badge-blue',slate:'badge-slate',purple:'badge-purple',orange:'badge-orange',
    };
    return `<span class="badge ${map[variant]||'badge-slate'}">${text}</span>`;
  },

  locationBadge(loc){
    const m={'In Vault':'green','Pulled Out':'yellow','With Other Dept':'purple','Released':'blue','Under Remediation':'orange'};
    return this.badge(loc, m[loc]||'slate');
  },

  actionBadge(a){
    const m={'Pull Out':'yellow','Return':'green','Receive':'blue','Inter-dept':'purple'};
    return this.badge(a, m[a]||'slate');
  },

  statusBadge(s){
    const m={'Active':'green','Inactive':'slate','Deceased':'red','Trouble Rogue':'yellow','Blacklisted':'red','Released':'blue','Overdue':'red','Returned':'green','Pending':'yellow','In Progress':'blue'};
    return this.badge(s, m[s]||'slate');
  },

  itemTypeBadge(t){
    return t==='ATM Card' ? this.badge('ATM Card','blue') : this.badge('Passbook','purple');
  },

  boxBadge(box){
    const m={'Deceased 1st':'red','Deceased 16th':'red','Blacklisted':'slate','Trouble Rogue':'yellow','TR3':'yellow','GSIS':'blue','Unahan':'purple','Error':'red','New/Old':'green','Inactive':'slate'};
    return this.badge(box, m[box]||'slate');
  },

  fmtDate(d){ if(!d) return '—'; try{ return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }catch(e){return d;} },
  fmtDateTime(d){ if(!d) return '—'; try{ return new Date(d).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){return d;} },
  fmtMoney(n){ return '₱'+Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2}); },

  calcAge(birthdate){
    if(!birthdate) return '';
    const bd = new Date(birthdate); const today = new Date();
    let age = today.getFullYear()-bd.getFullYear();
    if(today.getMonth()<bd.getMonth()||(today.getMonth()===bd.getMonth()&&today.getDate()<bd.getDate())) age--;
    return age;
  },

  initials(name){
    if(!name) return '?';
    return name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
  },

  clientDisplayName(c){ return c ? `${c.lastName}, ${c.firstName} ${c.middleName||''}`.trim() : ''; },

  cycleDays: [7,8,15,16,29,30],
  cycleNames: {7:'7th & 8th',8:'7th & 8th',15:'15th & 16th',16:'15th & 16th',29:'29th & 30th',30:'29th & 30th'},

  detectCycle(dateStr){
    if(!dateStr) return null;
    const d = new Date(dateStr).getDate();
    return this.cycleNames[d] || null;
  },

  toast(msg, type='success'){
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:500;color:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.15);transition:opacity 0.3s;background:${type==='success'?'#15803d':type==='error'?'#dc2626':'#1a56db'}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),300); },2500);
  },

  confirm(msg, cb){
    if(window.confirm(msg)) cb();
  },

  modal(title, bodyHTML, onSave){
    const existing = document.getElementById('global-modal');
    if(existing) existing.remove();
    const m = document.createElement('div');
    m.id = 'global-modal';
    m.className = 'modal-overlay';

    const inner = document.createElement('div');
    inner.className = 'modal';
    inner.innerHTML = `
      <div class="modal-title">${title}</div>
      <div id="modal-body">${bodyHTML}</div>
      <div class="modal-footer">
        <button type="button" class="btn-ghost" id="modal-cancel-btn">Cancel</button>
        <button type="button" class="btn-primary" id="modal-save-btn">Save</button>
      </div>`;

    m.appendChild(inner);
    document.body.appendChild(m);

    // Cancel closes modal
    document.getElementById('modal-cancel-btn').addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation(); m.remove();
    });
    // Save triggers callback
    document.getElementById('modal-save-btn').addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation(); onSave();
    });
    // Click outside modal (on overlay) to close
    m.addEventListener('click', (e)=>{ if(e.target===m){ e.preventDefault(); m.remove(); } });
    // Prevent Enter from bubbling out of modal inputs
    inner.addEventListener('keydown', (e)=>{
      e.stopPropagation();
      if(e.key==='Enter' && e.target.tagName!=='TEXTAREA'){ e.preventDefault(); }
    });
    // ESC to close
    const escHandler = (e)=>{ if(e.key==='Escape'){ m.remove(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
  },

  closeModal(){ const m=document.getElementById('global-modal'); if(m) m.remove(); },

  escapeHtml(str){
    if(!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  exportPDF(title, columns, rows){
    try{
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation:'landscape' });
      doc.setFontSize(14); doc.text(title, 14, 16);
      doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.autoTable({ head:[columns], body:rows, startY:28, styles:{fontSize:8}, headStyles:{fillColor:[26,86,219]} });
      doc.save(title.replace(/\s+/g,'_')+'.pdf');
      this.toast('PDF exported');
    }catch(e){ this.toast('PDF export failed: '+e.message,'error'); }
  },

  exportExcel(title, columns, rows){
    try{
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([columns,...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, title.replace(/\s+/g,'_')+'.xlsx');
      this.toast('Excel exported');
    }catch(e){ this.toast('Excel export failed: '+e.message,'error'); }
  },
};
