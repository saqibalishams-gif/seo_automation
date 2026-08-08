document.addEventListener("DOMContentLoaded", () => {

    // ===================================================================
    // DOM REFERENCES
    // ===================================================================

    // Navigation
    const tabViews         = document.querySelectorAll(".tab-view");
    const navHome          = document.getElementById("nav-home");
    const navCreate        = document.getElementById("nav-create");
    const navTemplates     = document.getElementById("nav-templates");
    const navMedia         = document.getElementById("nav-media");
    const navHistory       = document.getElementById("nav-history");
    const navSettings      = document.getElementById("nav-settings");
    const navAdmin         = document.getElementById("nav-admin");
    const navWebsites      = document.getElementById("nav-websites");
    const navDrafts        = document.getElementById("nav-drafts");
    const navMoreBtn       = document.getElementById("nav-more-btn");
    const navMoreMenu      = document.getElementById("nav-more-menu");
    const devModeCheckbox  = document.getElementById("dev-mode-checkbox");
    const devModeDrawer    = document.getElementById("dev-mode-drawer");
    const devUuidContainer = document.getElementById("dev-uuid-lookup-container");
    const logoutBtn        = document.getElementById("logout-btn");

    // Fast-Track Automator
    const automationFastTrack        = document.getElementById("automation-fast-track");
    const btnOpenAdvancedSetup       = document.getElementById("btn-open-advanced-setup");
    const fastTrackImagesContainer   = document.getElementById("fast-track-images-container");
    const fastTrackSetupSummary      = document.getElementById("fast-track-setup-summary");
    const inputTargetUrl             = document.getElementById("input_target_url");
    const inputGameName              = document.getElementById("input_game_name");
    const inputProvider              = document.getElementById("input_provider");
    const inputMarket                = document.getElementById("input_market");
    const inputAdditionalInfo        = document.getElementById("input_additional_info");
    const btnFinalPublish            = document.getElementById("btn-final-publish");
    const btnSaveDraftPublish        = document.getElementById("btn-save-draft-publish");
    
    // Advanced Setup Wizard
    const advancedSetupWizard        = document.getElementById("advanced-setup-wizard");
    const btnCloseAdvancedSetup      = document.getElementById("btn-close-advanced-setup");
    const setupTone                  = document.getElementById("setup_tone");
    const setupWordCount             = document.getElementById("setup_word_count");
    const setupTargetAudience        = document.getElementById("setup_target_audience");
    const setupPrimaryKeyword        = document.getElementById("setup_primary_keyword");
    const setupSecondaryKeywords     = document.getElementById("setup_secondary_keywords");
    const setupWritingInstructions   = document.getElementById("setup_writing_instructions");
    const step4MetaDesc              = document.getElementById("step4_meta_desc");
    const chkSaveAsDefaultSetup      = document.getElementById("chk-save-as-default-setup");
    const setupSaveMsg               = document.getElementById("setup-save-msg");
    const btnSaveContentSetup        = document.getElementById("btn-save-content-setup");

    // Format Card in Setup
    const btnOpenChangeFormat        = document.getElementById("btn-open-change-format");
    const activeFormatTitle          = document.getElementById("active-format-title");
    const activeFormatMeta           = document.getElementById("active-format-meta");

    // Change Format Modal
    const changeFormatModal          = document.getElementById("change-format-modal");
    const closeFormatModalBtn        = document.getElementById("close-format-modal-btn");
    const btnCancelFormatModal       = document.getElementById("btn-cancel-format-modal");
    const btnApplyFormatModal        = document.getElementById("btn-apply-format-modal");
    const formatModalOptionsList     = document.getElementById("format-modal-options-list");
    const chkSetAsWebsiteDefault     = document.getElementById("chk-set-as-website-default");

    // Section Editor Modal
    const sectionEditorModal         = document.getElementById("section-editor-modal");
    const closeSecModalBtn           = document.getElementById("close-sec-modal-btn");
    const editSecName                = document.getElementById("edit_sec_name");
    const editSecInstruction         = document.getElementById("edit_sec_instruction");
    const editSecType                = document.getElementById("edit_sec_type");
    const editSecReq                 = document.getElementById("edit_sec_req");
    const btnSaveSectionModal        = document.getElementById("btn-save-section-modal");

    // Content Formats Page
    const formatsListView            = document.getElementById("formats-list-view");
    const formatBuilderView          = document.getElementById("format-builder-view");
    const formatsListContainer       = document.getElementById("formats-list-container");
    const btnCreateNewFormat         = document.getElementById("btn-create-new-format");
    const btnBackToFormatsList       = document.getElementById("btn-back-to-formats-list");
    const btnAddBuilderSection       = document.getElementById("btn-add-builder-section");
    const btnSaveTemplate            = document.getElementById("btn-save-template");
    const btnCancelBuilder           = document.getElementById("btn-cancel-builder");
    const builderSectionsContainer   = document.getElementById("builder-sections-container");
    const builderViewTitle           = document.getElementById("builder-view-title");
    const builderTemplateNameEl      = document.getElementById("builder_template_name");
    const builderTemplateDescEl      = document.getElementById("builder_template_desc");
    const builderSaveMsg             = document.getElementById("builder-save-msg");

    // ===================================================================
    // GLOBAL STATE
    // ===================================================================
    let activeStep             = 1;
    let userTemplates          = [];
    let activeTemplate         = null;   // Format in use for images/preview
    let articleFormat          = null;   // Article-specific format override
    let persistentActiveFormat = { mode: "default", template_id: null, template_name: "Default SEO Format" };
    let currentEditingSecCard  = null;
    let imageAssignments       = [];
    let savedContentSetup      = null;   // Loaded default content settings
    let currentEditingTemplateId = null; // For format builder
    let selectedFormatIdInModal  = null; // Tracked selection in change-format modal

    // ===================================================================
    // UTILITIES
    // ===================================================================
    function showMsg(el, text, type = "success", duration = 3500) {
        if (!el) return;
        el.className = type === "success" ? "success-msg" : "error-msg";
        el.textContent = text;
        el.classList.remove("hidden");
        if (duration > 0) setTimeout(() => el.classList.add("hidden"), duration);
    }

    // ===================================================================
    // NAV DROPDOWN
    // ===================================================================
    if (navMoreBtn && navMoreMenu) {
        navMoreBtn.addEventListener("click", (e) => { e.stopPropagation(); navMoreMenu.classList.toggle("hidden"); });
        document.addEventListener("click", () => navMoreMenu.classList.add("hidden"));
    }

    // ===================================================================
    // TAB SWITCHER
    // ===================================================================
    function switchTab(viewName, navBtn) {
        tabViews.forEach(v => v.classList.add("hidden"));
        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.remove("hidden");

        [navHome, navCreate, navTemplates, navHistory, navWebsites, navMedia, navDrafts, navSettings, navAdmin]
            .forEach(b => { if (b) b.classList.remove("active"); });
        if (navBtn) navBtn.classList.add("active");
        if (navMoreMenu) navMoreMenu.classList.add("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });

        if      (viewName === "home")      { loadUsage(); loadJobsHome(); }
        else if (viewName === "create")    { initCreateView(); }
        else if (viewName === "templates") { loadFormatsListView(); }
        else if (viewName === "websites")  { loadWebsitesView(); }
        else if (viewName === "media")     { loadMediaGallery(); }
        else if (viewName === "drafts")    { loadDraftsPage(); }
        else if (viewName === "history")   { loadHistory(); }
        else if (viewName === "settings")  { loadSettings(); }
    }

    if (navHome)      navHome.addEventListener("click",      () => switchTab("home",      navHome));
    if (navCreate)    navCreate.addEventListener("click",    () => switchTab("create",    navCreate));
    if (navTemplates) navTemplates.addEventListener("click", () => switchTab("templates", navTemplates));
    if (navHistory)   navHistory.addEventListener("click",   () => switchTab("history",   navHistory));
    if (navWebsites)  navWebsites.addEventListener("click",  () => switchTab("websites",  navWebsites));
    if (navMedia)     navMedia.addEventListener("click",     () => switchTab("media",     navMedia));
    if (navDrafts)    navDrafts.addEventListener("click",    () => switchTab("drafts",    navDrafts));
    if (navSettings)  navSettings.addEventListener("click",  () => switchTab("settings",  navSettings));

    const btnHomeCreate = document.getElementById("btn-home-create-article");
    if (btnHomeCreate) btnHomeCreate.addEventListener("click", () => switchTab("create", navCreate));

    // ===================================================================
    // COLLAPSIBLE SECTIONS (Home Dashboard)
    // ===================================================================
    function setupCollapsibles() {
        document.querySelectorAll(".btn-toggle-panel").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const targetId = btn.getAttribute("data-target");
                const body = document.getElementById(targetId);
                if (!body) return;
                const isCollapsed = body.classList.contains("hidden");
                body.classList.toggle("hidden");
                btn.textContent = isCollapsed ? "−" : "+";
                if (isCollapsed) {
                    if (targetId === "home-drafts-body")  loadHomeDrafts();
                    if (targetId === "home-history-body") loadHomeHistory();
                }
            });
        });

        document.querySelectorAll(".collapsible-header").forEach(header => {
            header.addEventListener("click", (e) => {
                if (e.target.classList.contains("btn-toggle-panel")) return;
                const btn = header.querySelector(".btn-toggle-panel");
                if (btn) btn.click();
            });
        });

        const btnExpandAll  = document.getElementById("btn-expand-all");
        const btnCollapseAll = document.getElementById("btn-collapse-all");

        if (btnExpandAll) {
            btnExpandAll.addEventListener("click", () => {
                document.querySelectorAll(".collapsible-body").forEach(b => b.classList.remove("hidden"));
                document.querySelectorAll(".btn-toggle-panel").forEach(b => b.textContent = "−");
                loadHomeDrafts();
                loadHomeHistory();
            });
        }
        if (btnCollapseAll) {
            btnCollapseAll.addEventListener("click", () => {
                document.querySelectorAll(".collapsible-body").forEach(b => b.classList.add("hidden"));
                document.querySelectorAll(".btn-toggle-panel").forEach(b => b.textContent = "+");
                // Keep jobs open by default
                const jobsBody = document.getElementById("home-jobs-body");
                if (jobsBody) {
                    jobsBody.classList.remove("hidden");
                    const jobsBtn = document.querySelector('[data-target="home-jobs-body"]');
                    if (jobsBtn) jobsBtn.textContent = "−";
                }
            });
        }
    }
    setupCollapsibles();

    // ===================================================================
    // CREATE VIEW NAVIGATION (Fast-Track vs Setup Wizard)
    // ===================================================================
    
    if (btnOpenAdvancedSetup) {
        btnOpenAdvancedSetup.addEventListener("click", () => {
            automationFastTrack.classList.add("hidden");
            advancedSetupWizard.classList.remove("hidden");
        });
    }

    if (btnCloseAdvancedSetup) {
        btnCloseAdvancedSetup.addEventListener("click", () => {
            advancedSetupWizard.classList.add("hidden");
            automationFastTrack.classList.remove("hidden");
        });
    }

    // ===================================================================
    // INIT CREATE VIEW
    // ===================================================================
    async function initCreateView() {
        if (userTemplates.length === 0) await loadTemplates();
        await loadContentSettings();
        await loadActiveFormat();
        
        // Ensure we are in Fast Track mode
        if (advancedSetupWizard) advancedSetupWizard.classList.add("hidden");
        if (automationFastTrack) automationFastTrack.classList.remove("hidden");

        // Force a UI refresh of the format card and images
        updateFormatStepDisplay();
        renderFastTrackSummary();
        renderFastTrackImageUploaders();
    }

    function renderFastTrackSummary() {
        const toneEl = document.getElementById("summary-tone");
        const wordEl = document.getElementById("summary-words");
        const fmtEl  = document.getElementById("summary-format");

        if (toneEl) toneEl.textContent = setupTone?.options[setupTone.selectedIndex]?.text || "Professional";
        if (wordEl) wordEl.textContent = setupWordCount?.options[setupWordCount.selectedIndex]?.text || "Standard (1500+)";
        if (fmtEl)  fmtEl.textContent  = persistentActiveFormat.template_name || "Default Format";
    }

    function renderFastTrackImageUploaders() {
        if (!fastTrackImagesContainer) return;
        if (!activeTemplate || !activeTemplate.sections || activeTemplate.sections.length === 0) {
            fastTrackImagesContainer.innerHTML = `<p style="color:var(--text-secondary);font-size:0.9rem;">No sections found in this format.</p>`;
            return;
        }

        fastTrackImagesContainer.innerHTML = activeTemplate.sections.map(s => `
            <div class="glass-panel" style="padding: 14px; border: 1px solid rgba(0,0,0,0.06); background: rgba(0,0,0,0.015);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <strong style="color:var(--text-primary); font-size:1rem;">${s.name}</strong>
                </div>
                <div id="img-upload-ui-${s.id}">
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 10px;">
                        <input type="file" id="img-file-${s.id}" accept="image/*" style="font-size:0.85rem; padding: 4px;">
                        <select id="img-pos-${s.id}" style="padding: 4px 8px; font-size:0.85rem;">
                            <option value="after_heading">After Heading</option>
                            <option value="before_heading">Before Heading</option>
                            <option value="end_of_section">End of Section</option>
                        </select>
                        <select id="img-size-${s.id}" style="padding: 4px 8px; font-size:0.85rem;">
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                            <option value="small">Small</option>
                        </select>
                    </div>
                    <button type="button" class="btn-secondary-sm btn-upload-section-img" data-sec-id="${s.id}">Upload to Section</button>
                    <div id="img-status-${s.id}" style="font-size: 0.8rem; margin-top: 6px;" class="hidden"></div>
                </div>
                <div id="img-preview-${s.id}" class="hidden" style="margin-top:10px; padding-top:10px; border-top:1px dashed rgba(0,0,0,0.1);">
                    <!-- Assigned image preview goes here -->
                </div>
            </div>
        `).join("");

        // Attach listeners for upload buttons
        document.querySelectorAll(".btn-upload-section-img").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const secId = e.target.getAttribute("data-sec-id");
                await handleSectionImageUpload(secId);
            });
        });
    }

    async function handleSectionImageUpload(secId) {
        const fileInput = document.getElementById(`img-file-${secId}`);
        const posSelect = document.getElementById(`img-pos-${secId}`);
        const sizeSelect = document.getElementById(`img-size-${secId}`);
        const statusEl = document.getElementById(`img-status-${secId}`);
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showMsg(statusEl, "Please select an image first.", "error", 2000);
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append("file", file);

        showMsg(statusEl, "Uploading...", "success", 0);

        try {
            const uploadRes = await fetch("/api/images/upload", { method: "POST", body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.error) throw new Error(uploadData.error);
            
            const assetId = uploadData.id;

            const assignPayload = {
                image_id: assetId,
                section_id: secId,
                position: posSelect.value,
                size: sizeSelect.value,
                alignment: "center" // default
            };

            const assignRes = await fetch("/api/images/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(assignPayload)
            });

            if (!assignRes.ok) throw new Error("Failed to assign");

            showMsg(statusEl, "Assigned!", "success", 2000);

            // Update UI to show preview
            const uploadUi = document.getElementById(`img-upload-ui-${secId}`);
            const previewUi = document.getElementById(`img-preview-${secId}`);
            
            uploadUi.classList.add("hidden");
            previewUi.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${uploadData.url}" style="width:60px; height:60px; object-fit:cover; border-radius:6px; border:1px solid rgba(0,0,0,0.1);">
                    <div style="flex:1;">
                        <strong style="font-size:0.9rem; display:block;">${file.name}</strong>
                        <span style="font-size:0.8rem; color:var(--text-secondary);">${posSelect.options[posSelect.selectedIndex].text} • ${sizeSelect.options[sizeSelect.selectedIndex].text}</span>
                    </div>
                    <button class="btn-secondary-sm btn-remove-section-img" data-sec-id="${secId}" style="color:#DC2626; border-color:rgba(220,38,38,0.3);">Remove</button>
                </div>
            `;
            previewUi.classList.remove("hidden");

            // Attach remove listener
            previewUi.querySelector(".btn-remove-section-img").addEventListener("click", () => {
                // In a real app we'd call unassign API here, for now just reset UI
                previewUi.classList.add("hidden");
                previewUi.innerHTML = "";
                fileInput.value = "";
                uploadUi.classList.remove("hidden");
            });

        } catch (e) {
            console.error("Upload error:", e);
            showMsg(statusEl, "Upload failed: " + e.message, "error", 3000);
        }
    }

    // ===================================================================
    // CONTENT SETUP STATE MACHINE
    // ===================================================================
    async function loadContentSettings() {
        try {
            const res  = await fetch("/api/user/content-settings");
            const data = await res.json();
            savedContentSetup = data;
            const hasSaved = data && (data.default_tone || data.default_word_count);
            if (hasSaved) {
                populateContentSetupForm(data);
            }
        } catch (e) {
            console.error("Failed to load content settings", e);
        }
    }

    function populateContentSetupForm(data) {
        const tone   = document.getElementById("setup_tone");
        const length = document.getElementById("setup_word_count");
        if (tone   && data.default_tone)       tone.value   = data.default_tone;
        if (length && data.default_word_count) length.value = data.default_word_count;
    }

    if (btnSaveContentSetup) {
        btnSaveContentSetup.addEventListener("click", async () => {
            const saveAsDefault = chkSaveAsDefaultSetup && chkSaveAsDefaultSetup.checked;
            const payload = {
                default_tone:             document.getElementById("setup_tone")?.value || "professional",
                default_word_count:       document.getElementById("setup_word_count")?.value || "1500",
                default_market:           document.getElementById("input_market")?.value || "UK",
                default_keyword_density:  "1.2",
                save_as_default:          saveAsDefault
            };
            try {
                if (saveAsDefault) {
                    const res = await fetch("/api/user/content-settings", {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify(payload)
                    });
                    if (res.ok) {
                        savedContentSetup = payload;
                        if (setupSaveMsg) {
                            showMsg(setupSaveMsg, "✓ Saved as default", "success", 2000);
                        }
                    }
                } else {
                    savedContentSetup = payload; // just save for this session
                    if (setupSaveMsg) {
                        showMsg(setupSaveMsg, "✓ Setup updated for this article", "success", 2000);
                    }
                }
                
                // Refresh fast-track view
                renderFastTrackSummary();

                // Close the wizard after short delay
                setTimeout(() => {
                    if (advancedSetupWizard) advancedSetupWizard.classList.add("hidden");
                    if (automationFastTrack) automationFastTrack.classList.remove("hidden");
                }, 1000);
            } catch (e) { 
                console.error("Failed to save content setup", e); 
                if (setupSaveMsg) showMsg(setupSaveMsg, "Failed to save", "error", 2000);
            }
        });
    }

    // ===================================================================
    // ACTIVE FORMAT — LOAD & DISPLAY
    // ===================================================================
    async function loadActiveFormat() {
        try {
            const res  = await fetch("/api/user/active-format");
            const data = await res.json();
            if (data.mode) {
                persistentActiveFormat = { ...data };
            }
        } catch (e) { console.error("Failed to load active format", e); }
    }

    function updateFormatStepDisplay() {
        const titleEl    = document.getElementById("active-format-title");
        const metaEl     = document.getElementById("active-format-meta");
        const previewEl  = document.getElementById("active-format-sections-preview");

        // Resolve template object
        let tmpl = null;
        if (persistentActiveFormat.mode === "custom" && persistentActiveFormat.template_id) {
            tmpl = userTemplates.find(t => t.id === persistentActiveFormat.template_id) || null;
        }
        if (!tmpl) tmpl = userTemplates.find(t => t.is_default) || userTemplates[0] || null;

        if (titleEl) {
            if (tmpl) {
                titleEl.textContent = `${tmpl.is_default ? "⭐ " : "🎨 "}${tmpl.name}`;
            } else {
                titleEl.textContent = "⭐ Default SEO Format";
            }
        }

        const count = tmpl ? tmpl.sections.length : 0;
        if (metaEl) {
            metaEl.innerHTML = count > 0
                ? `<span style="color:#047857;font-weight:600;">✓ ${count} sections</span>${tmpl?.is_default ? ' &nbsp;•&nbsp; <span class="badge badge-info">Default</span>' : ''}`
                : `<span style="color:var(--text-muted);">Loading...</span>`;
        }

        if (previewEl && tmpl) {
            const shown = tmpl.sections.slice(0, 6);
            previewEl.innerHTML = shown.map(s =>
                `<span style="background:rgba(0,0,0,0.06);padding:3px 9px;border-radius:6px;font-size:0.77rem;color:var(--text-secondary);">${s.name}</span>`
            ).join("") + (tmpl.sections.length > 6 ? `<span style="font-size:0.77rem;color:var(--text-muted);padding:3px 4px;">+${tmpl.sections.length - 6} more</span>` : "");
        } else if (previewEl) {
            previewEl.innerHTML = "";
        }

        if (tmpl) activeTemplate = tmpl;
    }

    // ===================================================================
    // CHANGE FORMAT MODAL — FULLY FIXED
    // ===================================================================
    if (btnOpenChangeFormat) {
        btnOpenChangeFormat.addEventListener("click", async () => {
            if (userTemplates.length === 0) await loadTemplates();
            renderFormatModalOptions();
            changeFormatModal.classList.remove("hidden"); // ← The key fix: modal is now at root level
        });
    }

    function renderFormatModalOptions() {
        if (!formatModalOptionsList) return;

        // Determine which format is currently selected for this article
        const currentId = articleFormat ? articleFormat.id :
            (persistentActiveFormat.mode === "custom" ? persistentActiveFormat.template_id : null);

        if (userTemplates.length === 0) {
            formatModalOptionsList.innerHTML = `
                <p style="color:var(--text-secondary);text-align:center;padding:20px;">
                    No saved formats found.
                    <a href="#" id="modal-create-link" style="color:var(--accent-orange-strong);">Create one first</a>
                </p>`;
            document.getElementById("modal-create-link")?.addEventListener("click", e => {
                e.preventDefault();
                changeFormatModal.classList.add("hidden");
                switchTab("templates", navTemplates);
            });
            return;
        }

        formatModalOptionsList.innerHTML = userTemplates.map(t => {
            // Select default template when no explicit selection
            const isSelected = currentId ? (t.id === currentId) : t.is_default;
            return `
                <label class="format-option-card ${isSelected ? "selected" : ""}" data-tmpl-id="${t.id}">
                    <input type="radio" name="modal_format_radio" value="${t.id}" ${isSelected ? "checked" : ""} style="flex-shrink:0;margin-top:2px;">
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <strong style="font-size:0.95rem;">${t.is_default ? "⭐ " : ""}${t.name}</strong>
                            ${t.is_default ? '<span class="badge badge-info">Default</span>' : ""}
                        </div>
                        ${t.description ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:2px;">${t.description}</div>` : ""}
                        <div style="font-size:0.79rem;color:var(--text-muted);margin-top:3px;">${t.sections.length} sections: ${t.sections.slice(0,4).map(s=>s.name).join(", ")}${t.sections.length>4?"...":""}</div>
                    </div>
                </label>`;
        }).join("");

        // Track initial selection
        const initialChecked = formatModalOptionsList.querySelector("input[type=radio]:checked");
        if (initialChecked) selectedFormatIdInModal = parseInt(initialChecked.value);

        // Wire radio change
        formatModalOptionsList.querySelectorAll("input[type=radio]").forEach(radio => {
            radio.addEventListener("change", () => {
                selectedFormatIdInModal = parseInt(radio.value);
                formatModalOptionsList.querySelectorAll(".format-option-card").forEach(c => c.classList.remove("selected"));
                radio.closest(".format-option-card")?.classList.add("selected");
            });
        });

        // Click on label = select radio
        formatModalOptionsList.querySelectorAll(".format-option-card").forEach(card => {
            card.addEventListener("click", e => {
                if (e.target.type === "radio") return;
                const radio = card.querySelector("input[type=radio]");
                if (radio && !radio.checked) { radio.checked = true; radio.dispatchEvent(new Event("change")); }
            });
        });
    }

    if (closeFormatModalBtn) closeFormatModalBtn.addEventListener("click", () => changeFormatModal.classList.add("hidden"));
    if (btnCancelFormatModal)  btnCancelFormatModal.addEventListener("click", () => changeFormatModal.classList.add("hidden"));

    if (btnApplyFormatModal) {
        btnApplyFormatModal.addEventListener("click", async () => {
            // Fallback to default if nothing selected
            if (!selectedFormatIdInModal) {
                const def = userTemplates.find(t => t.is_default);
                if (def) selectedFormatIdInModal = def.id;
            }

            const selected = userTemplates.find(t => t.id === selectedFormatIdInModal);
            if (!selected) { changeFormatModal.classList.add("hidden"); return; }

            // Apply to this article (in memory)
            articleFormat  = selected;
            activeTemplate = selected;

            // Update the displayed format in Step 2
            persistentActiveFormat = { mode: "custom", template_id: selected.id, template_name: selected.name };
            updateFormatStepDisplay();

            // Persist as website default only if checkbox is ticked
            if (chkSetAsWebsiteDefault && chkSetAsWebsiteDefault.checked) {
                try {
                    await fetch("/api/user/active-format", {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({ mode: "custom", template_id: selected.id, save_as_active: true })
                    });
                } catch (e) { console.error("Failed to save format as default", e); }
            }

            // Update fast track UI
            renderFastTrackSummary();
            renderFastTrackImageUploaders();

            if (chkSetAsWebsiteDefault) chkSetAsWebsiteDefault.checked = false;
            changeFormatModal.classList.add("hidden");
        });
    }

    // Handle "Also make default" checkbox from Step 2 override notice
    if (chkMakeFormatDefault) {
        chkMakeFormatDefault.addEventListener("change", async () => {
            if (chkMakeFormatDefault.checked && articleFormat) {
                try {
                    await fetch("/api/user/active-format", {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({ mode: "custom", template_id: articleFormat.id, save_as_active: true })
                    });
                } catch (e) {}
            }
        });
    }

    // ===================================================================
    // EDIT FORMAT (navigate to builder)
    // ===================================================================
    if (btnEditFormat) {
        btnEditFormat.addEventListener("click", () => {
            if (activeTemplate && activeTemplate.id) {
                currentEditingTemplateId = activeTemplate.id;
                openFormatBuilder(activeTemplate);
                switchTab("templates", navTemplates);
            } else {
                switchTab("templates", navTemplates);
            }
        });
    }

    // ===================================================================
    // LOAD TEMPLATES
    // ===================================================================
    async function loadTemplates() {
        try {
            const res  = await fetch("/api/templates");
            const data = await res.json();
            if (!Array.isArray(data)) return;
            userTemplates  = data;
            activeTemplate = data.find(t => t.is_default) || data[0] || null;
            updateDevDiagnostics();
        } catch (e) { console.error("Failed to load templates", e); }
    }

    // ===================================================================
    // CONTENT FORMATS PAGE
    // ===================================================================
    async function loadFormatsListView() {
        if (userTemplates.length === 0) await loadTemplates();
        if (formatsListView)   formatsListView.classList.remove("hidden");
        if (formatBuilderView) formatBuilderView.classList.add("hidden");
        renderFormatsList();
    }

    function renderFormatsList() {
        if (!formatsListContainer) return;
        if (userTemplates.length === 0) {
            formatsListContainer.innerHTML = `<p style="color:var(--text-secondary);">No saved formats yet. Create your first format.</p>`;
            return;
        }
        formatsListContainer.innerHTML = userTemplates.map(t => `
            <div class="format-list-item">
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                        <strong style="font-size:1rem;color:var(--text-primary);">${t.is_default ? "⭐ " : ""}${t.name}</strong>
                        ${t.is_default ? '<span class="badge badge-info">Default</span>' : ""}
                    </div>
                    <div style="font-size:0.85rem;color:var(--text-secondary);">${t.description || "No description"}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">${t.sections.length} sections: ${t.sections.slice(0,5).map(s=>s.name).join(", ")}${t.sections.length>5?"...":""}</div>
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;align-items:center;flex-wrap:wrap;">
                    <button class="btn-secondary-sm format-use-btn" data-id="${t.id}" style="color:var(--accent-orange-strong);">Use</button>
                    <button class="btn-secondary-sm format-edit-btn" data-id="${t.id}">Edit</button>
                    <button class="btn-secondary-sm format-dup-btn"  data-id="${t.id}">Duplicate</button>
                    ${!t.is_default ? `<button class="btn-secondary-sm format-del-btn" data-id="${t.id}" style="color:#EF4444;">Delete</button>` : ""}
                </div>
            </div>
        `).join("");

        formatsListContainer.querySelectorAll(".format-use-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id   = parseInt(btn.getAttribute("data-id"));
                const tmpl = userTemplates.find(t => t.id === id);
                if (!tmpl) return;
                try {
                    await fetch("/api/user/active-format", {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({ mode: "custom", template_id: id, save_as_active: true })
                    });
                    persistentActiveFormat = { mode: "custom", template_id: id, template_name: tmpl.name };
                    activeTemplate         = tmpl;
                    btn.textContent = "✓ Using"; btn.disabled = true;
                    setTimeout(() => { btn.textContent = "Use"; btn.disabled = false; }, 2000);
                } catch (e) {}
            });
        });

        formatsListContainer.querySelectorAll(".format-edit-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id   = parseInt(btn.getAttribute("data-id"));
                const tmpl = userTemplates.find(t => t.id === id);
                if (tmpl) { currentEditingTemplateId = id; openFormatBuilder(tmpl); }
            });
        });

        formatsListContainer.querySelectorAll(".format-dup-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = parseInt(btn.getAttribute("data-id"));
                try {
                    const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" });
                    if (res.ok) { await loadTemplates(); renderFormatsList(); }
                } catch (e) {}
            });
        });

        formatsListContainer.querySelectorAll(".format-del-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = parseInt(btn.getAttribute("data-id"));
                if (!confirm("Delete this format? This cannot be undone.")) return;
                try {
                    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
                    if (res.ok) { await loadTemplates(); renderFormatsList(); }
                } catch (e) {}
            });
        });
    }

    if (btnCreateNewFormat) {
        btnCreateNewFormat.addEventListener("click", () => {
            currentEditingTemplateId = null;
            openFormatBuilder(null);
        });
    }

    if (btnBackToFormatsList || btnCancelBuilder) {
        [btnBackToFormatsList, btnCancelBuilder].forEach(btn => {
            if (btn) btn.addEventListener("click", () => {
                if (formatsListView)   formatsListView.classList.remove("hidden");
                if (formatBuilderView) formatBuilderView.classList.add("hidden");
                renderFormatsList();
            });
        });
    }

    function openFormatBuilder(tmpl) {
        if (builderViewTitle)       builderViewTitle.textContent   = tmpl ? "📐 Edit Article Format" : "📐 Create Article Format";
        if (builderTemplateNameEl)  builderTemplateNameEl.value    = tmpl ? tmpl.name : "";
        if (builderTemplateDescEl)  builderTemplateDescEl.value    = tmpl ? (tmpl.description || "") : "";
        if (builderSectionsContainer) builderSectionsContainer.innerHTML = "";
        if (builderSaveMsg) { builderSaveMsg.textContent = ""; builderSaveMsg.classList.add("hidden"); }

        if (tmpl && tmpl.sections) {
            tmpl.sections.forEach((s, i) => appendBuilderSection(s, i + 1));
        }
        if (formatsListView)   formatsListView.classList.add("hidden");
        if (formatBuilderView) formatBuilderView.classList.remove("hidden");
    }

    function appendBuilderSection(s, idx) {
        if (!builderSectionsContainer) return;
        const div = document.createElement("div");
        div.className = "builder-section-row";
        div.setAttribute("data-sec-id",     s.id || "");
        div.setAttribute("data-name",       s.name || "");
        div.setAttribute("data-instruction",s.ai_instruction || "");
        div.setAttribute("data-type",       s.content_type || "paragraph");
        div.setAttribute("data-req",        s.required ? "true" : "false");
        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                <span style="font-weight:700;color:var(--text-muted);font-size:0.85rem;min-width:22px;">${idx}.</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;color:var(--text-primary);">${s.name}</div>
                    <div style="font-size:0.79rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:350px;">${s.ai_instruction ? s.ai_instruction.slice(0,90) + (s.ai_instruction.length > 90 ? "..." : "") : "No instructions set"}</div>
                </div>
                <span class="badge badge-info" style="text-transform:capitalize;flex-shrink:0;">${s.content_type || "paragraph"}</span>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;">
                <button class="btn-secondary-sm bld-edit-btn">Edit</button>
                <button class="btn-secondary-sm bld-del-btn" style="color:#EF4444;">Remove</button>
            </div>`;
        div.querySelector(".bld-edit-btn").addEventListener("click", () => openSectionModal(div));
        div.querySelector(".bld-del-btn").addEventListener("click", () => {
            div.remove();
            renumberBuilderSections();
        });
        builderSectionsContainer.appendChild(div);
    }

    function renumberBuilderSections() {
        if (!builderSectionsContainer) return;
        builderSectionsContainer.querySelectorAll(".builder-section-row").forEach((row, i) => {
            const numEl = row.querySelector("span[style*='min-width:22px']");
            if (numEl) numEl.textContent = `${i + 1}.`;
        });
    }

    if (btnAddBuilderSection) btnAddBuilderSection.addEventListener("click", () => openSectionModal(null));

    if (btnSaveTemplate) {
        btnSaveTemplate.addEventListener("click", async () => {
            const name = builderTemplateNameEl?.value?.trim();
            if (!name) { showMsg(builderSaveMsg, "Please enter a format name.", "error"); return; }

            const sections = [];
            builderSectionsContainer?.querySelectorAll(".builder-section-row").forEach((row, i) => {
                sections.push({
                    id:            row.getAttribute("data-sec-id") || null,
                    name:          row.getAttribute("data-name"),
                    order:         i + 1,
                    content_type:  row.getAttribute("data-type") || "paragraph",
                    ai_instruction:row.getAttribute("data-instruction") || "",
                    required:      row.getAttribute("data-req") === "true"
                });
            });

            const payload = {
                name,
                description: builderTemplateDescEl?.value?.trim() || "",
                mode: "custom",
                is_default: false,
                sections
            };

            try {
                const res = await fetch("/api/templates", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(payload)
                });
                if (res.ok) {
                    showMsg(builderSaveMsg, "✓ Format saved!", "success", 2000);
                    await loadTemplates();
                    setTimeout(() => {
                        if (formatsListView)   formatsListView.classList.remove("hidden");
                        if (formatBuilderView) formatBuilderView.classList.add("hidden");
                        renderFormatsList();
                    }, 1600);
                } else {
                    showMsg(builderSaveMsg, "Failed to save format.", "error");
                }
            } catch (e) { showMsg(builderSaveMsg, "Error: " + e.message, "error"); }
        });
    }

    // ===================================================================
    // SECTION EDITOR MODAL
    // ===================================================================
    function openSectionModal(rowCard) {
        currentEditingSecCard = rowCard;
        if (rowCard) {
            if (editSecName)        editSecName.value        = rowCard.getAttribute("data-name") || "";
            if (editSecInstruction) editSecInstruction.value = rowCard.getAttribute("data-instruction") || "";
            if (editSecType)        editSecType.value        = rowCard.getAttribute("data-type") || "paragraph";
            if (editSecReq)         editSecReq.checked       = rowCard.getAttribute("data-req") === "true";
        } else {
            if (editSecName)        editSecName.value        = "";
            if (editSecInstruction) editSecInstruction.value = "";
            if (editSecType)        editSecType.value        = "paragraph";
            if (editSecReq)         editSecReq.checked       = true;
        }
        if (sectionEditorModal) sectionEditorModal.classList.remove("hidden");
    }

    if (closeSecModalBtn) closeSecModalBtn.addEventListener("click", () => sectionEditorModal?.classList.add("hidden"));

    if (btnSaveSectionModal) {
        btnSaveSectionModal.addEventListener("click", () => {
            const name = editSecName?.value?.trim();
            if (!name) { alert("Please enter a section name."); return; }

            if (currentEditingSecCard) {
                // Update existing row
                currentEditingSecCard.setAttribute("data-name",        name);
                currentEditingSecCard.setAttribute("data-instruction",  editSecInstruction?.value || "");
                currentEditingSecCard.setAttribute("data-type",         editSecType?.value || "paragraph");
                currentEditingSecCard.setAttribute("data-req",          editSecReq?.checked ? "true" : "false");
                // Refresh display text
                const nameEl  = currentEditingSecCard.querySelector("[style*='font-weight:700;color:var(--text-primary)']");
                const instrEl = currentEditingSecCard.querySelector("[style*='font-size:0.79rem']");
                if (nameEl)  nameEl.textContent  = name;
                if (instrEl) instrEl.textContent = editSecInstruction?.value ? editSecInstruction.value.slice(0,90) + (editSecInstruction.value.length>90?"...":"") : "No instructions set";
            } else {
                // Add new section
                const count = builderSectionsContainer ? builderSectionsContainer.children.length + 1 : 1;
                appendBuilderSection({
                    id:            `sec-${Math.random().toString(36).substr(2, 9)}`,
                    name,
                    ai_instruction: editSecInstruction?.value || "",
                    content_type:   editSecType?.value || "paragraph",
                    required:       editSecReq?.checked !== false
                }, count);
            }
            if (sectionEditorModal) sectionEditorModal.classList.add("hidden");
        });
    }

    // ===================================================================
    // STEP 4 — SEO PREFILL
    // ===================================================================

    // ===================================================================
    // PUBLISH LOGIC
    // ===================================================================
    
    if (btnFinalPublish) {
        btnFinalPublish.addEventListener("click", async () => {
            const url = document.getElementById("input_target_url")?.value;
            if (!url) { alert("Please enter a Target URL."); return; }

            btnFinalPublish.disabled    = true;
            btnFinalPublish.textContent = "🚀 Submitting...";

            const fd = new FormData();
            fd.append("url",       url);
            fd.append("game_name", document.getElementById("input_game_name")?.value || "");
            fd.append("provider",  document.getElementById("input_provider")?.value  || "");
            fd.append("market",    document.getElementById("input_market")?.value    || "UK");

            try {
                const res  = await fetch("/api/links", { method: "POST", body: fd });
                const data = await res.json();
                alert(data.message || "Job queued successfully!");
                switchTab("home", navHome);
            } catch (e) { alert("Submission failed: " + e); }
            finally {
                btnFinalPublish.disabled    = false;
                btnFinalPublish.textContent = "🚀 Start Automation & Publish";
            }
        });
    }

    const btnSaveDraft = document.getElementById("btn-save-draft-publish");
    if (btnSaveDraft) btnSaveDraft.addEventListener("click", () => alert("Draft saving is available once an article has been generated."));

    // ===================================================================
    // MEDIA LIBRARY
    // ===================================================================
    async function loadMediaGallery() {
        try {
            const res    = await fetch("/api/images");
            const assets = await res.json();
            const c      = document.getElementById("media-gallery-container");
            if (!c || !Array.isArray(assets)) return;
            c.innerHTML = assets.length === 0
                ? `<p style="color:var(--text-secondary);">No images uploaded yet.</p>`
                : assets.map(a => `
                    <div style="background:white;border:1px solid rgba(0,0,0,0.08);border-radius:8px;padding:10px;width:140px;text-align:center;">
                        <img src="${a.url}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;">
                        <div style="font-size:0.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:6px;">${a.filename}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);">${a.width} × ${a.height}</div>
                    </div>`).join("");
        } catch (e) {}
    }

    const mediaUploadForm = document.getElementById("media-upload-form");
    if (mediaUploadForm) {
        mediaUploadForm.addEventListener("submit", async e => {
            e.preventDefault();
            const fd = new FormData();
            fd.append("file", document.getElementById("media_upload_file")?.files[0]);
            try {
                const res = await fetch("/api/images/upload", { method: "POST", body: fd });
                if (res.ok) loadMediaGallery();
            } catch (e) {}
        });
    }

    // ===================================================================
    // HISTORY (with checkboxes)
    // ===================================================================
    async function loadHistory() {
        try {
            const q      = document.getElementById("history_search_input")?.value || "";
            const res    = await fetch(`/api/history?q=${encodeURIComponent(q)}`);
            const history = await res.json();
            const tbody   = document.getElementById("history-tbody");
            if (!tbody || !Array.isArray(history)) return;

            if (history.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:rgba(0,0,0,0.5);">No publishing history records found.</td></tr>`;
                updateDeleteSelectedBtn();
                return;
            }

            tbody.innerHTML = history.map(h => `
                <tr>
                    <td><input type="checkbox" class="history-row-check" data-id="${h.id}"></td>
                    <td>
                        <strong>${h.game_name}</strong>
                        ${h.provider ? `<br><span style="font-size:0.8rem;color:var(--text-secondary);">${h.provider}</span>` : ""}
                    </td>
                    <td><span class="badge ${h.status==="Published"?"badge-success":"badge-danger"}">${h.status}</span></td>
                    <td>${h.article_id ? `#${h.article_id}` : "—"}</td>
                    <td style="font-size:0.85rem;">${h.published_at || "—"}</td>
                    <td>
                        <button class="btn-secondary-sm retry-hist-btn" data-id="${h.id}" style="color:#2563EB;">Retry</button>
                        <button class="btn-secondary-sm delete-hist-btn" data-id="${h.id}" style="color:#EF4444;">Delete</button>
                    </td>
                </tr>`).join("");

            // Row checkbox change
            document.querySelectorAll(".history-row-check").forEach(c => c.addEventListener("change", updateDeleteSelectedBtn));

            // Select all
            const selAll = document.getElementById("history-select-all");
            if (selAll) {
                selAll.onchange = () => {
                    document.querySelectorAll(".history-row-check").forEach(c => c.checked = selAll.checked);
                    updateDeleteSelectedBtn();
                };
            }

            // Delete single
            document.querySelectorAll(".delete-hist-btn").forEach(btn => {
                btn.addEventListener("click", async e => {
                    const id = e.target.getAttribute("data-id");
                    if (!confirm("Delete this history record?\n\n⚠ This will NOT delete the WordPress article.")) return;
                    await fetch(`/api/history/${id}`, { method: "DELETE" });
                    loadHistory();
                });
            });

            // Retry
            document.querySelectorAll(".retry-hist-btn").forEach(btn => {
                btn.addEventListener("click", async e => {
                    const id  = e.target.getAttribute("data-id");
                    const res = await fetch(`/api/history/${id}/retry`, { method: "POST" });
                    const d   = await res.json();
                    alert(d.message || "Retry queued!");
                    switchTab("home", navHome);
                });
            });

            updateDeleteSelectedBtn();
        } catch (e) {}
    }

    function updateDeleteSelectedBtn() {
        const selected = document.querySelectorAll(".history-row-check:checked").length;
        const btn      = document.getElementById("btn-delete-selected-history");
        if (btn) {
            btn.disabled    = selected === 0;
            btn.textContent = selected > 0 ? `🗑 Delete Selected (${selected})` : "🗑 Delete Selected";
        }
    }

    const histSearch = document.getElementById("history_search_input");
    if (histSearch) histSearch.addEventListener("input", loadHistory);

    const btnDelSelected = document.getElementById("btn-delete-selected-history");
    if (btnDelSelected) {
        btnDelSelected.addEventListener("click", async () => {
            const ids = [...document.querySelectorAll(".history-row-check:checked")].map(c => parseInt(c.getAttribute("data-id")));
            if (!ids.length) return;
            if (!confirm(`Delete ${ids.length} selected history record(s)?\n\n⚠ This will NOT delete the WordPress articles.`)) return;
            try {
                const params = ids.map(id => `history_ids=${id}`).join("&");
                await fetch(`/api/history/bulk-delete?${params}`, { method: "POST" });
                loadHistory();
            } catch (e) {}
        });
    }

    const btnDelAll = document.getElementById("btn-delete-all-history");
    if (btnDelAll) {
        btnDelAll.addEventListener("click", async () => {
            if (!confirm("Delete ALL history records?\n\n⚠ This will NOT delete the WordPress articles.")) return;
            await fetch("/api/history/bulk-delete?delete_all=true", { method: "POST" });
            loadHistory();
        });
    }

    // ===================================================================
    // HOME — DRAFTS & HISTORY PREVIEWS
    // ===================================================================
    async function loadHomeDrafts() {
        const c = document.getElementById("home-drafts-list");
        if (!c) return;
        try {
            const res    = await fetch("/api/drafts");
            const drafts = await res.json();
            if (!Array.isArray(drafts) || drafts.length === 0) {
                c.innerHTML = `<p style="color:var(--text-secondary);font-size:0.9rem;">No drafts pending review.</p>`;
                return;
            }
            c.innerHTML = drafts.slice(0, 5).map(d => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
                    <div>
                        <strong>${d.game_name}</strong>
                        <span style="font-size:0.8rem;color:var(--text-secondary);margin-left:8px;">${d.created_at}</span>
                    </div>
                    <button class="btn-secondary-sm" data-draft-id="${d.id}" style="font-size:0.8rem;">Publish</button>
                </div>`).join("");
        } catch (e) { c.innerHTML = `<p style="color:var(--text-secondary);font-size:0.9rem;">Unable to load drafts.</p>`; }
    }

    async function loadHomeHistory() {
        const c = document.getElementById("home-history-list");
        if (!c) return;
        try {
            const res     = await fetch("/api/history?q=");
            const history = await res.json();
            if (!Array.isArray(history) || history.length === 0) {
                c.innerHTML = `<p style="color:var(--text-secondary);font-size:0.9rem;">No published articles yet.</p>`;
                return;
            }
            c.innerHTML = history.slice(0, 5).map(h => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
                    <div>
                        <strong>${h.game_name}</strong>
                        <span class="badge ${h.status==="Published"?"badge-success":"badge-danger"}" style="margin-left:8px;">${h.status}</span>
                    </div>
                    <span style="font-size:0.8rem;color:var(--text-secondary);">${h.published_at || "—"}</span>
                </div>`).join("");
        } catch (e) { c.innerHTML = `<p style="color:var(--text-secondary);font-size:0.9rem;">Unable to load history.</p>`; }
    }

    // ===================================================================
    // DRAFTS PAGE
    // ===================================================================
    async function loadDraftsPage() {
        const c = document.getElementById("drafts-container-page");
        if (!c) return;
        try {
            const res    = await fetch("/api/drafts");
            const drafts = await res.json();
            if (!Array.isArray(drafts) || drafts.length === 0) {
                c.innerHTML = `<p style="color:var(--text-secondary);">No drafts pending review.</p>`;
                return;
            }
            c.innerHTML = drafts.map(d => `
                <div style="background:white;border:1px solid rgba(0,0,0,0.08);padding:16px;border-radius:12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div>
                        <strong style="font-size:1.05rem;color:var(--text-primary);">${d.game_name} (${d.provider})</strong>
                        <div style="font-size:0.85rem;color:var(--text-secondary);">${d.created_at}</div>
                    </div>
                    <button class="btn-primary publish-draft-btn" data-id="${d.id}" style="padding:8px 16px;font-size:0.9rem;">🚀 Publish to WordPress</button>
                </div>`).join("");

            c.querySelectorAll(".publish-draft-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.getAttribute("data-id");
                    if (!confirm("Publish this draft to WordPress?")) return;
                    const res = await fetch(`/api/publish/${id}`, { method: "POST" });
                    const d   = await res.json();
                    alert(d.message || "Published!");
                    loadDraftsPage();
                });
            });
        } catch (e) {}
    }

    // ===================================================================
    // JOBS
    // ===================================================================
    async function loadJobsHome() {
        try {
            const res  = await fetch("/api/user/jobs?status_filter=ALL");
            const jobs = await res.json();
            const tbody = document.getElementById("jobs-tbody-home");
            if (!tbody || !Array.isArray(jobs)) return;

            const running = jobs.filter(j => j.status === "PROCESSING" || j.status === "QUEUED").length;
            const badge   = document.getElementById("badge-jobs-running");
            if (badge) badge.textContent = `${running} Running`;

            if (jobs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:rgba(0,0,0,0.5);">No active jobs found.</td></tr>`;
                return;
            }

            tbody.innerHTML = jobs.map(j => `
                <tr>
                    <td><strong>${j.game_name || "Job"}</strong><br><span style="font-size:0.8rem;color:var(--text-secondary);">${j.provider || ""}</span></td>
                    <td><span class="badge ${j.status==="FAILED"?"badge-danger":j.status==="PROCESSING"?"badge-warning":"badge-success"}">${j.status}</span></td>
                    <td><code style="background:rgba(0,0,0,0.06);padding:3px 8px;border-radius:4px;font-size:0.8rem;">${j.current_stage || "QUEUED"}</code></td>
                    <td>${j.duration ? j.duration.toFixed(1) + "s" : "—"}</td>
                    <td><button class="btn-secondary-sm view-timeline-btn" data-job-id="${j.job_id}">Timeline</button></td>
                </tr>`).join("");
        } catch (e) {}
    }

    // ===================================================================
    // SETTINGS
    // ===================================================================
    async function loadSettings() {
        try {
            const res  = await fetch("/api/settings");
            if (!res.ok) return;
            const data = await res.json();
            if (data.wp_url      && document.getElementById("set_wp_url"))      document.getElementById("set_wp_url").value      = data.wp_url;
            if (data.wp_username && document.getElementById("set_wp_username")) document.getElementById("set_wp_username").value = data.wp_username;
            if (data.theme_type  && document.getElementById("set_theme_type"))  document.getElementById("set_theme_type").value  = data.theme_type;
            if (data.seo_plugin  && document.getElementById("set_seo_plugin"))  document.getElementById("set_seo_plugin").value  = data.seo_plugin;
        } catch (e) {}
    }

    const setupForm = document.getElementById("setup-form");
    if (setupForm) {
        setupForm.addEventListener("submit", async e => {
            e.preventDefault();
            const payload = {
                wp_url:        document.getElementById("set_wp_url")?.value      || "",
                wp_username:   document.getElementById("set_wp_username")?.value || "",
                wp_app_password: document.getElementById("set_wp_password")?.value || "",
                theme_type:    document.getElementById("set_theme_type")?.value   || "standard",
                seo_plugin:    document.getElementById("set_seo_plugin")?.value   || "none"
            };
            try {
                const res = await fetch("/api/settings", {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(payload)
                });
                const status = document.getElementById("setup-status");
                if (status) {
                    status.className = res.ok ? "success-msg" : "error-msg";
                    status.textContent = res.ok ? "✓ Settings saved!" : "Failed to save settings.";
                    status.classList.remove("hidden");
                    setTimeout(() => status.classList.add("hidden"), 3000);
                }
            } catch (err) {}
        });
    }

    // ===================================================================
    // WEBSITES
    // ===================================================================
    async function loadWebsitesView() {
        try {
            const res  = await fetch("/api/settings");
            const data = await res.json();
            const urlEl  = document.getElementById("site_display_url");
            const userEl = document.getElementById("site_display_user");
            if (urlEl  && data.wp_url)      urlEl.textContent  = data.wp_url;
            if (userEl && data.wp_username) userEl.textContent = `Username: ${data.wp_username}`;
        } catch (e) {}
    }

    // ===================================================================
    // USAGE / QUOTA
    // ===================================================================
    async function loadUsage() {
        try {
            const res  = await fetch("/api/user/usage");
            if (res.status === 401) { window.location.href = "/login.html"; return; }
            const data = await res.json();
            if (data.plan) {
                const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
                setT("user-plan-pill",    `Plan: ${data.plan.toUpperCase()}`);
                setT("user-quota-pill",   `Quota: ${data.monthly_usage} / ${data.article_limit}`);
                setT("stat-published",    data.published_count     || 0);
                setT("stat-drafts",       data.total_drafts        || 0);
                setT("stat-templates",    data.total_templates     || userTemplates.length || 1);
                setT("stat-quota-used",   `${data.usage_percentage}%`);
            }
        } catch (e) {}
    }

    // ===================================================================
    // DEV MODE
    // ===================================================================
    if (devModeCheckbox) {
        devModeCheckbox.addEventListener("change", () => {
            if (devModeCheckbox.checked) {
                devModeDrawer?.classList.remove("hidden");
                updateDevDiagnostics();
            } else {
                devModeDrawer?.classList.add("hidden");
            }
        });
    }

    function updateDevDiagnostics() {
        if (!devUuidContainer || !activeTemplate) return;
        devUuidContainer.innerHTML = `
            <strong>Active Template ID:</strong> ${activeTemplate.id}<br/>
            <strong>Section UUID Mappings:</strong><br/>
            ${activeTemplate.sections.map(s => `• ${s.name} ➔ <code>${s.id}</code>`).join("<br/>")}`;
    }

    // ===================================================================
    // AUTH / ROLE CHECK
    // ===================================================================
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

    // ===================================================================
    // BOOTSTRAP
    // ===================================================================
    switchTab("home", navHome);
    loadTemplates().then(() => loadActiveFormat());
    checkRole();

    // Auto-refresh jobs every 5 seconds when home tab is active
    setInterval(() => {
        const home = document.getElementById("view-home");
        if (home && !home.classList.contains("hidden")) loadJobsHome();
    }, 5000);

}); // end DOMContentLoaded
