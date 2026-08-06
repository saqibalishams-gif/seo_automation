document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    fetchHistory();
    
    // Form submission
    const form = document.getElementById('run-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const market = document.getElementById('market').value;
        const volume = parseInt(document.getElementById('volume').value, 10);
        const dry_run = document.getElementById('dry_run').checked;
        
        const btn = document.getElementById('run-btn');
        const statusMsg = document.getElementById('run-status');
        
        btn.disabled = true;
        btn.innerHTML = 'Running...';
        
        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ market, volume, dry_run })
            });
            
            const data = await response.json();
            
            statusMsg.textContent = data.message;
            statusMsg.className = 'status-msg success';
            
            setTimeout(() => {
                statusMsg.className = 'status-msg hidden';
            }, 5000);
            
        } catch (error) {
            statusMsg.textContent = 'Error triggering automation run.';
            statusMsg.className = 'status-msg error';
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Run Automation';
            // refresh stats after 3 seconds assuming script might have updated it
            setTimeout(() => {
                fetchStats();
                fetchHistory();
            }, 3000);
        }
    });
    // Airtable Link form submission
    const linkForm = document.getElementById('link-form');
    if (linkForm) {
        linkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('link-btn');
            const statusMsg = document.getElementById('link-status');
            
            btn.disabled = true;
            btn.querySelector('.btn-text').textContent = 'Uploading...';
            
            const formData = new FormData(linkForm);
            
            try {
                const response = await fetch('/api/links', {
                    method: 'POST',
                    body: formData // fetch automatically sets the Content-Type to multipart/form-data with boundary
                });
                
                const data = await response.json();
                
                if (data.error) {
                    statusMsg.textContent = data.error;
                    statusMsg.className = 'status-msg error';
                } else {
                    statusMsg.textContent = data.message;
                    statusMsg.className = 'status-msg success';
                    linkForm.reset();
                }
                
                statusMsg.classList.remove('hidden');
                
                setTimeout(() => {
                    statusMsg.classList.add('hidden');
                }, 5000);
                
            } catch (error) {
                statusMsg.textContent = 'Error communicating with server.';
                statusMsg.className = 'status-msg error';
                statusMsg.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.querySelector('.btn-text').textContent = 'Add to Queue';
                fetchQueue();
            }
        });
    }
});

async function fetchQueue() {
    try {
        const response = await fetch('/api/links/status');
        if (response.status === 401) return;
        const data = await response.json();
        
        const tbody = document.getElementById('queue-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!data.error && data.length > 0) {
            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="font-size: 0.9rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; max-width: 250px; white-space: nowrap;" title="${item.url}">${item.url}</div>
                        ${item.game_name ? `<div style="font-size: 0.8rem; color: #94a3b8;">${item.game_name} (${item.provider || 'Unknown'})</div>` : ''}
                    </td>
                    <td><span class="badge" style="background: ${item.status === 'New' ? '#3b82f6' : item.status === 'Published' ? '#10b981' : '#ef4444'}">${item.status}</span></td>
                    <td><div style="font-size: 0.8rem; color: #94a3b8; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.status_reason || '-'}">${item.status_reason || '-'}</div></td>
                    <td style="font-size: 0.85rem; color: #cbd5e1;">${new Date(item.created_at).toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No queued links found.</td></tr>';
        }
    } catch (error) {
        console.error('Failed to fetch queue:', error);
    }
}

async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        
        fetchQueue();
        
        const data = await response.json();
        
        if (!data.error) {
            document.getElementById('stat-published').textContent = data.total_published;
            document.getElementById('stat-facts').textContent = data.total_facts;
        } else {
            console.error('Stats Error:', data.error);
        }
    } catch (error) {
        console.error('Failed to fetch stats:', error);
    }
}

async function fetchHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();
        
        const tbody = document.getElementById('history-tbody');
        tbody.innerHTML = '';
        
        if (!data.error && data.length > 0) {
            data.forEach(item => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td><strong>${item.game_name}</strong></td>
                    <td><span class="badge">${item.provider}</span></td>
                    <td>${item.article_id ? item.article_id : '<span class="text-muted">Draft/None</span>'}</td>
                    <td>${new Date(item.published_at).toLocaleString()}</td>
                `;
                
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No history found.</td></tr>';
        }
    } catch (error) {
        console.error('Failed to fetch history:', error);
    }
}

let logPollingInterval = null;

function startLogPolling() {
    if (!logPollingInterval) {
        fetchLogs();
        logPollingInterval = setInterval(fetchLogs, 2000);
    }
}

function stopLogPolling() {
    if (logPollingInterval) {
        clearInterval(logPollingInterval);
        logPollingInterval = null;
    }
}

async function fetchLogs() {
    try {
        const response = await fetch('/api/logs');
        const data = await response.json();
        
        const terminal = document.getElementById('terminal-content');
        if (!data.error && data.logs && data.logs.length > 0) {
            terminal.innerHTML = '';
            
            data.logs.forEach(logString => {
                try {
                    const logObj = JSON.parse(logString);
                    const time = logObj.asctime ? logObj.asctime.split(' ')[1] : '';
                    const agent = logObj.name || 'system';
                    const level = logObj.levelname || 'INFO';
                    const msg = logObj.message || '';
                    
                    let color = '#10b981'; // green for INFO
                    if (level === 'WARNING') color = '#f59e0b'; // yellow
                    if (level === 'ERROR') color = '#ef4444'; // red
                    
                    const div = document.createElement('div');
                    div.style.marginBottom = '4px';
                    div.innerHTML = `<span style="color: #64748b;">[${time}]</span> <strong style="color: #38bdf8;">[${agent}]</strong> <span style="color: ${color};">${msg}</span>`;
                    terminal.appendChild(div);
                } catch (e) {
                    // Fallback if not valid JSON
                    const div = document.createElement('div');
                    div.textContent = logString;
                    terminal.appendChild(div);
                }
            });
            // Auto-scroll to bottom
            const container = document.querySelector('.terminal-window');
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Failed to fetch logs:', error);
    }
}

// Start polling immediately so they can see existing logs
document.addEventListener('DOMContentLoaded', () => {
    startLogPolling();
    
    // Settings Logic
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const settingsForm = document.getElementById('settings-form');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                document.getElementById('set_wp_url').value = data.wp_url || '';
                document.getElementById('set_wp_username').value = data.wp_username || '';
                document.getElementById('set_wp_password').value = data.wp_app_password || '';
                
                settingsModal.style.display = 'flex';
            }
        });
    }
    
    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
    }
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                wp_url: document.getElementById('set_wp_url').value,
                wp_username: document.getElementById('set_wp_username').value,
                wp_app_password: document.getElementById('set_wp_password').value
            };
            
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alert('Settings saved successfully!');
                settingsModal.style.display = 'none';
            } else {
                alert('Failed to save settings.');
            }
        });
    }
    
    // Logout Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login.html';
        });
    }
});
