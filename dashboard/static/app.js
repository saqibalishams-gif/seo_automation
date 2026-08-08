document.addEventListener("DOMContentLoaded", () => {
    // LocalStorage Collapse Preference Key
    const STORAGE_KEY_PANELS = "seo_app_panel_states_v2";

    // DOM Elements - Stepper Workflow
    const workflowStepContents = document.querySelectorAll(".workflow-step-content");
    const stepItems = document.querySelectorAll(".step-item");
    const btnNextSteps = document.querySelectorAll(".btn-next-step");
    const btnPrevSteps = document.querySelectorAll(".btn-prev-step");

    // Navigation Buttons
    const navHome = document.getElementById("nav-home");
    const navCreate = document.getElementById("nav-create");
    const navTemplates = document.getElementById("nav-templates");
    const navMedia = document.getElementById("nav-media");
    const navHistory = document.getElementById("nav-history");
    const navSettings = document.getElementById("nav-settings");
    const navAdmin = document.getElementById("nav-admin");
    const devModeCheckbox = document.getElementById("dev-mode-checkbox");
    const devModeDrawer = document.getElementById("dev-mode-drawer");
    const devUuidLookupContainer = document.getElementById("dev-uuid-lookup-container");
    const logoutBtn = document.getElementById("logout-btn");

    // Collapsible Panel Elements
    const collapsiblePanels = document.querySelectorAll(".collapsible-panel");
    const btnExpandAll = document.getElementById("btn-expand-all");
    const btnCollapseAll = document.getElementById("btn-collapse-all");

    // Format Mode Elements
    const cardFormatDefault = document.getElementById("card-format-default");
    const cardFormatCustom = document.getElementById("card-format-custom");
    const customBuilderView = document.getElementById("custom-builder-view");
    const customSectionsList = document.getElementById("custom-sections-list");
    const btnAddSectionUi = document.getElementById("btn-add-section-ui");

    // Step 3 Image Manager
    const step3ImageFile = document.getElementById("step3_image_file");
    const step3SectionSelect = document.getElementById("step3_section_select");
    const step3PositionSelect = document.getElementById("step3_position_select");
    const step3SizeSelect = document.getElementById("step3_size_select");
    const step3AlignSelect = document.getElementById("step3_align_select");
    const btnSaveStep3Image = document.getElementById("btn-save-step3-image");
    const assignedImagesVisualList = document.getElementById("assigned-images-visual-list");
    const structureTreeDiagram = document.getElementById("structure-tree-diagram");

    // Step 5 & 6 Preview / Publish
    const step5PreviewRendered = document.getElementById("step5-preview-rendered");
    const step6ValidationCard = document.getElementById("step6-validation-card");
    const btnFinalPublish = document.getElementById("btn-final-publish");

    // Section Editor Modal
    const sectionEditorModal = document.getElementById("section-editor-modal");
    const closeSecModalBtn = document.getElementById("close-sec-modal-btn");
    const editSecName = document.getElementById("edit_sec_name");
    const editSecInstruction = document.getElementById("edit_sec_instruction");
    const editSecType = document.getElementById("edit_sec_type");
    const editSecReq = document.getElementById("edit_sec_req");
    const btnSaveSectionModal = document.getElementById("btn-save-section-modal");

    // Global App State
    let activeStep = 1;
    let selectedFormatMode = "default";
    let userTemplates = [];
    let activeTemplate = null;
    let currentEditingSecCard = null;
    let userImages = [];
    let imageAssignments = [];

    // --- 1. GUIDED WORKFLOW STEPPER MANAGER ---

    function goToStep(stepNum) {
        activeStep = parseInt(stepNum);
        stepItems.forEach(item => {
            const num = parseInt(item.getAttribute("data-step"));
            item.classList.toggle("active", num === activeStep);
        });

        workflowStepContents.forEach(content => {
            content.classList.add("hidden");
        });

        const targetContent = document.getElementById(`workflow-step-${activeStep}`);
        if (targetContent) targetContent.classList.remove("hidden");

        // Specific actions on step entry
        if (activeStep === 3) {
            loadStep3Data();
        } else if (activeStep === 5) {
            renderStep5Preview();
        } else if (activeStep === 6) {
            renderStep6Validation();
        }
    }

    stepItems.forEach(item => {
        item.addEventListener("click", () => {
            const stepNum = item.getAttribute("data-step");
            goToStep(stepNum);
        });
    });

    btnNextSteps.forEach(btn => {
        btn.addEventListener("click", () => {
            const next = btn.getAttribute("data-next");
            goToStep(next);
        });
    });

    btnPrevSteps.forEach(btn => {
        btn.addEventListener("click", () => {
            const prev = btn.getAttribute("data-prev");
            goToStep(prev);
        });
    });

    // --- 2. COLLAPSIBLE PANELS WITH LOCALSTORAGE MEMORY ---

    function getPanelStates() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_PANELS)) || {};
        } catch (e) {
            return {};
        }
    }

    function savePanelState(panelId, isCollapsed) {
        const states = getPanelStates();
        states[panelId] = isCollapsed;
        localStorage.setItem(STORAGE_KEY_PANELS, JSON.stringify(states));
    }

    function applyPanelStates() {
        const states = getPanelStates();
        collapsiblePanels.forEach(panel => {
            const toggleBtn = panel.querySelector(".btn-toggle-panel");
            const targetId = toggleBtn ? toggleBtn.getAttribute("data-target") : null;
            const body = targetId ? document.getElementById(targetId) : null;
            if (!body) return;

            const isCollapsed = !!states[panel.id];
            if (isCollapsed) {
                body.style.display = "none";
                toggleBtn.textContent = "[ + ]";
            } else {
                body.style.display = "block";
                toggleBtn.textContent = "[ − ]";
            }
        });
    }

    collapsiblePanels.forEach(panel => {
        const toggleBtn = panel.querySelector(".btn-toggle-panel");
        if (!toggleBtn) return;
        toggleBtn.addEventListener("click", () => {
            const targetId = toggleBtn.getAttribute("data-target");
            const body = document.getElementById(targetId);
            if (!body) return;

            const isCurrentlyCollapsed = body.style.display === "none";
            if (isCurrentlyCollapsed) {
                body.style.display = "block";
                toggleBtn.textContent = "[ − ]";
                savePanelState(panel.id, false);
            } else {
                body.style.display = "none";
                toggleBtn.textContent = "[ + ]";
                savePanelState(panel.id, true);
            }
        });
    });

    if (btnExpandAll) {
        btnExpandAll.addEventListener("click", () => {
            collapsiblePanels.forEach(panel => {
                const toggleBtn = panel.querySelector(".btn-toggle-panel");
                const targetId = toggleBtn ? toggleBtn.getAttribute("data-target") : null;
                const body = targetId ? document.getElementById(targetId) : null;
                if (body) {
                    body.style.display = "block";
                    if (toggleBtn) toggleBtn.textContent = "[ − ]";
                    savePanelState(panel.id, false);
                }
            });
        });
    }

    if (btnCollapseAll) {
        btnCollapseAll.addEventListener("click", () => {
            collapsiblePanels.forEach(panel => {
                const toggleBtn = panel.querySelector(".btn-toggle-panel");
                const targetId = toggleBtn ? toggleBtn.getAttribute("data-target") : null;
                const body = targetId ? document.getElementById(targetId) : null;
                if (body) {
                    body.style.display = "none";
                    if (toggleBtn) toggleBtn.textContent = "[ + ]";
                    savePanelState(panel.id, true);
                }
            });
        });
    }

    // --- 3. FORMAT SELECTION & TEMPLATES ---

    cardFormatDefault.addEventListener("click", () => {
        selectedFormatMode = "default";
        cardFormatDefault.classList.add("selected");
        cardFormatCustom.classList.remove("selected");
        customBuilderView.classList.add("hidden");
    });

    cardFormatCustom.addEventListener("click", () => {
        selectedFormatMode = "custom";
        cardFormatCustom.classList.add("selected");
        cardFormatDefault.classList.remove("selected");
        customBuilderView.classList.remove("hidden");
    });

    async function loadTemplates() {
        try {
            const res = await fetch("/api/templates");
            const data = await res.json();
            if (!Array.isArray(data)) return;
            userTemplates = data;
            activeTemplate = data.find(t => t.is_default) || data[0];
            renderCustomSectionsList(activeTemplate);
            updateDevDiagnostics();
        } catch (e) {
            console.error("Failed to load templates", e);
        }
    }

    function renderCustomSectionsList(tmpl) {
        if (!tmpl || !customSectionsList) return;
        customSectionsList.innerHTML = tmpl.sections.map((s, idx) => `
            <div class="custom-sec-row" data-sec-id="${s.id}" data-name="${s.name}" data-type="${s.content_type || 'paragraph'}" data-instruction="${s.ai_instruction || ''}" data-req="${s.required ? 'true' : 'false'}" style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.08);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong style="color: var(--text-muted);">${idx + 1}.</strong>
                    <span style="font-weight: 700; color: var(--text-primary);">${s.name}</span>
                    <span class="badge badge-info" style="text-transform: capitalize;">${s.content_type || 'paragraph'}</span>
                    ${s.required ? '<span class="badge badge-success">Required</span>' : ''}
                </div>
                <div style="display: flex; gap: 6px;">
                    <button class="btn-secondary-sm edit-sec-btn">Edit</button>
                    <button class="btn-secondary-sm del-sec-btn" style="color: #EF4444;">Delete</button>
                </div>
            </div>
        `).join("");

        document.querySelectorAll(".edit-sec-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const row = e.target.closest(".custom-sec-row");
                openSectionModal(row);
            });
        });

        document.querySelectorAll(".del-sec-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.target.closest(".custom-sec-row").remove();
            });
        });
    }

    function openSectionModal(rowCard) {
        currentEditingSecCard = rowCard;
        if (rowCard) {
            editSecName.value = rowCard.getAttribute("data-name") || "";
            editSecInstruction.value = rowCard.getAttribute("data-instruction") || "";
            editSecType.value = rowCard.getAttribute("data-type") || "paragraph";
            editSecReq.checked = rowCard.getAttribute("data-req") === "true";
        } else {
            editSecName.value = "";
            editSecInstruction.value = "";
            editSecType.value = "paragraph";
            editSecReq.checked = true;
        }
        sectionEditorModal.classList.remove("hidden");
    }

    if (btnAddSectionUi) {
        btnAddSectionUi.addEventListener("click", () => openSectionModal(null));
    }

    if (closeSecModalBtn) {
        closeSecModalBtn.addEventListener("click", () => sectionEditorModal.classList.add("hidden"));
    }

    if (btnSaveSectionModal) {
        btnSaveSectionModal.addEventListener("click", () => {
            const name = editSecName.value.trim();
            if (!name) {
                alert("Please enter a section name");
                return;
            }
            if (currentEditingSecCard) {
                currentEditingSecCard.setAttribute("data-name", name);
                currentEditingSecCard.setAttribute("data-instruction", editSecInstruction.value);
                currentEditingSecCard.setAttribute("data-type", editSecType.value);
                currentEditingSecCard.setAttribute("data-req", editSecReq.checked ? "true" : "false");
                currentEditingSecCard.querySelector("span:nth-child(2)").textContent = name;
            } else {
                const secId = `sec-${Math.random().toString(36).substr(2, 9)}`;
                const count = customSectionsList.children.length + 1;
                const newRow = document.createElement("div");
                newRow.className = "custom-sec-row";
                newRow.setAttribute("data-sec-id", secId);
                newRow.setAttribute("data-name", name);
                newRow.setAttribute("data-type", editSecType.value);
                newRow.setAttribute("data-instruction", editSecInstruction.value);
                newRow.setAttribute("data-req", editSecReq.checked ? "true" : "false");
                newRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.08);";
                newRow.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong style="color: var(--text-muted);">${count}.</strong>
                        <span style="font-weight: 700; color: var(--text-primary);">${name}</span>
                        <span class="badge badge-info" style="text-transform: capitalize;">${editSecType.value}</span>
                        ${editSecReq.checked ? '<span class="badge badge-success">Required</span>' : ''}
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-secondary-sm edit-sec-btn">Edit</button>
                        <button class="btn-secondary-sm del-sec-btn" style="color: #EF4444;">Delete</button>
                    </div>
                `;
                customSectionsList.appendChild(newRow);
                newRow.querySelector(".edit-sec-btn").addEventListener("click", () => openSectionModal(newRow));
                newRow.querySelector(".del-sec-btn").addEventListener("click", () => newRow.remove());
            }
            sectionEditorModal.classList.add("hidden");
        });
    }

    // --- 4. STEP 3 IMAGE MANAGER & VISUALIZATION ---

    async function loadStep3Data() {
        if (!activeTemplate || !activeTemplate.sections) return;

        // Populate human-readable section dropdown
        step3SectionSelect.innerHTML = activeTemplate.sections.map(s => `
            <option value="${s.id}">${s.name}</option>
        `).join("");

        loadVisualImageAssignments();
    }

    async function loadVisualImageAssignments() {
        try {
            const res = await fetch("/api/images/assignments");
            const data = await res.json();
            if (!Array.isArray(data)) return;
            imageAssignments = data;

            if (data.length === 0) {
                assignedImagesVisualList.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.9rem;">No images assigned to sections yet.</p>`;
            } else {
                assignedImagesVisualList.innerHTML = data.map(a => `
                    <div class="assigned-img-card">
                        <img src="${a.url}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;">
                        <div style="flex: 1;">
                            <strong style="font-size: 0.9rem; color: var(--text-primary);">${a.filename}</strong>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                Assigned to <strong>${a.section_name}</strong> • ${a.position.replace('_', ' ')}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${a.size} • ${a.alignment}</div>
                        </div>
                    </div>
                `).join("");
            }

            renderStructureTree();
        } catch (e) {
            console.error("Failed to load image assignments", e);
        }
    }

    function renderStructureTree() {
        if (!activeTemplate || !activeTemplate.sections || !structureTreeDiagram) return;

        structureTreeDiagram.innerHTML = activeTemplate.sections.map(s => {
            const assigned = imageAssignments.filter(a => a.section_id === s.id);
            return `
                <div class="tree-node">
                    <strong style="color: var(--text-primary);">${s.name}</strong>
                    ${assigned.map(a => `
                        <div style="font-size: 0.8rem; color: #2563EB; margin-left: 12px; margin-top: 2px;">
                            🖼 ${a.filename} (${a.position.replace('_', ' ')})
                        </div>
                    `).join("")}
                </div>
            `;
        }).join("");
    }

    if (btnSaveStep3Image) {
        btnSaveStep3Image.addEventListener("click", async () => {
            if (step3ImageFile.files.length === 0) {
                alert("Please select an image file to upload");
                return;
            }

            const formData = new FormData();
            formData.append("file", step3ImageFile.files[0]);

            try {
                const upRes = await fetch("/api/images/upload", { method: "POST", body: formData });
                const upData = await upRes.json();
                
                if (!upData.image_id) {
                    alert("Image upload failed");
                    return;
                }

                // Assign image to section
                const assignPayload = {
                    image_id: upData.image_id,
                    section_id: step3SectionSelect.value,
                    position: step3PositionSelect.value,
                    size: step3SizeSelect.value,
                    alignment: step3AlignSelect.value,
                    fallback_behavior: "do_not_publish"
                };

                const aRes = await fetch("/api/images/assign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(assignPayload)
                });
                const aData = await aRes.json();

                alert("Image uploaded and assigned to section!");
                step3ImageFile.value = "";
                loadVisualImageAssignments();
            } catch (e) {
                alert("Failed to save image placement: " + e);
            }
        });
    }

    // --- 5. STEP 5 PREVIEW & STEP 6 PUBLISH ---

    async function renderStep5Preview() {
        step5PreviewRendered.innerHTML = `<p style="color: gray;">Rendering article preview...</p>`;
        try {
            const docPayload = {
                title: "Article Live Preview",
                seo_metadata: { focus_keyword: "Preview Keyword", meta_description: "Live preview" },
                introduction: "Sample introduction text for article preview.",
                sections: activeTemplate ? activeTemplate.sections.map(s => ({
                    section_id: s.id,
                    heading: s.name,
                    content: `Sample content for section ${s.name}.`
                })) : [],
                conclusion: "Sample conclusion text."
            };

            const res = await fetch("/api/content/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ document: docPayload })
            });
            const data = await res.json();
            step5PreviewRendered.innerHTML = `<h1>${data.title}</h1>\n` + data.html_preview;
        } catch (e) {
            step5PreviewRendered.innerHTML = `<p style="color: red;">Failed to render preview.</p>`;
        }
    }

    async function renderStep6Validation() {
        step6ValidationCard.innerHTML = `<p style="color: gray;">Running 12-Check Pre-Publishing Validation...</p>`;
        try {
            const docPayload = {
                title: "Article Validation Test",
                seo_metadata: { focus_keyword: "Validation Keyword", meta_description: "Validation text long enough to pass check." },
                introduction: "Comprehensive introduction text exceeding validation minimum length requirement.",
                sections: activeTemplate ? activeTemplate.sections.map(s => ({
                    section_id: s.id,
                    heading: s.name,
                    content: `Detailed section content for ${s.name}.`
                })) : [],
                conclusion: "Conclusion text."
            };

            const res = await fetch("/api/content/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ document: docPayload, template_id: activeTemplate ? activeTemplate.id : null })
            });
            const data = await res.json();

            let bg = data.is_valid ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)";
            let color = data.is_valid ? "#047857" : "#B45309";
            step6ValidationCard.style.cssText = `background: ${bg}; color: ${color}; border: 1px solid ${color}; padding: 16px; border-radius: 12px;`;
            step6ValidationCard.innerHTML = `
                <h4 style="margin: 0 0 6px 0;">${data.is_valid ? '✅ PRE-PUBLISHING VALIDATION PASSED' : '⚠️ PRE-PUBLISHING WARNINGS'}</h4>
                <div><strong>${data.checks_passed} / ${data.total_checks} Checks Passed</strong></div>
                ${data.errors.length > 0 ? `<ul style="margin-top: 8px; padding-left: 20px; font-size: 0.85rem;">${data.errors.map(err => `<li>${err}</li>`).join("")}</ul>` : ''}
            `;
        } catch (e) {
            step6ValidationCard.innerHTML = `<p style="color: red;">Failed to run validation.</p>`;
        }
    }

    if (btnFinalPublish) {
        btnFinalPublish.addEventListener("click", async () => {
            const url = document.getElementById("input_target_url").value;
            if (!url) {
                alert("Please enter a Target Page / Game URL in Step 1!");
                goToStep(1);
                return;
            }

            btnFinalPublish.disabled = true;
            btnFinalPublish.textContent = "🚀 Submitting Automation Job...";

            const formData = new FormData();
            formData.append("url", url);
            formData.append("game_name", document.getElementById("input_game_name").value);
            formData.append("provider", document.getElementById("input_provider").value);
            formData.append("market", document.getElementById("input_market").value);

            try {
                const res = await fetch("/api/links", { method: "POST", body: formData });
                const data = await res.json();
                alert(data.message || "Job queued successfully!");
                goToStep(1);
                loadJobs();
            } catch (e) {
                alert("Submission failed: " + e);
            } finally {
                btnFinalPublish.disabled = false;
                btnFinalPublish.textContent = "🚀 Start Automation & Publish to WordPress";
            }
        });
    }

    // --- 6. DEVELOPER MODE DIAGNOSTICS ---

    if (devModeCheckbox) {
        devModeCheckbox.addEventListener("change", () => {
            if (devModeCheckbox.checked) {
                devModeDrawer.classList.remove("hidden");
                updateDevDiagnostics();
            } else {
                devModeDrawer.classList.add("hidden");
            }
        });
    }

    function updateDevDiagnostics() {
        if (!devUuidLookupContainer || !activeTemplate) return;
        devUuidLookupContainer.innerHTML = `
            <strong>Active Template ID:</strong> ${activeTemplate.id}<br/>
            <strong>Internal UUID Section Mappings:</strong><br/>
            ${activeTemplate.sections.map(s => `• ${s.name} ➔ <code>${s.id}</code>`).join("<br/>")}
        `;
    }

    // --- 7. NAVIGATION CONTROLS ---

    function setActiveNav(btn) {
        [navHome, navCreate, navTemplates, navMedia, navHistory, navSettings, navAdmin].forEach(b => {
            if (b) b.classList.remove("active");
        });
        if (btn) btn.classList.add("active");
    }

    function expandAndScrollTo(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        panel.classList.remove("hidden");
        const body = panel.querySelector(".panel-body");
        const toggleBtn = panel.querySelector(".btn-toggle-panel");
        if (body) body.style.display = "block";
        if (toggleBtn) toggleBtn.textContent = "[ − ]";
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (navHome) navHome.addEventListener("click", () => {
        setActiveNav(navHome);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
    if (navCreate) navCreate.addEventListener("click", () => {
        setActiveNav(navCreate);
        goToStep(1);
        document.getElementById("workflow-container").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (navTemplates) navTemplates.addEventListener("click", () => {
        setActiveNav(navTemplates);
        expandAndScrollTo("panel-templates");
    });
    if (navMedia) navMedia.addEventListener("click", () => {
        setActiveNav(navMedia);
        goToStep(3);
        document.getElementById("workflow-container").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (navHistory) navHistory.addEventListener("click", () => {
        setActiveNav(navHistory);
        expandAndScrollTo("panel-history");
    });
    if (navSettings) navSettings.addEventListener("click", () => {
        setActiveNav(navSettings);
        expandAndScrollTo("panel-setup");
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login.html";
        });
    }

    // Data Loaders
    async function loadUsage() {
        try {
            const res = await fetch("/api/user/usage");
            if (res.status === 401) { window.location.href = "/login.html"; return; }
            const data = await res.json();
            if (data.plan) {
                document.getElementById("user-plan-pill").textContent = `Plan: ${data.plan}`;
                document.getElementById("user-quota-pill").textContent = `Quota: ${data.monthly_usage} / ${data.article_limit}`;
                document.getElementById("stat-published").textContent = data.published_count || 0;
                document.getElementById("stat-drafts").textContent = data.total_drafts || 0;
                document.getElementById("stat-quota-used").textContent = `${data.usage_percentage}%`;
                document.getElementById("badge-drafts-count").textContent = `${data.total_drafts || 0} Drafts`;
            }
        } catch (e) {}
    }

    async function loadJobs() {
        try {
            const res = await fetch("/api/user/jobs?status_filter=ALL");
            const jobs = await res.json();
            if (!Array.isArray(jobs)) return;
            const running = jobs.filter(j => j.status === 'PROCESSING' || j.status === 'QUEUED').length;
            document.getElementById("badge-jobs-running").textContent = `${running} Running`;

            const tbody = document.getElementById("jobs-tbody");
            if (jobs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: rgba(0,0,0,0.5);">No active jobs found.</td></tr>`;
                return;
            }
            tbody.innerHTML = jobs.map(j => `
                <tr>
                    <td><strong>${j.job_id}</strong></td>
                    <td>${j.provider} - ${j.game_name}</td>
                    <td><span class="badge ${j.status === 'FAILED' ? 'badge-danger' : 'badge-success'}">${j.status}</span></td>
                    <td><code style="background: rgba(0,0,0,0.06); padding: 3px 8px; border-radius: 4px;">${j.current_stage || 'QUEUED'}</code></td>
                    <td>${j.duration ? j.duration.toFixed(1) + 's' : '--'}</td>
                    <td><button class="btn-secondary-sm view-timeline-btn" data-job-id="${j.job_id}">Timeline</button></td>
                </tr>
            `).join("");
        } catch (e) {}
    }

    // Init Page
    applyPanelStates();
    loadUsage();
    loadTemplates();
    loadJobs();
    setInterval(loadJobs, 5000);
});
