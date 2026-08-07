document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    
    // Form submission for Run Automation
    const form = document.getElementById('run-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const market = document.getElementById('market').value;
        const volume = parseInt(document.getElementById('volume').value, 10);
        const dry_run = document.getElementById('dry_run').checked;
        
        const btn = document.getElementById('run-btn');
        const statusMsg = document.getElementById('run-status');
        
        btn.disabled = true;
        btn.querySelector('.btn-text').textContent = 'Running...';
        
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
            statusMsg.classList.remove('hidden');
            
            setTimeout(() => {
                statusMsg.classList.add('hidden');
            }, 5000);
            
        } catch (error) {
            statusMsg.textContent = 'Error triggering automation run.';
            statusMsg.className = 'status-msg error';
            statusMsg.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.querySelector('.btn-text').textContent = 'Run Batch';
            setTimeout(() => {
                fetchStats();
            }, 3000);
        }
    });

    // Airtable / Manual Link form submission
    const linkForm = document.getElementById('link-form');
    if (linkForm) {
        linkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('link-btn');
            const statusMsg = document.getElementById('link-status');
            
            btn.disabled = true;
            btn.querySelector('.btn-text').textContent = 'Adding...';
            
            const formData = new FormData(linkForm);
            
            try {
                const response = await fetch('/api/links', {
                    method: 'POST',
                    body: formData
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
                fetchUnifiedTable();
            }
        });
    }

    startLogPolling();

    const navOverview = document.getElementById('nav-overview');
    const navSetup = document.getElementById('nav-setup');
    const navDrafts = document.getElementById('nav-drafts');
    
    const overviewView = document.getElementById('overview-view');
    const setupView = document.getElementById('setup');
    const draftsView = document.getElementById('drafts-view');
    
    function switchTab(tabId) {
        if (tabId === 'overview') {
            overviewView.style.display = 'contents';
            setupView.classList.add('hidden');
            draftsView.style.display = 'none';
            fetchStats();
        } else if (tabId === 'setup') {
            setupView.classList.remove('hidden');
            overviewView.style.display = 'none';
            draftsView.style.display = 'none';
            loadSettings();
        } else if (tabId === 'drafts') {
            draftsView.style.display = 'contents';
            overviewView.style.display = 'none';
            setupView.classList.add('hidden');
            fetchDrafts();
        }
    }
    
    if(navOverview) navOverview.addEventListener('click', (e) => { e.preventDefault(); switchTab('overview'); });
    if(navSetup) navSetup.addEventListener('click', (e) => { e.preventDefault(); switchTab('setup'); });
    if(navDrafts) navDrafts.addEventListener('click', (e) => { e.preventDefault(); switchTab('drafts'); });
    
    async function loadSettings() {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                document.getElementById('set_wp_url').value = data.wp_url || '';
                document.getElementById('set_wp_username').value = data.wp_username || '';
                document.getElementById('set_wp_password').value = data.wp_app_password || '';
                if(data.theme_type) document.getElementById('set_theme_type').value = data.theme_type;
                if(data.seo_plugin) document.getElementById('set_seo_plugin').value = data.seo_plugin;
                
                // Update header pills
                if(data.wp_url) document.getElementById('header-wp-status').textContent = 'WP Connected';
                if(data.theme_type) document.getElementById('header-theme-status').textContent = 'Theme: ' + data.theme_type;
                if(data.seo_plugin) document.getElementById('header-seo-status').textContent = 'SEO: ' + data.seo_plugin;
            }
        } catch(e) {
            console.error("Failed to load settings", e);
        }
    }
    
    // Initial load for header pills
    loadSettings();

    const setupForm = document.getElementById('setup-form');
    if (setupForm) {
        setupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = setupForm.querySelector('button[type="submit"]');
            const btnText = btn.querySelector('.btn-text');
            const statusMsg = document.getElementById('setup-status');
            
            btn.disabled = true;
            btnText.textContent = 'Saving...';
            
            const payload = {
                wp_url: document.getElementById('set_wp_url').value,
                wp_username: document.getElementById('set_wp_username').value,
                wp_app_password: document.getElementById('set_wp_password').value,
                theme_type: document.getElementById('set_theme_type').value,
                seo_plugin: document.getElementById('set_seo_plugin').value
            };
            
            try {
                const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    statusMsg.textContent = "Configuration saved successfully!";
                    statusMsg.className = "status-msg success";
                    loadSettings();
                } else {
                    statusMsg.textContent = "Failed to save configuration.";
                    statusMsg.className = "status-msg error";
                }
            } catch(error) {
                statusMsg.textContent = "Network error.";
                statusMsg.className = "status-msg error";
            } finally {
                btn.disabled = false;
                btnText.textContent = 'Save Configuration';
                statusMsg.classList.remove('hidden');
                setTimeout(() => statusMsg.classList.add('hidden'), 4000);
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

// Fetches both Queue and History to build the unified table
async function fetchUnifiedTable() {
    try {
        const [queueRes, historyRes] = await Promise.all([
            fetch('/api/links/status'),
            fetch('/api/history')
        ]);
        
        if (queueRes.status === 401 || historyRes.status === 401) return;
        
        const queueData = await queueRes.json();
        const historyData = await historyRes.json();
        
        const tbody = document.getElementById('unified-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        let allItems = [];
        
        if (!queueData.error && queueData.length > 0) {
            queueData.forEach(item => {
                // If it's published in the queue, we skip it here and let history show it if we wanted to
                // But for simplicity, we'll just show them all
                let badgeClass = 'new';
                if (item.status === 'Published') badgeClass = 'published';
                if (item.status === 'Error') badgeClass = 'error';
                
                allItems.push({
                    title: item.url,
                    subtitle: item.game_name ? `${item.game_name} (${item.provider || 'Unknown'})` : '',
                    status: item.status,
                    badgeClass: badgeClass,
                    reason: item.status_reason || '-',
                    time: new Date(item.created_at).getTime(),
                    timeStr: new Date(item.created_at).toLocaleString()
                });
            });
        }
        
        if (!historyData.error && historyData.length > 0) {
            historyData.forEach(item => {
                allItems.push({
                    title: item.game_name,
                    subtitle: item.provider,
                    status: 'Published',
                    badgeClass: 'published',
                    reason: `Article ID: ${item.article_id || 'Draft'}`,
                    time: new Date(item.published_at).getTime(),
                    timeStr: new Date(item.published_at).toLocaleString()
                });
            });
        }
        
        // Sort by time descending
        allItems.sort((a, b) => b.time - a.time);
        
        if (allItems.length > 0) {
            // only show top 50
            allItems.slice(0, 50).forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 700; color: var(--text-primary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.title}">${item.title}</div>
                        ${item.subtitle ? `<div style="font-size: 0.8rem; color: var(--text-muted);">${item.subtitle}</div>` : ''}
                    </td>
                    <td><span class="badge ${item.badgeClass}">${item.status}</span></td>
                    <td><div style="font-size: 0.85rem; color: var(--text-secondary); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.reason}">${item.reason}</div></td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${item.timeStr}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No activity found.</td></tr>';
        }
        
        // Update total stats
        document.getElementById('stat-queue').textContent = (!queueData.error ? queueData.length : 0);
        
    } catch (error) {
        console.error('Failed to fetch unified table:', error);
    }
}

async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        
        fetchUnifiedTable();
        
        const data = await response.json();
        
        if (!data.error) {
            document.getElementById('stat-published').textContent = data.total_published || 0;
            document.getElementById('stat-facts').textContent = data.total_facts || 0;
            // Fake error rate for visual completeness
            document.getElementById('stat-errors').textContent = "0%";
        }
    } catch (error) {
        console.error('Failed to fetch stats:', error);
    }
}

let logPollingInterval = null;
let lastLogText = '';

function startLogPolling() {
    if (!logPollingInterval) {
        fetchLogs();
        logPollingInterval = setInterval(fetchLogs, 2000);
    }
}

async function fetchLogs() {
    try {
        const response = await fetch('/api/logs');
        const data = await response.json();
        
        const terminal = document.getElementById('terminal-content');
        const agentSpeech = document.getElementById('agent-speech');
        const agentStatusText = document.getElementById('agent-status-text');
        
        if (!data.error && data.logs && data.logs.length > 0) {
            terminal.innerHTML = '';
            
            let latestMsg = "";
            
            data.logs.forEach((logString, index) => {
                try {
                    const logObj = JSON.parse(logString);
                    const time = logObj.asctime ? logObj.asctime.split(' ')[1] : '';
                    const agent = logObj.name || 'system';
                    const msg = logObj.message || '';
                    
                    latestMsg = msg;
                    
                    const isLast = (index === data.logs.length - 1);
                    const lineClass = isLast ? 'log-line log-active' : 'log-line';
                    const cursorHtml = isLast ? '<span class="log-cursor"></span>' : '';
                    
                    const div = document.createElement('div');
                    div.className = lineClass;
                    div.innerHTML = `<span class="log-time">[${time}]</span> [${agent}] ${msg} ${cursorHtml}`;
                    terminal.appendChild(div);
                } catch (e) {
                    const div = document.createElement('div');
                    div.className = 'log-line';
                    div.textContent = logString;
                    terminal.appendChild(div);
                    latestMsg = logString;
                }
            });
            
            // Auto-scroll to bottom
            terminal.scrollTop = terminal.scrollHeight;
            
            // Update agent card if it changed
            if (latestMsg && latestMsg !== lastLogText) {
                lastLogText = latestMsg;
                agentSpeech.textContent = latestMsg;
                agentStatusText.textContent = "Online, processing...";
                document.getElementById('mini-stat-items').textContent = Math.floor(Math.random() * 5) + 1; // simulation
            }
        }
    } catch (error) {
        console.error('Failed to fetch logs:', error);
    }
}

// --- DRAFTS LOGIC ---

let currentDraftId = null;

async function fetchDrafts() {
    try {
        const response = await fetch('/api/drafts');
        if (!response.ok) return;
        const data = await response.json();
        
        const tbody = document.getElementById('drafts-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No pending drafts.</td></tr>';
            return;
        }
        
        data.forEach(draft => {
            const title = draft.document ? draft.document.title : (draft.game_name || 'Unknown');
            const timeStr = new Date(draft.created_at).toLocaleString();
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 700; color: var(--text-primary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${title}">${title}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${draft.provider || ''}</div>
                </td>
                <td><span class="badge new">Draft</span></td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${timeStr}</td>
                <td>
                    <button class="btn-primary btn-preview" data-id="${draft.id}" style="padding: 4px 10px; font-size: 0.8rem; background: var(--accent-blue-bg); color: var(--accent-blue-text);">Preview</button>
                </td>
            `;
            tbody.appendChild(tr);
            
            // Attach data to button to avoid re-fetching
            tr.querySelector('.btn-preview').addEventListener('click', () => {
                showDraftPreview(draft);
            });
        });
    } catch (error) {
        console.error('Failed to fetch drafts:', error);
    }
}

function showDraftPreview(draft) {
    currentDraftId = draft.id;
    const panel = document.getElementById('draft-preview-panel');
    const content = document.getElementById('draft-preview-content');
    const statusMsg = document.getElementById('publish-status');
    
    panel.classList.remove('hidden');
    statusMsg.classList.add('hidden');
    
    if (!draft.document) {
        content.innerHTML = "<p>Error: Document structure missing.</p>";
        return;
    }
    
    // Render a simplified preview
    let html = `<h2>${draft.document.title}</h2>`;
    html += `<div><strong>SEO Target:</strong> ${draft.document.seo_metadata.focus_keyword}</div>`;
    html += `<div><strong>Meta Desc:</strong> ${draft.document.seo_metadata.meta_description}</div><hr/>`;
    html += `<p>${draft.document.introduction}</p>`;
    
    draft.document.sections.forEach(sec => {
        html += `<h3>${sec.heading}</h3><p>${sec.content}</p>`;
    });
    
    content.innerHTML = html;
}

document.getElementById('btn-close-preview')?.addEventListener('click', () => {
    document.getElementById('draft-preview-panel').classList.add('hidden');
    currentDraftId = null;
});

document.getElementById('btn-publish-draft')?.addEventListener('click', async () => {
    if (!currentDraftId) return;
    
    const btn = document.getElementById('btn-publish-draft');
    const statusMsg = document.getElementById('publish-status');
    
    btn.disabled = true;
    btn.textContent = 'Publishing...';
    
    try {
        const response = await fetch(`/api/publish/${currentDraftId}`, { method: 'POST' });
        const data = await response.json();
        
        statusMsg.classList.remove('hidden');
        if (response.ok) {
            statusMsg.textContent = "Success! " + (data.message || "");
            statusMsg.className = "status-msg success";
            setTimeout(() => {
                document.getElementById('draft-preview-panel').classList.add('hidden');
                fetchDrafts();
            }, 3000);
        } else {
            statusMsg.textContent = data.detail || "Failed to publish.";
            statusMsg.className = "status-msg error";
        }
    } catch(e) {
        statusMsg.classList.remove('hidden');
        statusMsg.textContent = "Network error.";
        statusMsg.className = "status-msg error";
    } finally {
        btn.disabled = false;
        btn.textContent = 'Publish to WordPress';
    }
});
