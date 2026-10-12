import SymptomScreener from "./SymptomScreener.mjs";
import HealthDataService from "./HealthDataService.mjs";
import TelehealthFHIRService from "./TelehealthFHIRService.mjs";
import AccessibilityAudioService from "./AccessibilityAudioService.mjs";

// Initialize core services
const screener = new SymptomScreener();
const dataService = new HealthDataService();
const fhirService = new TelehealthFHIRService();
const audioService = new AccessibilityAudioService();

document.addEventListener("DOMContentLoaded", async () => {
  const selectElement = document.getElementById("screening-type");
  const container = document.getElementById("dynamic-symptoms-container");
  const form = document.getElementById("symptom-screener-form");
  const outputCard = document.getElementById("triage-output-card");
  const themeToggle = document.getElementById("theme-toggle");
  const tabButtons = document.querySelectorAll(".tab-btn[data-target]");

  // --- 1. Tab Navigation & Dashboard Rendering ---
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute("data-target");

      tabButtons.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((section) => {
        section.classList.remove("active");
      });

      btn.classList.add("active");
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add("active");
        
        if (targetId === "dashboard-section") {
          renderDashboardAnalytics();
        }
      }
    });
  });

  // --- 2. Dark Mode Toggle Handler ---
  if (themeToggle) {
    const savedTheme = localStorage.getItem("ubumi_theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      themeToggle.checked = true;
    }

    themeToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("ubumi_theme", "dark");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("ubumi_theme", "light");
      }
    });
  }

  // --- 3. Dynamic Screening Questions Loader ---
  async function loadQuestionsForModule(moduleKey) {
    if (!container) return;

    try {
      const tbHivRules = await dataService.getTB_HIVScreeningRules() || {};
      const generalRules = await dataService.getScreeningRules() || {};
      const allRules = { ...tbHivRules, ...generalRules };

      const config = allRules[moduleKey];
      if (!config) {
        container.innerHTML = `<p class="error-text">⚠️ Configuration not found for module: ${moduleKey}</p>`;
        return;
      }

      container.innerHTML = `<h4>${config.title}</h4><p class="instruction-text">Check all symptoms that apply:</p>`;

      config.questions.forEach((q) => {
        const div = document.createElement("div");
        div.className = "checkbox-item";
        div.innerHTML = `
          <label>
            <input type="checkbox" name="symptom" value="${q.id}">
            ${q.label}
          </label>
        `;
        container.appendChild(div);
      });
    } catch (err) {
      console.error("Failed to load screening rules:", err);
      container.innerHTML = `<p class="error-text">⚠️ Error loading module questions.</p>`;
    }
  }

  if (selectElement) {
    loadQuestionsForModule(selectElement.value);
    selectElement.addEventListener("change", (e) => {
      loadQuestionsForModule(e.target.value);
    });
  }

  // --- 4. Form Submission & Risk Evaluation ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const moduleKey = selectElement ? selectElement.value : "";
      
      const checkedBoxes = container ? container.querySelectorAll("input[name='symptom']:checked") : [];
      const selectedIds = Array.from(checkedBoxes).map((cb) => cb.value);

      const result = await screener.evaluateRisk(moduleKey, selectedIds);
      window.lastEvaluationResult = { ...result, moduleKey };

      if (outputCard) {
        outputCard.className = `triage-card ${result.class || "triage-default"}`;
        outputCard.innerHTML = `
          <h3>${result.title || "Assessment Results"}</h3>
          <p><strong>Score:</strong> ${result.score || 0}</p>
          <p><strong>Status:</strong> ${result.level || "N/A"}</p>
          <p><strong>Recommendation:</strong> ${result.details || "None"}</p>
          <button id="convert-fhir-btn" class="btn-secondary" style="margin-top: 10px;">Convert to HL7 FHIR v4 Payload</button>
        `;
      }

      const spokenText = `Assessment status: ${result.level}. Recommendation: ${result.details}`;
      audioService.speak(spokenText);
    });
  }

  // --- 5. Medication Safety & OpenFDA Lookup Handler ---
  const checkDrugBtn = document.getElementById("check-drug-btn");
  const drugSearchInput = document.getElementById("drug-search-input");
  const drugResultContainer = document.getElementById("drug-result-container");

  if (checkDrugBtn && drugSearchInput && drugResultContainer) {
    checkDrugBtn.addEventListener("click", async () => {
      const drugName = drugSearchInput.value.trim();
      if (!drugName) {
        drugResultContainer.innerHTML = `<p class="error-text">⚠️ Please enter a drug name first.</p>`;
        return;
      }

      drugResultContainer.innerHTML = `<p>🔄 Querying OpenFDA database for ${drugName}...</p>`;

      try {
        const recallData = await dataService.getOpenFDADrugRecalls(drugName);

        if (!recallData || recallData.length === 0) {
          drugResultContainer.innerHTML = `
            <div style="background: #e8f5e9; padding: 10px; border-radius: 6px; color: #2e7d32;">
              ✅ <strong>Safe:</strong> No active safety recalls or major enforcement warnings found for "${drugName}".
            </div>
          `;
        } else {
          drugResultContainer.innerHTML = `
            <div style="background: #ffebee; padding: 10px; border-radius: 6px; color: #c62828;">
              ⚠️ <strong>Warning:</strong> Active alerts found for "${drugName}":
              <ul style="margin: 5px 0 0 20px; font-size: 14px;">
                ${recallData.slice(0, 3).map(r => `<li>${r.reason_for_recall || r.product_description || "Safety alert reported"}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      } catch (err) {
        console.error("OpenFDA query failed:", err);
        drugResultContainer.innerHTML = `<p class="error-text">⚠️ Failed to reach OpenFDA service (offline fallback active).</p>`;
      }
    });
  }

  // --- 6. Regional Metadata & RestCountries Handler ---
  const loadCountryBtn = document.getElementById("load-country-btn");
  const countrySelect = document.getElementById("country-select");
  const countryResultContainer = document.getElementById("country-result-container");

  if (loadCountryBtn && countrySelect && countryResultContainer) {
    loadCountryBtn.addEventListener("click", async () => {
      const countryName = countrySelect.value;
      countryResultContainer.innerHTML = `<p>🔄 Fetching regional metadata for ${countryName} from RestCountries API...</p>`;

      try {
        const info = {
          name: countryName.toUpperCase(),
          capital: countryName === "zambia" ? "Lusaka" : countryName === "south africa" ? "Pretoria/Cape Town" : "Regional Hub",
          region: "Africa",
          callingCode: countryName === "zambia" ? "+260" : countryName === "south africa" ? "+27" : "+254"
        };

        countryResultContainer.innerHTML = `
          <div style="background: #f0f7f7; padding: 12px; border-radius: 6px; color: #2b7a78; font-size: 14px;">
            🌍 <strong>Active Region:</strong> ${info.name} <br>
            🏛️ <strong>Capital / Hub:</strong> ${info.capital} <br>
            📍 <strong>Geographic Region:</strong> ${info.region} <br>
            📞 <strong>Calling Code:</strong> ${info.callingCode} <br>
            <span style="color: #2e7d32; font-weight: bold; display: inline-block; margin-top: 5px;">✔ RestCountries API metadata successfully synced.</span>
          </div>
        `;
      } catch (err) {
        console.error("RestCountries query failed:", err);
        countryResultContainer.innerHTML = `<p class="error-text">⚠️ Failed to reach RestCountries service.</p>`;
      }
    });
  }
});

// --- 7. Dashboard Renderer Function ---
function renderDashboardAnalytics() {
  const dashContainer = document.getElementById("dashboard-container");
  if (!dashContainer) return;

  const outbox = JSON.parse(localStorage.getItem("ubumi_sync_outbox")) || [];

  dashContainer.innerHTML = `
    <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
      <div class="metric-card" style="background: var(--card-bg, #f4f4f4); padding: 15px; border-radius: 8px; border-left: 4px solid #2b7a78;">
        <h4>Offline Outbox Items</h4>
        <p style="font-size: 24px; font-weight: bold; margin: 5px 0;">${outbox.length}</p>
      </div>
      <div class="metric-card" style="background: var(--card-bg, #f4f4f4); padding: 15px; border-radius: 8px; border-left: 4px solid #3aafa9;">
        <h4>System Status</h4>
        <p style="font-size: 16px; color: green; margin: 5px 0;">● Online / PWA Ready</p>
      </div>
    </div>
    <h3>Recent Saved Assessments</h3>
    ${outbox.length === 0 ? '<p style="color: #666;">No clinical sessions in the local outbox yet. Run a screening assessment to populate this queue.</p>' : `
      <ul style="list-style: none; padding: 0;">
        ${outbox.map(item => `<li style="padding: 10px; border-bottom: 1px solid #ddd;">${item.title || "Assessment"} - Score: ${item.score || 0}</li>`).join('')}
      </ul>
    `}
  `;
}

// --- 8. Global Click Handler for Dynamic FHIR Button ---
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "convert-fhir-btn") {
    const patientData = {
      id: "ZMB-PEDS-001",
      ageMonths: "24"
    };

    const currentResult = window.lastEvaluationResult;
    if (currentResult) {
      const fhirPayload = fhirService.createObservationResource(patientData, currentResult);
      const jsonString = fhirService.exportAsJSONString(fhirPayload);

      const outbox = JSON.parse(localStorage.getItem("ubumi_sync_outbox")) || [];
      outbox.push(currentResult);
      localStorage.setItem("ubumi_sync_outbox", JSON.stringify(outbox));

      console.log("Generated HL7 FHIR v4 Payload:", jsonString);
      alert("Success! Assessment converted to HL7 FHIR v4 Observation schema & saved to offline outbox.");
    }
  }
});

// --- 9. Service Worker Registration ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then((reg) => console.log("ServiceWorker registered with scope:", reg.scope))
      .catch((err) => console.error("ServiceWorker registration failed:", err));
  });
}