document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const runForm = document.getElementById("run-form");
    const runBtn = document.getElementById("run-btn");
    const runStatus = document.getElementById("run-status");
    const setupForm = document.getElementById("setup-form");
    const setupStatus = document.getElementById("setup-status");
    
    const userPlanPill = document.getElementById("user-plan-pill");
    const userQuotaPill = document.getElementById("user-quota-pill");
    const statPublished = document.getElementById("stat-published");
    const statDrafts = document.getElementById("stat-drafts");
    const statQuotaUsed = document.getElementById("stat-quota-used");
    
    const jobsTbody = document.getElementById("jobs-tbody");
    const jobStatusFilter = document.getElementById("job-status-filter");
    const draftsContainer = document.getElementById("drafts-container");
    
    const navOverview = document.getElementById("nav-overview");
    const navJobs = document.getElementById("nav-jobs");
    const navDrafts = document.getElementById("nav-drafts");
    const navSetup = document.getElementById("nav-setup");
    const navAdmin = document.getElementById("nav-admin");
    const logoutBtn = document.getElementById("logout-btn");
    
    const jobsSection = document.getElementById("jobs-section");
    const draftsSection = document.getElementById("drafts-section");
    const setupSection = document.getElementById("setup-section");
    
    const timelineModal = document.getElementById("timeline-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const modalJobTitle = document.getElementById("modal-job-title");
    const timelineEventsContainer = document.getElementById("timeline-events-container");

    // Fetch Usage & Quota
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

    // Fetch Jobs List
    async function loadJobs() {
        try {
            const filter = jobStatusFilter ? jobStatusFilter.value : "ALL";
            const res = await fetch(`/api/user/jobs?status_filter=${filter}`);
            const jobs = await res.json();
            
            if (!Array.isArray(jobs) || jobs.length === 0) {
                jobsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: rgba(255,255,255,0.5);">No automation jobs found. Start a new run above!</td></tr>`;
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
                        <td><code style="background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">${j.current_stage || 'QUEUED'}</code></td>
                        <td>${j.duration ? j.duration.toFixed(1) + 's' : '--'}</td>
                        <td>
                            <button class="nav-btn view-timeline-btn" data-job-id="${j.job_id}" style="color: #60A5FA;">🔍 Timeline</button>
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

    // Fetch Timeline Modal
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
                draftsContainer.innerHTML = `<p style="color: rgba(255,255,255,0.6);">No drafts pending review.</p>`;
                return;
            }
            draftsContainer.innerHTML = drafts.map(d => `
                <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: white;">${d.game_name} (${d.provider})</strong>
                        <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">${d.created_at}</div>
                    </div>
                    <button class="btn-primary publish-draft-btn" data-id="${d.id}" style="padding: 6px 12px; font-size: 0.85rem;">Publish to WP</button>
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

    // Handle Run Form
    if (runForm) {
        runForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            runBtn.disabled = true;
            runStatus.classList.remove("hidden");
            runStatus.textContent = "Enqueueing automation job...";

            const payload = {
                game_name: document.getElementById("run_game_name").value,
                provider: document.getElementById("run_provider").value,
                market: document.getElementById("run_market").value,
                volume: 1,
                dry_run: false
            };

            try {
                const res = await fetch("/api/run", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok) {
                    runStatus.textContent = `Job enqueued! ID: ${data.job_id}`;
                    loadJobs();
                    loadUsage();
                } else {
                    runStatus.textContent = `Error: ${data.detail || data.message}`;
                }
            } catch (err) {
                runStatus.textContent = `Request failed: ${err}`;
            } finally {
                runBtn.disabled = false;
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

    // Navigation Toggle
    if (navOverview) navOverview.addEventListener("click", () => { jobsSection.classList.remove("hidden"); setupSection.classList.add("hidden"); });
    if (navJobs) navJobs.addEventListener("click", () => { jobsSection.classList.remove("hidden"); setupSection.classList.add("hidden"); });
    if (navDrafts) navDrafts.addEventListener("click", () => { draftsSection.scrollIntoView({ behavior: 'smooth' }); });
    if (navSetup) navSetup.addEventListener("click", () => { setupSection.classList.remove("hidden"); jobsSection.classList.add("hidden"); });
    
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login.html";
        });
    }

    if (jobStatusFilter) jobStatusFilter.addEventListener("change", loadJobs);

    // Initial Load & Refresh Interval
    loadUsage();
    loadJobs();
    loadDrafts();
    setInterval(loadJobs, 5000);
});
