const DASHBOARD = {
  async render(el){
    const clients = DB.getClients();
    const items = DB.getAllItems();
    const inVault = items.filter(i=>i.location==='In Vault').length;
    const pulledOut = items.filter(i=>i.location==='Pulled Out').length;
    const movements = DB.getMovements().slice(0,8);
    const isWD = AUTH.isWithdrawalDay();
    const cycleName = AUTH.getCycleName();
    const offcycleLogs = DB.getOffcycleLogs().slice(0,5);
    const u = AUTH.currentUser;

    el.innerHTML = `
      ${u.offCycle ? `<div class="alert alert-warn" style="margin-bottom:14px">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v1"/></svg>
        <div><strong>Off-cycle login recorded.</strong> Reason: "${U.escapeHtml(u.remarks)}"</div>
      </div>` : ''}

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Total Clients</div>
          <div class="stat-val" style="color:#1d4ed8">${clients.length}</div>
          <div class="stat-sub">Registered</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Items</div>
          <div class="stat-val" style="color:#475569">${items.length}</div>
          <div class="stat-sub">Cards &amp; passbooks</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">In Vault</div>
          <div class="stat-val" style="color:#15803d">${inVault}</div>
          <div class="stat-sub">Secured</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pulled Out</div>
          <div class="stat-val" style="color:#92400e">${pulledOut}</div>
          <div class="stat-sub">Currently out</div>
        </div>
      </div>

      <div class="alert ${isWD?'alert-success':'alert-warn'}" style="margin-bottom:14px">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 2"/></svg>
        <div>
          <strong>${isWD ? `Withdrawal Day — ${cycleName} cycle` : 'Off-cycle Day'}</strong>
          &nbsp;&middot;&nbsp; ${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </div>
      </div>

      <div class="sec-label">Recent Movements</div>
      <div class="tbl-wrap" style="margin-bottom:16px">
        ${movements.length===0 ? `<div class="empty"><div class="empty-title">No movements logged yet</div><div class="empty-sub">Log a movement from a client profile</div></div>` :
        `<table>
          <thead><tr>
            <th>Date &amp; Time</th><th>Client</th><th>Item</th><th>Action</th>
            <th>From &rarr; To</th><th>Box</th><th>Staff</th><th>Remarks</th>
          </tr></thead>
          <tbody>
            ${movements.map(m=>`<tr>
              <td>${U.fmtDateTime(m.createdAt)}</td>
              <td>${U.escapeHtml(m.clientName||'—')}</td>
              <td>${U.itemTypeBadge(m.itemType)}</td>
              <td>${U.actionBadge(m.action)}</td>
              <td style="color:#6b7280">${U.escapeHtml(m.fromLocation||'—')} &rarr; ${U.escapeHtml(m.toLocation||'—')}</td>
              <td>${m.box?U.boxBadge(m.box):'—'}</td>
              <td>${U.escapeHtml(m.staff||'—')}</td>
              <td style="color:#6b7280;max-width:140px;overflow:hidden;text-overflow:ellipsis">${U.escapeHtml(m.remarks||'—')}</td>
            </tr>`).join('')}
          </tbody>
        </table>`}
      </div>

      ${AUTH.isAdmin() ? `
        <div class="sec-label">Off-cycle Login Log <span style="font-weight:400;color:#9ca3af">(Admin View)</span></div>
        <div class="tbl-wrap">
          ${offcycleLogs.length===0 ? `<div class="empty"><div class="empty-title">No off-cycle logins recorded</div></div>` :
          offcycleLogs.map(l=>`
            <div style="padding:10px 14px;border-bottom:0.5px solid #f3f4f6;display:flex;align-items:flex-start;gap:12px">
              <div style="width:28px;height:28px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;color:#1d4ed8;flex-shrink:0">${U.escapeHtml(l.initials)}</div>
              <div>
                <div style="font-size:12px;font-weight:500">${U.escapeHtml(l.staff)} &mdash; ${U.escapeHtml(l.date)} &middot; ${U.escapeHtml(l.time)} ${U.badge('Off-cycle','yellow')}</div>
                <div style="font-size:11px;color:#6b7280;margin-top:3px">"${U.escapeHtml(l.reason)}"</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }
};
