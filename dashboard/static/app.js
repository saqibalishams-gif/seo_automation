document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements — Navigation Views
    const tabViews = document.querySelectorAll(".tab-view");
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

    // Stepper Elements
    const workflowStepContents = document.querySelectorAll(".workflow-step-content");
    const stepItems = document.querySelectorAll(".step-item");
    const btnNextSteps = document.querySelectorAll(".btn-next-step");
    const btnPrevSteps = document.querySelectorAll(".btn-prev-step");

    // Format Cards Elements
    const cardFormatDefault = document.getElementById("card-format-default");
    const cardFormatCustom = document.getElementById("card-format-custom");
    const customBuilderView = document.getElementById("custom-builder-view");
    const customSectionsList = document.getElementById("custom-sections-list");
    const btnAddSectionUi = document.getElementById("btn-add-section-ui");

    // Step 3 Image Manager Elements
    const step3ImageFile = document.getElementById("step3_image_file");
    const step3SectionSelect = document.getElementById("step3_section_select");
    const step3PositionSelect = document.getElementById("step3_position_select");
    const step3SizeSelect = document.getElementById("step3_size_select");
    const step3AlignSelect = document.getElementById("step3_align_select");
    const btnSaveStep3Image = document.getElementById("btn-save-step3-image");
    const assignedImagesVisualList = document.getElementById("assigned-images-visual-list");
    const structureTreeDiagram = document.getElementById("structure-tree-diagram");

    // Step 5 & 6 Preview & Publish
    const step5PreviewRendered = document.getElementById("step5-preview-rendered");
    const step6ValidationCard = document.getElementById("step6-validation-card");
    const btnFinalPublish = document.getElementById("btn-final-publish");

    // Section Editor Modal Elements
    const sectionEditorModal = document.getElementById("section-editor-modal");
    const closeSecModalBtn = document.getElementById("close-sec-modal-btn");
    const editSecName = document.getElementById("edit_sec_name");
    const editSecInstruction = document.getElementById("edit_sec_instruction");
    const editSecType = document.getElementById("edit_sec_type");
    const editSecReq = document.getElementById("edit_sec_req");
    const btnSaveSectionModal = document.getElementById("btn-save-section-modal");

    // Global State
    let activeStep = 1;
    let selectedFormatMode = "default";
    let userTemplates = [];
    let activeTemplate = null;
    let persistentActiveFormat = { mode: "default", template_id: null, template_name: "Default SEO Format" };
    let currentEditingSecCard = null;
    let imageAssignments = [];

    // --- Active Format & Database Memory Loader ---
    async function loadActiveFormat() {
        try {
            const res = await fetch("/api/user/active-format");
            const data = await res.json();
            if (data.mode) {
                persistentActiveFormat = data;
                selectedFormatMode = data.mode;
                
                const activeTitle = document.getElementById("active-format-title");
                if (activeTitle) {
                    if (data.mode === "custom" && data.template_name) {
                        activeTitle.textContent = `🛠 Custom Format: ${data.template_name}`;
                    } else {
                        activeTitle.textContent = `⚡ Default SEO Format`;
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load active format", e);
        }
    }

    // Change Format Modal Handlers
    const btnOpenChangeFormat = document.getElementById("btn-open-change-format");
    const changeFormatModal = document.getElementById("change-format-modal");
    const closeFormatModalBtn = document.getElementById("close-format-modal-btn");
    const modalSavedTemplateSelect = document.getElementById("modal_saved_template_select");
    const btnApplyFormatModal = document.getElementById("btn-apply-format-modal");
    const btnResetFormatDefault = document.getElementById("btn-reset-format-default");

    if (btnOpenChangeFormat) {
        btnOpenChangeFormat.addEventListener("click", async () => {
            if (userTemplates.length === 0) await loadTemplates();
            
            if (modalSavedTemplateSelect) {
                modalSavedTemplateSelect.innerHTML = userTemplates.map(t => `
                    <option value="${t.id}">${t.name} ${t.is_default ? '(Default)' : ''}</option>
                `).join("");
            }
            changeFormatModal.classList.remove("hidden");
        });
    }

    if (closeFormatModalBtn) {
        closeFormatModalBtn.addEventListener("click", () => changeFormatModal.classList.add("hidden"));
    }

    if (btnApplyFormatModal) {
        btnApplyFormatModal.addEventListener("click", async () => {
            const modeRadios = document.getElementsByName("modal_format_mode");
            let chosenMode = "default";
            for (const r of modeRadios) {
                if (r.checked) chosenMode = r.value;
            }

            const tmplId = chosenMode === "custom" ? parseInt(modalSavedTemplateSelect.value) : null;
            const prefRadios = document.getElementsByName("modal_usage_pref");
            let saveAsActive = true;
            for (const r of prefRadios) {
                if (r.checked) saveAsActive = (r.value === "active");
            }

            if (saveAsActive) {
                try {
                    await fetch("/api/user/active-format", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ mode: chosenMode, template_id: tmplId, save_as_active: true })
                    });
                    alert("Active format saved permanently to database!");
                } catch (e) {
                    alert("Failed to save format preference: " + e);
                }
            } else {
                alert("Format applied for current article only.");
            }

            selectedFormatMode = chosenMode;
            if (chosenMode === "custom" && tmplId) {
                activeTemplate = userTemplates.find(t => t.id === tmplId) || activeTemplate;
            }
            changeFormatModal.classList.add("hidden");
            loadActiveFormat();
        });
    }

    if (btnResetFormatDefault) {
        btnResetFormatDefault.addEventListener("click", async () => {
            if (confirm("Reset active format to Default SEO Format? This will be used automatically for all future articles.")) {
                try {
                    await fetch("/api/user/active-format", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ mode: "default", template_id: null, save_as_active: true })
                    });
                    alert("Reset to Default SEO Format.");
                    selectedFormatMode = "default";
                    changeFormatModal.classList.add("hidden");
                    loadActiveFormat();
                } catch (e) {
                    alert("Reset failed: " + e);
                }
            }
        });
    }

    // --- 1. CLEAN TABBED VIEW SWITCHER ---

    function switchTab(viewName, navBtn) {
        tabViews.forEach(v => v.classList.add("hidden"));
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) targetView.classList.remove("hidden");

        [navHome, navCreate, navTemplates, navMedia, navHistory, navSettings, navAdmin].forEach(b => {
            if (b) b.classList.remove("active");
        });
        if (navBtn) navBtn.classList.add("active");

        window.scrollTo({ top: 0, behavior: "smooth" });

        // Trigger specific view loaders
        if (viewName === "home") {
            loadUsage();
            loadJobsHome();
        } else if (viewName === "create") {
            goToStep(1);
        } else if (viewName === "templates") {
            loadTemplates();
        } else if (viewName === "media") {
            loadMediaGallery();
        } else if (viewName === "history") {
            loadHistory();
        } else if (viewName === "settings") {
            loadSettings();
        }
    }

    if (navHome) navHome.addEventListener("click", () => switchTab("home", navHome));
    if (navCreate) navCreate.addEventListener("click", () => switchTab("create", navCreate));
    if (navTemplates) navTemplates.addEventListener("click", () => switchTab("templates", navTemplates));
    if (navMedia) navMedia.addEventListener("click", () => switchTab("media", navMedia));
    if (navHistory) navHistory.addEventListener("click", () => switchTab("history", navHistory));
    if (navSettings) navSettings.addEventListener("click", () => switchTab("settings", navSettings));

    // --- 2. GUIDED WORKFLOW STEPPER MANAGER ---

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

    // Quick Form on Home View
    const urlQueueFormHome = document.getElementById("url-queue-form-home");
    if (urlQueueFormHome) {
        urlQueueFormHome.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append("url", document.getElementById("home_input_url").value);
            formData.append("game_name", document.getElementById("home_input_game").value);
            formData.append("provider", document.getElementById("home_input_provider").value);
            formData.append("market", document.getElementById("home_input_market").value);

            try {
                const res = await fetch("/api/links", { method: "POST", body: formData });
                const data = await res.json();
                alert(data.message || "Job queued successfully!");
                document.getElementById("home_input_url").value = "";
                loadJobsHome();
            } catch (err) {
                alert("Queueing failed: " + err);
            }
        });
    }

    // --- 3. FORMAT MODE & TEMPLATES ---

    if (cardFormatDefault) {
        cardFormatDefault.addEventListener("click", () => {
            selectedFormatMode = "default";
            cardFormatDefault.classList.add("selected");
            cardFormatCustom.classList.remove("selected");
            customBuilderView.classList.add("hidden");
        });
    }

    if (cardFormatCustom) {
        cardFormatCustom.addEventListener("click", () => {
            selectedFormatMode = "custom";
            cardFormatCustom.classList.add("selected");
            cardFormatDefault.classList.remove("selected");
            customBuilderView.classList.remove("hidden");
        });
    }

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

    // --- 4. STEP 3 IMAGE MANAGER & MEDIA LIBRARY ---

    async function loadStep3Data() {
        if (!activeTemplate) await loadTemplates();
        if (!activeTemplate || !activeTemplate.sections) return;

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

    async function loadMediaGallery() {
        try {
            const res = await fetch("/api/images");
            const assets = await res.json();
            const container = document.getElementById("media-gallery-container");
            if (!container || !Array.isArray(assets)) return;

            if (assets.length === 0) {
                container.innerHTML = `<p style="color: var(--text-secondary);">No uploaded images yet.</p>`;
                return;
            }

            container.innerHTML = assets.map(a => `
                <div style="background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 10px; width: 140px; text-align: center;">
                    <img src="${a.url}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px;">
                    <div style="font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 6px;">${a.filename}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${a.width} × ${a.height}</div>
                </div>
            `).join("");
        } catch (e) {}
    }

    const mediaUploadForm = document.getElementById("media-upload-form");
    if (mediaUploadForm) {
        mediaUploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append("file", document.getElementById("media_upload_file").files[0]);

            try {
                const res = await fetch("/api/images/upload", { method: "POST", body: formData });
                const data = await res.json();
                alert(data.message || "Image uploaded!");
                loadMediaGallery();
            } catch (err) {
                alert("Upload failed: " + err);
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
                switchTab("home", navHome);
            } catch (e) {
                alert("Submission failed: " + e);
            } finally {
                btnFinalPublish.disabled = false;
                btnFinalPublish.textContent = "🚀 Start Automation & Publish to WordPress";
            }
        });
    }

    // --- 6. HISTORY & SETTINGS ---

    async function loadHistory() {
        try {
            const q = document.getElementById("history_search_input") ? document.getElementById("history_search_input").value : "";
            const res = await fetch(`/api/history?q=${encodeURIComponent(q)}`);
            const history = await res.json();
            const tbody = document.getElementById("history-tbody");
            if (!tbody || !Array.isArray(history)) return;

            if (history.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: rgba(0,0,0,0.5);">No publishing history records found.</td></tr>`;
                return;
            }

            tbody.innerHTML = history.map(h => `
                <tr>
                    <td>#${h.id}</td>
                    <td><strong>${h.game_name}</strong> (${h.provider})</td>
                    <td><span class="badge ${h.status === 'Published' ? 'badge-success' : 'badge-danger'}">${h.status}</span></td>
                    <td>${h.article_id ? `#${h.article_id}` : '--'}</td>
                    <td>${h.published_at || '--'}</td>
                    <td>
                        <button class="btn-secondary-sm retry-hist-btn" data-id="${h.id}" style="color: #2563EB;">Retry</button>
                        <button class="btn-secondary-sm delete-hist-btn" data-id="${h.id}" style="color: #EF4444;">Delete</button>
                    </td>
                </tr>
            `).join("");

            document.querySelectorAll(".delete-hist-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.target.getAttribute("data-id");
                    if (confirm("Delete this history entry? (WordPress article will not be deleted)")) {
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
                    switchTab("home", navHome);
                });
            });
        } catch (e) {}
    }

    const historySearchInput = document.getElementById("history_search_input");
    if (historySearchInput) historySearchInput.addEventListener("input", loadHistory);

    const btnDeleteAllHistory = document.getElementById("btn-delete-all-history");
    if (btnDeleteAllHistory) {
        btnDeleteAllHistory.addEventListener("click", async () => {
            if (confirm("Delete ALL history records?")) {
                await fetch("/api/history/bulk-delete?delete_all=true", { method: "POST" });
                loadHistory();
            }
        });
    }

    async function loadSettings() {
        try {
            const res = await fetch("/api/user/settings");
            const data = await res.json();
            if (data.wp_url) document.getElementById("set_wp_url").value = data.wp_url;
            if (data.wp_username) document.getElementById("set_wp_username").value = data.wp_username;
        } catch (e) {}
    }

    const setupForm = document.getElementById("setup-form");
    if (setupForm) {
        setupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                wp_url: document.getElementById("set_wp_url").value,
                wp_username: document.getElementById("set_wp_username").value,
                wp_password: document.getElementById("set_wp_password").value
            };
            try {
                await fetch("/api/user/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                alert("Settings saved successfully!");
            } catch (err) {
                alert("Failed to save settings: " + err);
            }
        });
    }

    // --- 7. DEV MODE & ROLE CHECK ---

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
                document.getElementById("stat-templates").textContent = data.total_templates || userTemplates.length || 1;
                document.getElementById("stat-quota-used").textContent = `${data.usage_percentage}%`;
            }
        } catch (e) {}
    }

    async function loadJobsHome() {
        try {
            const res = await fetch("/api/user/jobs?status_filter=ALL");
            const jobs = await res.json();
            const tbody = document.getElementById("jobs-tbody-home");
            if (!tbody || !Array.isArray(jobs)) return;

            const running = jobs.filter(j => j.status === 'PROCESSING' || j.status === 'QUEUED').length;
            const badge = document.getElementById("badge-jobs-running");
            if (badge) badge.textContent = `${running} Running`;

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
    switchTab("home", navHome);
    loadActiveFormat();
    loadTemplates();
    checkRole();
    setInterval(() => {
        const homeView = document.getElementById("view-home");
        if (homeView && !homeView.classList.contains("hidden")) {
            loadJobsHome();
        }
    }, 5000);
});
