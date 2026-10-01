import SymptomScreener from "./SymptomScreener.mjs";
import HealthDataService from "./HealthDataService.mjs";
import TelehealthFHIRService from "./TelehealthFHIRService.mjs";
import AccessibilityAudioService from "./AccessibilityAudioService.mjs";

// I initialize my service instances here
const screener = new SymptomScreener();
const dataService = new HealthDataService();
const fhirService = new TelehealthFHIRService();
const audioService = new AccessibilityAudioService();

document.addEventListener("DOMContentLoaded", async () => {
  const selectElement = document.getElementById("screening-type");
  const container = document.getElementById("dynamic-symptoms-container"); // Note: check your HTML ID for this container!
  const form = document.getElementById("screener-form"); // Updated to match your HTML form ID
  const outputCard = document.getElementById("screener-output"); // Updated to match your HTML output ID

  // --- 1. Tab Navigation Switching Handler ---
  const tabButtons = document.querySelectorAll(".tab-btn[data-target]");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute("data-target");

      // Remove active class from all buttons and sections
      tabButtons.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((section) => {
        section.classList.remove("active");
      });

      // Add active class to clicked button and target section
      btn.classList.add("active");
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add("active");
      }
    });
  });

  // --- 2. Dark Mode Toggle Handler ---
  const themeToggle = document.getElementById("theme-toggle");
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

  // --- 3. Screening Questions Dynamic Loader ---
  async function loadQuestionsForModule(moduleKey) {
    const tbHivRules = await dataService.getTB_HIVScreeningRules() || {};
    const generalRules = await dataService.getScreeningRules() || {};
    const allRules = { ...tbHivRules, ...generalRules };

    const config = allRules[moduleKey];
    if (!config || !container) return;

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
        outputCard.className = `results-container active ${result.class || ""}`;
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
});

// --- 5. HL7 FHIR Conversion Global Listener ---
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "convert-fhir-btn") {
    const patientData = {
      id: document.getElementById("patient-id")?.value || "ZMB-PEDS-001",
      ageMonths: document.getElementById("patient-age")?.value || "24"
    };

    const currentResult = window.lastEvaluationResult;

    if (currentResult) {
      const fhirPayload = fhirService.createObservationResource(patientData, currentResult);
      const jsonString = fhirService.exportAsJSONString(fhirPayload);

      console.log("I generated the HL7 FHIR v4 Payload:", jsonString);
      alert("Success! Assessment converted to HL7 FHIR v4 Observation schema. Check console outbox.");
    }
  }
});

// --- 6. Service Worker Registration ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then((registration) => {
        console.log("I registered the UbumiHealth ServiceWorker with scope: ", registration.scope);
      })
      .catch((error) => {
        console.error("I failed to register the ServiceWorker: ", error);
      });
  });
}