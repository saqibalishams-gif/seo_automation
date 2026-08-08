document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const urlQueueForm = document.getElementById("url-queue-form");
    const btnQueueUrl = document.getElementById("btn-queue-url");
    const urlQueueStatus = document.getElementById("url-queue-status");
    
    const userPlanPill = document.getElementById("user-plan-pill");
    const userQuotaPill = document.getElementById("user-quota-pill");
    const statPublished = document.getElementById("stat-published");
    const statDrafts = document.getElementById("stat-drafts");
    const statTemplates = document.getElementById("stat-templates");
    const statQuotaUsed = document.getElementById("stat-quota-used");
    
    const selectActiveTemplate = document.getElementById("select_active_template");
    const modeDefaultRadio = document.getElementById("mode-default-radio");
    const modeCustomRadio = document.getElementById("mode-custom-radio");
    
    // Template Builder Elements
    const builderTemplateName = document.getElementById("builder_template_name");
    const builderTemplateDesc = document.getElementById("builder_template_desc");
    const builderSectionsContainer = document.getElementById("builder-sections-container");
    const btnAddBuilderSection = document.getElementById("btn-add-builder-section");
    const btnSaveTemplate = document.getElementById("btn-save-template");
    const btnNewTemplate = document.getElementById("btn-new-template");
    const btnDuplicateTemplate = document.getElementById("btn-duplicate-template");
    
    // Image Manager Elements
    const imageUploadForm = document.getElementById("image-upload-form");
    const imageAssignForm = document.getElementById("image-assign-form");
    const assignImageId = document.getElementById("assign_image_id");
    const assignSectionId = document.getElementById("assign_section_id");
    const imageGalleryContainer = document.getElementById("image-gallery-container");

    // History & Tables
    const historyTbody = document.getElementById("history-tbody");
    const historySearchInput = document.getElementById("history_search_input");
    const btnDeleteAllHistory = document.getElementById("btn-delete-all-history");
    const historyContentWrapper = document.getElementById("history-content-wrapper");
    const navHistoryToggle = document.getElementById("nav-history-toggle");

    const jobsTbody = document.getElementById("jobs-tbody");
    const jobStatusFilter = document.getElementById("job-status-filter");
    const draftsContainer = document.getElementById("drafts-container");

    // Modals
    const previewModal = document.getElementById("preview-modal");
    const closePreviewModalBtn = document.getElementById("close-preview-modal-btn");
    const previewHtmlContent = document.getElementById("preview-html-content");
    const previewValidationBanner = document.getElementById("preview-validation-banner");
    
    const timelineModal = document.getElementById("timeline-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const modalJobTitle = document.getElementById("modal-job-title");
    const timelineEventsContainer = document.getElementById("timeline-events-container");
    
    const navAdmin = document.getElementById("nav-admin");
    const logoutBtn = document.getElementById("logout-btn");

    let currentTemplates = [];
    let activeTemplateId = null;

    // Load Usage & Templates
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

    async function loadTemplates() {
        try {
            const res = await fetch("/api/templates");
            const data = await res.json();
            if (!Array.isArray(data)) return;
            currentTemplates = data;
            if (statTemplates) statTemplates.textContent = data.length;

            selectActiveTemplate.innerHTML = data.map(t => `<option value="${t.id}">${t.name} ${t.is_default ? '(Default)' : ''}</option>`).join("");
            
            if (data.length > 0 && !activeTemplateId) {
                activeTemplateId = data[0].id;
                renderTemplateInBuilder(data[0]);
            }

            // Update assign_section_id dropdown
            updateSectionDropdowns();
        } catch (e) {
            console.error("Failed to load templates", e);
        }
    }

    function updateSectionDropdowns() {
        const activeTmpl = currentTemplates.find(t => t.id == activeTemplateId) || currentTemplates[0];
        if (!activeTmpl || !assignSectionId) return;

        assignSectionId.innerHTML = activeTmpl.sections.map(s => `<option value="${s.id}">${s.name} (ID: ${s.id})</option>`).join("");
    }

    function renderTemplateInBuilder(tmpl) {
        if (!tmpl) return;
        activeTemplateId = tmpl.id;
        builderTemplateName.value = tmpl.name;
        builderTemplateDesc.value = tmpl.description || "";

        builderSectionsContainer.innerHTML = tmpl.sections.map((s, idx) => `
            <div class="builder-section-card" data-sec-id="${s.id}" style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.08); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <strong style="color: var(--text-muted);">${idx + 1}.</strong>
                    <input type="text" class="sec-name-input" value="${s.name}" placeholder="Section Heading" style="font-weight: bold; flex: 2; padding: 6px;">
                    <span class="badge badge-info" style="font-family: monospace;">${s.id}</span>
                    <select class="sec-type-select" style="padding: 6px;">
                        <option value="paragraph" ${s.content_type === 'paragraph' ? 'selected' : ''}>Paragraph</option>
                        <option value="bullet_list" ${s.content_type === 'bullet_list' ? 'selected' : ''}>Bullet List</option>
                        <option value="table" ${s.content_type === 'table' ? 'selected' : ''}>Table</option>
                        <option value="faq" ${s.content_type === 'faq' ? 'selected' : ''}>FAQ</option>
                    </select>
                    <label style="font-size: 0.85rem;"><input type="checkbox" class="sec-req-check" ${s.required ? 'checked' : ''}> Required</label>
                    <button class="nav-btn delete-builder-sec-btn" style="color: #EF4444;">&times;</button>
                </div>
                <textarea class="sec-inst-input" placeholder="AI Instructions for this section..." style="width: 100%; margin-top: 8px; padding: 6px; font-size: 0.85rem; height: 45px;">${s.ai_instruction || ''}</textarea>
            </div>
        `).join("");

        document.querySelectorAll(".delete-builder-sec-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.target.closest(".builder-section-card").remove();
            });
        });
    }

    if (btnAddBuilderSection) {
        btnAddBuilderSection.addEventListener("click", () => {
            const secId = `sec-${Math.random().toString(36).substr(2, 9)}`;
            const count = builderSectionsContainer.children.length + 1;
            const newCard = document.createElement("div");
            newCard.className = "builder-section-card";
            newCard.setAttribute("data-sec-id", secId);
            newCard.style.cssText = "background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.08); padding: 12px; border-radius: 8px; margin-bottom: 8px;";
            newCard.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <strong style="color: var(--text-muted);">${count}.</strong>
                    <input type="text" class="sec-name-input" placeholder="New Section Heading" style="font-weight: bold; flex: 2; padding: 6px;">
                    <span class="badge badge-info" style="font-family: monospace;">${secId}</span>
                    <select class="sec-type-select" style="padding: 6px;">
                        <option value="paragraph">Paragraph</option>
                        <option value="bullet_list">Bullet List</option>
                        <option value="table">Table</option>
                        <option value="faq">FAQ</option>
                    </select>
                    <label style="font-size: 0.85rem;"><input type="checkbox" class="sec-req-check" checked> Required</label>
                    <button class="nav-btn delete-builder-sec-btn" style="color: #EF4444;">&times;</button>
                </div>
                <textarea class="sec-inst-input" placeholder="AI Instructions for this section..." style="width: 100%; margin-top: 8px; padding: 6px; font-size: 0.85rem; height: 45px;"></textarea>
            `;
            builderSectionsContainer.appendChild(newCard);
            newCard.querySelector(".delete-builder-sec-btn").addEventListener("click", () => newCard.remove());
        });
    }

    if (btnSaveTemplate) {
        btnSaveTemplate.addEventListener("click", async () => {
            const name = builderTemplateName.value.trim();
            if (!name) {
                alert("Please enter a template name");
                return;
            }
            const secCards = document.querySelectorAll(".builder-section-card");
            const sections = Array.from(secCards).map((card, idx) => ({
                id: card.getAttribute("data-sec-id"),
                name: card.querySelector(".sec-name-input").value.trim() || `Section ${idx + 1}`,
                order: idx + 1,
                required: card.querySelector(".sec-req-check").checked,
                content_type: card.querySelector(".sec-type-select").value,
                ai_instruction: card.querySelector(".sec-inst-input").value
            }));

            const payload = {
                name: name,
                description: builderTemplateDesc.value,
                mode: "custom",
                is_default: false,
                sections: sections
            };

            try {
                const res = await fetch("/api/templates", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                alert(data.message || "Template saved successfully!");
                loadTemplates();
            } catch (err) {
                alert("Failed to save template: " + err);
            }
        });
    }

    if (selectActiveTemplate) {
        selectActiveTemplate.addEventListener("change", (e) => {
            const tmpl = currentTemplates.find(t => t.id == e.target.value);
            if (tmpl) {
                renderTemplateInBuilder(tmpl);
                updateSectionDropdowns();
            }
        });
    }

    // Image Upload & Gallery
    async function loadImages() {
        try {
            const res = await fetch("/api/images");
            const assets = await res.json();
            if (!Array.isArray(assets)) return;

            assignImageId.innerHTML = assets.map(a => `<option value="${a.id}">${a.filename} (${a.width}x${a.height})</option>`).join("");

            if (assets.length === 0) {
                imageGalleryContainer.innerHTML = `<p style="color: var(--text-secondary);">No images uploaded yet.</p>`;
                return;
            }

            imageGalleryContainer.innerHTML = assets.map(a => `
                <div style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 8px; width: 140px; text-align: center;">
                    <img src="${a.url}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px;">
                    <div style="font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 4px;">${a.filename}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${a.width} × ${a.height}</div>
                </div>
            `).join("");
        } catch (e) {
            console.error("Failed to load images", e);
        }
    }

    if (imageUploadForm) {
        imageUploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append("file", document.getElementById("upload_image_file").files[0]);
            const w = document.getElementById("upload_width").value;
            const h = document.getElementById("upload_height").value;
            if (w) formData.append("target_width", w);
            if (h) formData.append("target_height", h);

            try {
                const res = await fetch("/api/images/upload", { method: "POST", body: formData });
                const data = await res.json();
                alert(data.message || "Image uploaded successfully!");
                loadImages();
            } catch (err) {
                alert("Upload failed: " + err);
            }
        });
    }

    if (imageAssignForm) {
        imageAssignForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                image_id: assignImageId.value,
                section_id: assignSectionId.value,
                position: document.getElementById("assign_position").value,
                alignment: document.getElementById("assign_alignment").value,
                fallback_behavior: document.getElementById("assign_fallback").value
            };

            try {
                const res = await fetch("/api/images/assign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                alert(data.message || "Image assignment saved!");
            } catch (err) {
                alert("Assignment failed: " + err);
            }
        });
    }

    // Article Drafts, Validation & Live Preview
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
                    <div style="display: flex; gap: 8px;">
                        <button class="nav-btn preview-draft-btn" data-id="${d.id}" style="color: #2563EB;">🔍 Validate & Preview</button>
                        <button class="btn-primary publish-draft-btn" data-id="${d.id}" style="padding: 8px 16px; font-size: 0.9rem;">🚀 Publish to WP</button>
                    </div>
                </div>
            `).join("");

            document.querySelectorAll(".preview-draft-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.target.getAttribute("data-id");
                    openPreviewModal(id);
                });
            });

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
                        loadHistory();
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

    async function openPreviewModal(draftId) {
        previewModal.classList.remove("hidden");
        previewHtmlContent.innerHTML = `<p style="color: gray;">Rendering article preview...</p>`;
        previewValidationBanner.innerHTML = "";

        try {
            // Run 12-Check Validation
            const valRes = await fetch("/api/content/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ draft_id: parseInt(draftId), template_id: activeTemplateId })
            });
            const valData = await valRes.json();

            let bannerBg = valData.is_valid ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)";
            let bannerColor = valData.is_valid ? "#047857" : "#B91C1C";
            previewValidationBanner.style.cssText = `background: ${bannerBg}; color: ${bannerColor}; border: 1px solid ${bannerColor}; padding: 12px; border-radius: 8px; margin-bottom: 1rem;`;
            previewValidationBanner.innerHTML = `
                <strong>${valData.is_valid ? 'READY TO PUBLISH' : 'VALIDATION ISSUES FOUND'} (${valData.checks_passed}/${valData.total_checks} Checks Passed)</strong>
                ${valData.errors.length > 0 ? `<ul style="margin-top: 6px; padding-left: 20px;">${valData.errors.map(err => `<li>${err}</li>`).join("")}</ul>` : ''}
            `;

            // Run Live Preview Render
            const prevRes = await fetch("/api/content/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ draft_id: parseInt(draftId) })
            });
            const prevData = await prevRes.json();
            previewHtmlContent.innerHTML = `<h1>${prevData.title}</h1>\n` + prevData.html_preview;
        } catch (e) {
            previewHtmlContent.innerHTML = `<p style="color: red;">Failed to load preview.</p>`;
        }
    }

    if (closePreviewModalBtn) {
        closePreviewModalBtn.addEventListener("click", () => previewModal.classList.add("hidden"));
    }

    // Collapsible History Panel
    async function loadHistory() {
        try {
            const query = historySearchInput ? historySearchInput.value : "";
            const res = await fetch(`/api/history?q=${encodeURIComponent(query)}`);
            const history = await res.json();
            if (!Array.isArray(history)) return;

            if (history.length === 0) {
                historyTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: rgba(0,0,0,0.5);">No history records found.</td></tr>`;
                return;
            }

            historyTbody.innerHTML = history.map(h => `
                <tr>
                    <td>#${h.id}</td>
                    <td><strong>${h.game_name}</strong> (${h.provider})</td>
                    <td><span class="badge ${h.status === 'Published' ? 'badge-success' : 'badge-danger'}">${h.status}</span></td>
                    <td>${h.article_id ? `#${h.article_id}` : '--'}</td>
                    <td>${h.published_at || '--'}</td>
                    <td>
                        <button class="nav-btn retry-hist-btn" data-id="${h.id}" style="color: #2563EB;">🔄 Retry</button>
                        <button class="nav-btn delete-hist-btn" data-id="${h.id}" style="color: #EF4444;">🗑 Delete</button>
                    </td>
                </tr>
            `).join("");

            document.querySelectorAll(".delete-hist-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.target.getAttribute("data-id");
                    if (confirm("Delete this history entry? (Note: WordPress article will NOT be deleted)")) {
                        await fetch(`/api/history/${id}`, { method: "DELETE" });
                        loadHistory();
                    }
                });
            });

            document.querySelectorAll(".retry-hist-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.target.getAttribute("data-id");
                    const res = await fetch(`/api/history/${id}/retry`, { method: "POST" });
                    const data = await res.json();
                    alert(data.message || "Retry job enqueued!");
                    loadJobs();
                });
            });
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }

    if (historySearchInput) historySearchInput.addEventListener("input", loadHistory);
    if (btnDeleteAllHistory) {
        btnDeleteAllHistory.addEventListener("click", async () => {
            if (confirm("Are you sure you want to delete ALL history entries?")) {
                await fetch("/api/history/bulk-delete?delete_all=true", { method: "POST" });
                loadHistory();
            }
        });
    }

    if (navHistoryToggle) {
        let collapsed = false;
        navHistoryToggle.addEventListener("click", () => {
            collapsed = !collapsed;
            if (collapsed) {
                historyContentWrapper.style.display = "none";
                navHistoryToggle.textContent = "📜 History [+]";
            } else {
                historyContentWrapper.style.display = "block";
                navHistoryToggle.textContent = "📜 History [-]";
            }
        });
    }

    // Load Jobs
    async function loadJobs() {
        try {
            const filter = jobStatusFilter ? jobStatusFilter.value : "ALL";
            const res = await fetch(`/api/user/jobs?status_filter=${filter}`);
            const jobs = await res.json();
            if (!Array.isArray(jobs)) return;

            if (jobs.length === 0) {
                jobsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: rgba(0,0,0,0.5);">No active jobs found.</td></tr>`;
                return;
            }

            jobsTbody.innerHTML = jobs.map(j => `
                <tr>
                    <td><strong>${j.job_id}</strong></td>
                    <td>${j.provider} - ${j.game_name}</td>
                    <td><span class="badge ${j.status === 'FAILED' ? 'badge-danger' : 'badge-success'}">${j.status}</span></td>
                    <td><code style="background: rgba(0,0,0,0.06); padding: 3px 8px; border-radius: 4px;">${j.current_stage || 'QUEUED'}</code></td>
                    <td>${j.duration ? j.duration.toFixed(1) + 's' : '--'}</td>
                    <td>
                        <button class="nav-btn view-timeline-btn" data-job-id="${j.job_id}" style="color: #2563EB;">🔍 View Timeline</button>
                    </td>
                </tr>
            `).join("");

            document.querySelectorAll(".view-timeline-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    openTimelineModal(e.target.getAttribute("data-job-id"));
                });
            });
        } catch (e) {
            console.error("Failed to load jobs", e);
        }
    }

    async function openTimelineModal(jobId) {
        modalJobTitle.textContent = `Job Event Timeline (${jobId})`;
        timelineEventsContainer.innerHTML = `<p style="color: gray;">Loading timeline events...</p>`;
        timelineModal.classList.remove("hidden");

        try {
            const res = await fetch(`/api/user/jobs/${jobId}/timeline`);
            const data = await res.json();
            if (!data.timeline || data.timeline.length === 0) {
                timelineEventsContainer.innerHTML = `<p style="color: gray;">No events recorded.</p>`;
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

    if (closeModalBtn) closeModalBtn.addEventListener("click", () => timelineModal.classList.add("hidden"));

    // Check Role
    async function checkRole() {
        try {
            const res = await fetch("/api/admin/stats");
            if (res.ok && navAdmin) {
                navAdmin.classList.remove("hidden");
                navAdmin.addEventListener("click", () => window.location.href = "/admin");
            }
        } catch (e) {}
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login.html";
        });
    }

    // Initial Loads & Automatic Polling
    loadUsage();
    loadTemplates();
    loadImages();
    loadDrafts();
    loadJobs();
    loadHistory();
    checkRole();

    setInterval(() => {
        loadJobs();
        loadHistory();
    }, 5000);
});
