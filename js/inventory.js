const INVENTORY = {
  selectedBox: '',
  searchTerm: '',
  filterType: '',
  filterLocation: '',

  async render(el){
    const settings = DB.getSettings();
    const boxCounts = DB.getBoxCounts();
    let items = DB.getAllItems();

    if(this.selectedBox) items = items.filter(i=>i.box===this.selectedBox);
    if(this.searchTerm){
      const s = this.searchTerm.toLowerCase();
      items = items.filter(i=>`${i.clientName} ${i.slot||''} ${i.cardNo||''} ${i.passBookNo||''} ${i.accountNo||''}`.toLowerCase().includes(s));
    }
    if(this.filterType) items = items.filter(i=>i.itemType===this.filterType);
    if(this.filterLocation) items = items.filter(i=>i.location===this.filterLocation);

    const total = DB.getAllItems().length;
    const inVault = DB.getAllItems().filter(i=>i.location==='In Vault').length;
    const pulledOut = DB.getAllItems().filter(i=>i.location==='Pulled Out').length;
    const withOther = DB.getAllItems().filter(i=>i.location==='With Other Dept').length;

    el.innerHTML = `
      <div class="stat-grid" style="margin-bottom:14px">
        <div class="stat-card"><div class="stat-label">Total Items</div><div class="stat-val">${total}</div><div class="stat-sub">Cards &amp; passbooks</div></div>
        <div class="stat-card"><div class="stat-label">In Vault</div><div class="stat-val" style="color:#15803d">${inVault}</div><div class="stat-sub">Secured</div></div>
        <div class="stat-card"><div class="stat-label">Pulled Out</div><div class="stat-val" style="color:#92400e">${pulledOut}</div><div class="stat-sub">Currently out</div></div>
        <div class="stat-card"><div class="stat-label">With Other Dept</div><div class="stat-val" style="color:#5b21b6">${withOther}</div><div class="stat-sub">Inter-dept transfers</div></div>
      </div>
      <div class="sec-label">Storage Boxes — click to filter</div>
      <div class="box-grid">
        ${settings.tags.map(tag=>`
          <div class="box-card ${this.selectedBox===tag?'sel':''}" onclick="INVENTORY.selectedBox=INVENTORY.selectedBox==='${tag}'?'':'${tag}';INVENTORY.render(document.getElementById('content'))">
            <div class="box-dot" style="background:${INVENTORY.boxColor(tag)}"></div>
            <div class="box-name">${tag}</div>
            <div class="box-count">${boxCounts[tag]||0}</div>
            <div class="box-sub">items in box</div>
          </div>
        `).join('')}
      </div>
      <div class="toolbar">
        <div class="toolbar-l">
          <input class="search" placeholder="Search client, slot, card #..." value="${U.escapeHtml(this.searchTerm)}"
            oninput="INVENTORY.searchTerm=this.value;INVENTORY.render(document.getElementById('content'))">
          <select class="fsel" onchange="INVENTORY.filterType=this.value;INVENTORY.render(document.getElementById('content'))">
            <option value="">All Types</option>
            <option value="ATM Card" ${this.filterType==='ATM Card'?'selected':''}>ATM Card</option>
            <option value="Passbook" ${this.filterType==='Passbook'?'selected':''}>Passbook</option>
          </select>
          <select class="fsel" onchange="INVENTORY.filterLocation=this.value;INVENTORY.render(document.getElementById('content'))">
            <option value="">All Locations</option>
            <option value="In Vault">In Vault</option>
            <option value="Pulled Out">Pulled Out</option>
            <option value="With Other Dept">With Other Dept</option>
            <option value="Released">Released</option>
          </select>
          ${this.selectedBox?`<span style="font-size:11px;color:#1a56db;cursor:pointer;font-weight:500" onclick="INVENTORY.selectedBox='';INVENTORY.render(document.getElementById('content'))">&#10005; Clear box filter</span>`:''}
        </div>
        <div class="toolbar-r">
          <button type="button" class="btn-ghost" onclick="INVENTORY.exportInventory()">Export Excel</button>
        </div>
      </div>
      <div class="tbl-wrap">
        ${items.length===0?`<div class="empty"><div class="empty-title">No items found</div><div class="empty-sub">Add cards or passbooks from a client profile</div></div>`:
        `<table><thead><tr>
          <th>Slot</th><th>Type</th><th>Client</th><th>Card / PB #</th>
          <th>Bank</th><th>Box</th><th>Location</th><th>Flag</th><th>Action</th>
        </tr></thead><tbody>
        ${items.map(i=>`<tr>
          <td style="font-family:monospace;font-weight:500">${U.escapeHtml(i.slot||'—')}</td>
          <td>${U.itemTypeBadge(i.itemType)}</td>
          <td style="cursor:pointer;color:#1a56db" onclick="APP.navigate('client_profile',{id:'${i.clientId}'})">${U.escapeHtml(i.clientName||'—')}</td>
          <td style="font-family:monospace">${U.escapeHtml(i.cardNo||i.passBookNo||'—')}</td>
          <td>${U.escapeHtml(i.bank||'—')}</td>
          <td>${i.box?U.boxBadge(i.box):'—'}</td>
          <td>${U.locationBadge(i.location||'In Vault')}</td>
          <td>${i.flag?U.badge(i.flag,'slate'):'—'}</td>
          <td><span class="al" onclick="APP.navigate('client_profile',{id:'${i.clientId}'})">View Client</span></td>
        </tr>`).join('')}
        </tbody></table>`}
      </div>
      <div style="margin-top:10px;font-size:11px;color:#9ca3af">Showing ${items.length} items${this.selectedBox?' in '+this.selectedBox:''}</div>
    `;
  },

  boxColor(tag){
    const m={'Deceased 1st':'#991b1b','Deceased 16th':'#991b1b','Blacklisted':'#475569','Trouble Rogue':'#92400e','TR3':'#92400e','GSIS':'#1d4ed8','Unahan':'#5b21b6','Error':'#dc2626','New/Old':'#15803d','Inactive':'#475569'};
    return m[tag]||'#9ca3af';
  },

  async exportInventory(){
    const items = DB.getAllItems();
    U.exportExcel('Inventory_Directory',
      ['Slot','Type','Client','Card/PB #','Bank','Box','Location','Flag'],
      items.map(i=>[i.slot||'',i.itemType,i.clientName||'',i.cardNo||i.passBookNo||'',i.bank||'',i.box||'',i.location||'',i.flag||''])
    );
  },
};
