document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const urlQueueForm = document.getElementById("url-queue-form");
    const btnQueueUrl = document.getElementById("btn-queue-url");
    const urlQueueStatus = document.getElementById("url-queue-status");
    
    const setupForm = document.getElementById("setup-form");
    const setupStatus = document.getElementById("setup-status");
    
    const userPlanPill = document.getElementById("user-plan-pill");
    const userQuotaPill = document.getElementById("user-quota-pill");
    const statPublished = document.getElementById("stat-published");
    const statDrafts = document.getElementById("stat-drafts");
    const statLinksQueued = document.getElementById("stat-links-queued");
    const statQuotaUsed = document.getElementById("stat-quota-used");
    
    const linksTbody = document.getElementById("links-tbody");
    const refreshLinksBtn = document.getElementById("refresh-links-btn");
    const jobsTbody = document.getElementById("jobs-tbody");
    const jobStatusFilter = document.getElementById("job-status-filter");
    const draftsContainer = document.getElementById("drafts-container");
    
    const navOverview = document.getElementById("nav-overview");
    const navQueueUrl = document.getElementById("nav-queue-url");
    const navJobs = document.getElementById("nav-jobs");
    const navDrafts = document.getElementById("nav-drafts");
    const navSetup = document.getElementById("nav-setup");
    const navAdmin = document.getElementById("nav-admin");
    const logoutBtn = document.getElementById("logout-btn");
    
    const urlQueueSection = document.getElementById("url-queue-section");
    const linkHistorySection = document.getElementById("link-history-section");
    const jobsSection = document.getElementById("jobs-section");
    const draftsSection = document.getElementById("drafts-section");
    const setupSection = document.getElementById("setup-section");
    
    const timelineModal = document.getElementById("timeline-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const modalJobTitle = document.getElementById("modal-job-title");
    const timelineEventsContainer = document.getElementById("timeline-events-container");

    // Fetch Usage & User Account Details
    async function loadUsage() {
        try {
            const res = await fetch("/api/user/usage");
            if (res.status === 401) {
                window.location.href = "/login.html";
                return;
            }
            const data = await res.json();
            if (data.plan) {
                userPlanPill.textContent = `Plan: ${data.plan}`;
                userQuotaPill.textContent = `Quota: ${data.monthly_usage} / ${data.article_limit}`;
                statQuotaUsed.textContent = `${data.usage_percentage}%`;
                statPublished.textContent = data.published_count || 0;
                statDrafts.textContent = data.total_drafts || 0;
            }
        } catch (e) {
            console.error("Failed to load usage summary", e);
        }
    }

    // Fetch Submissions / Queued Links History
    async function loadLinks() {
        try {
            const res = await fetch("/api/links/status");
            const links = await res.json();
            if (!Array.isArray(links)) return;

            if (statLinksQueued) statLinksQueued.textContent = links.length;

            if (links.length === 0) {
                linksTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: rgba(0,0,0,0.5);">No URLs queued yet. Submit a URL above to start!</td></tr>`;
                return;
            }

            linksTbody.innerHTML = links.map(l => {
                let badgeClass = "badge-info";
                if (l.status === "Published") badgeClass = "badge-success";
                if (l.status === "Failed") badgeClass = "badge-danger";
                if (l.status === "Processing") badgeClass = "badge-warning";

                return `
                    <tr>
                        <td>#${l.id}</td>
                        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <a href="${l.url}" target="_blank" style="color: #2563EB; text-decoration: none;">${l.url}</a>
                        </td>
                        <td>${l.provider || ''} — ${l.game_name || ''}</td>
                        <td><span class="badge ${badgeClass}">${l.status || 'New'}</span></td>
                        <td><small style="color: var(--text-secondary);">${l.status_reason || '--'}</small></td>
                        <td>${l.created_at ? l.created_at.substring(0, 16) : '--'}</td>
                        <td>
                            ${l.status === 'Failed' ? `<button class="nav-btn retry-link-btn" data-url="${l.url}" data-game="${l.game_name}" data-provider="${l.provider}" style="color: #EF4444; font-size: 0.8rem;">🔄 Retry</button>` : '--'}
                        </td>
                    </tr>
                `;
            }).join("");

            document.querySelectorAll(".retry-link-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const targetUrl = e.target.getAttribute("data-url");
                    const game = e.target.getAttribute("data-game");
                    const prov = e.target.getAttribute("data-provider");
                    
                    const formData = new FormData();
                    formData.append("url", targetUrl);
                    formData.append("game_name", game || "");
                    formData.append("provider", prov || "");
                    formData.append("market", "UK");

                    try {
                        const rRes = await fetch("/api/links", { method: "POST", body: formData });
                        const rData = await rRes.json();
                        alert(rData.message || "Retry job enqueued!");
                        loadLinks();
                        loadJobs();
                    } catch (err) {
                        alert("Retry failed: " + err);
                    }
                });
            });
        } catch (e) {
            console.error("Failed to load queued links", e);
        }
    }

    // Fetch User Automation Jobs List
    async function loadJobs() {
        try {
            const filter = jobStatusFilter ? jobStatusFilter.value : "ALL";
            const res = await fetch(`/api/user/jobs?status_filter=${filter}`);
            const jobs = await res.json();
            
            if (!Array.isArray(jobs) || jobs.length === 0) {
                jobsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: rgba(0,0,0,0.5);">No active automation jobs found. Enter a URL above to start!</td></tr>`;
                return;
            }

            jobsTbody.innerHTML = jobs.map(j => {
                let badgeClass = "badge-info";
                if (j.status === "PUBLISHED" || j.status === "PENDING_REVIEW") badgeClass = "badge-success";
                if (j.status === "FAILED") badgeClass = "badge-danger";
                if (j.status === "QUEUED" || j.status === "RETRYING") badgeClass = "badge-warning";

                return `
                    <tr>
                        <td><strong>${j.job_id}</strong></td>
                        <td>${j.provider} - ${j.game_name}</td>
                        <td><span class="badge ${badgeClass}">${j.status}</span></td>
                        <td><code style="background: rgba(0,0,0,0.06); padding: 3px 8px; border-radius: 4px; font-weight: bold;">${j.current_stage || 'QUEUED'}</code></td>
                        <td>${j.duration ? j.duration.toFixed(1) + 's' : '--'}</td>
                        <td>
                            <button class="nav-btn view-timeline-btn" data-job-id="${j.job_id}" style="color: #2563EB;">🔍 View Timeline</button>
                        </td>
                    </tr>
                `;
            }).join("");

            document.querySelectorAll(".view-timeline-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const jobId = e.target.getAttribute("data-job-id");
                    openTimelineModal(jobId);
                });
            });
        } catch (e) {
            console.error("Failed to load jobs", e);
        }
    }

    // Fetch Job Timeline Modal
    async function openTimelineModal(jobId) {
        modalJobTitle.textContent = `Job Event Timeline (${jobId})`;
        timelineEventsContainer.innerHTML = `<p style="color: gray;">Loading timeline events...</p>`;
        timelineModal.classList.remove("hidden");

        try {
            const res = await fetch(`/api/user/jobs/${jobId}/timeline`);
            const data = await res.json();
            
            if (!data.timeline || data.timeline.length === 0) {
                timelineEventsContainer.innerHTML = `<p style="color: gray;">No events recorded for this job yet.</p>`;
                return;
            }

            timelineEventsContainer.innerHTML = data.timeline.map(ev => `
                <div class="timeline-event">
                    <div class="timeline-time">${ev.timestamp || ''} (${ev.worker_id || 'system'})</div>
                    <div class="timeline-title">${ev.event_type} — <span style="color: #FF7A3D;">${ev.stage}</span></div>
                    <div class="timeline-msg">${ev.message || ev.status}</div>
                </div>
            `).join("");
        } catch (e) {
            timelineEventsContainer.innerHTML = `<p style="color: red;">Failed to load timeline.</p>`;
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            timelineModal.classList.add("hidden");
        });
    }

    // Fetch Drafts
    async function loadDrafts() {
        try {
            const res = await fetch("/api/drafts");
            const drafts = await res.json();
            if (!Array.isArray(drafts) || drafts.length === 0) {
                draftsContainer.innerHTML = `<p style="color: var(--text-secondary);">No drafts pending review.</p>`;
                return;
            }
            draftsContainer.innerHTML = drafts.map(d => `
                <div style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.08); padding: 16px; border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 1.1rem; color: var(--text-primary);">${d.game_name} (${d.provider})</strong>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${d.created_at}</div>
                    </div>
                    <button class="btn-primary publish-draft-btn" data-id="${d.id}" style="padding: 8px 16px; font-size: 0.9rem;">🚀 Publish to WP</button>
                </div>
            `).join("");

            document.querySelectorAll(".publish-draft-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.target.getAttribute("data-id");
                    e.target.disabled = true;
                    e.target.textContent = "Publishing...";
                    try {
                        const pRes = await fetch(`/api/publish/${id}`, { method: "POST" });
                        const pData = await pRes.json();
                        alert(pData.message || pData.detail || "Published successfully!");
                        loadDrafts();
                        loadJobs();
                        loadUsage();
                    } catch (err) {
                        alert("Publishing failed: " + err);
                        e.target.disabled = false;
                        e.target.textContent = "Publish to WP";
                    }
                });
            });
        } catch (e) {
            console.error("Failed to load drafts", e);
        }
    }

    // Handle Dedicated URL Submission Form
    if (urlQueueForm) {
        urlQueueForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            btnQueueUrl.disabled = true;
            urlQueueStatus.classList.remove("hidden");
            urlQueueStatus.textContent = "Queueing URL and starting automation worker...";

            const formData = new FormData();
            formData.append("url", document.getElementById("input_target_url").value);
            formData.append("game_name", document.getElementById("input_game_name").value || "");
            formData.append("provider", document.getElementById("input_provider").value || "");
            formData.append("market", document.getElementById("input_market").value || "UK");

            const featImg = document.getElementById("input_featured_image").files[0];
            if (featImg) formData.append("featured_image", featImg);

            try {
                const res = await fetch("/api/links", {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    urlQueueStatus.textContent = data.message || `URL queued successfully! Job ID: ${data.job_id}`;
                    document.getElementById("input_target_url").value = "";
                    loadLinks();
                    loadJobs();
                    loadUsage();
                } else {
                    urlQueueStatus.textContent = `Error: ${data.detail || data.error || data.message}`;
                }
            } catch (err) {
                urlQueueStatus.textContent = `Request failed: ${err}`;
            } finally {
                btnQueueUrl.disabled = false;
            }
        });
    }

    // Handle Settings Form
    if (setupForm) {
        setupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                wp_url: document.getElementById("set_wp_url").value,
                wp_username: document.getElementById("set_wp_username").value,
                wp_app_password: document.getElementById("set_wp_password").value,
                theme_type: document.getElementById("set_theme_type").value,
                seo_plugin: document.getElementById("set_seo_plugin").value
            };
            try {
                const res = await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                setupStatus.classList.remove("hidden");
                setupStatus.textContent = data.message || "Settings updated successfully!";
            } catch (err) {
                alert("Failed to save settings: " + err);
            }
        });
    }

    // Check Settings to Autofill
    async function loadSettings() {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            if (data.wp_url) {
                document.getElementById("set_wp_url").value = data.wp_url;
                document.getElementById("set_wp_username").value = data.wp_username || "";
                document.getElementById("set_wp_password").value = data.wp_app_password || "";
                if (data.theme_type) document.getElementById("set_theme_type").value = data.theme_type;
                if (data.seo_plugin) document.getElementById("set_seo_plugin").value = data.seo_plugin;
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }

    // Check Role to show Admin Button
    async function checkRole() {
        try {
            const res = await fetch("/api/admin/stats");
            if (res.ok && navAdmin) {
                navAdmin.classList.remove("hidden");
                navAdmin.addEventListener("click", () => {
                    window.location.href = "/admin";
                });
            }
        } catch (e) {}
    }

    // Navigation Switches
    if (navOverview) navOverview.addEventListener("click", () => {
        urlQueueSection.classList.remove("hidden");
        linkHistorySection.classList.remove("hidden");
        jobsSection.classList.remove("hidden");
        draftsSection.classList.remove("hidden");
        setupSection.classList.add("hidden");
    });
    if (navQueueUrl) navQueueUrl.addEventListener("click", () => {
        urlQueueSection.scrollIntoView({ behavior: 'smooth' });
    });
    if (navJobs) navJobs.addEventListener("click", () => {
        jobsSection.scrollIntoView({ behavior: 'smooth' });
    });
    if (navDrafts) navDrafts.addEventListener("click", () => {
        draftsSection.scrollIntoView({ behavior: 'smooth' });
    });
    if (navSetup) navSetup.addEventListener("click", () => {
        setupSection.classList.remove("hidden");
        urlQueueSection.classList.add("hidden");
        linkHistorySection.classList.add("hidden");
        jobsSection.classList.add("hidden");
        draftsSection.classList.add("hidden");
    });
    
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login.html";
        });
    }

    if (refreshLinksBtn) refreshLinksBtn.addEventListener("click", loadLinks);
    if (jobStatusFilter) jobStatusFilter.addEventListener("change", loadJobs);

    // Initial Load & Automatic Polling
    loadUsage();
    loadLinks();
    loadJobs();
    loadDrafts();
    loadSettings();
    checkRole();

    setInterval(() => {
        loadLinks();
        loadJobs();
    }, 5000);
});
