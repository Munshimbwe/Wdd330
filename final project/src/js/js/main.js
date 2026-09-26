import { store } from "./Store.mjs";
import { prefs } from "./PreferencesManager.mjs";
import VitalsTracker from "./VitalsTracker.mjs";
import SymptomScreener from "./SymptomScreener.mjs";
import TelehealthFHIRService from "./TelehealthFHIRService.mjs";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Tab Navigation Event Listeners (Click events)
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const targetId = e.target.getAttribute("data-target");
      if (!targetId) return;

      tabButtons.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });
      document.getElementById(targetId).classList.add("active");
    });
  });

  // 2. Network Status Event Handlers (online / offline events)
  const netBadge = document.getElementById("net-status");
  const updateNetworkStatus = () => {
    if (navigator.onLine) {
      netBadge.textContent = "Online";
      netBadge.style.backgroundColor = "var(--success)";
    } else {
      netBadge.textContent = "Offline PWA Mode";
      netBadge.style.backgroundColor = "var(--warning)";
    }
  };
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  updateNetworkStatus();

  // 3. Pediatric Vitals Form Submission Event
  const vitalsForm = document.getElementById("vitals-form");
  if (vitalsForm) {
    vitalsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const patientId = document.getElementById("patient-id").value;
      const age = document.getElementById("patient-age").value;
      const muac = document.getElementById("muac-val").value;
      const bpm = document.getElementById("resp-rate").value;

      const muacResult = VitalsTracker.evaluateMUAC(muac);
      const respResult = VitalsTracker.evaluateBreathing(age, bpm);

      const outputDiv = document.getElementById("vitals-output");
      outputDiv.innerHTML = `
        <div class="card" style="padding:1rem; border-left: 5px solid var(--primary); background:var(--card-bg);">
          <h3>Triage Assessment Results</h3>
          <p><strong>MUAC Status:</strong> <span style="color:var(--danger)">${muacResult.status}</span></p>
          <p><em>${muacResult.action}</em></p>
          <p><strong>Respiration:</strong> ${respResult.status}</p>
        </div>
      `;

      // Save log to state & local storage
      const fhirRecord = TelehealthFHIRService.createObservationPayload(patientId, "Pediatric Triage", muacResult.status);
      store.addPatientLog(fhirRecord);
      renderFHIRRecords();
    });
  }

  // 4. Render FHIR Records from Store
  function renderFHIRRecords() {
    const container = document.getElementById("fhir-records-list");
    if (!container) return;
    const state = store.getState();
    if (state.patientLogs.length === 0) {
      container.innerHTML = "<p>No clinical records stored yet.</p>";
      return;
    }
    container.innerHTML = state.patientLogs.map(log => `
      <div style="background:var(--bg); padding:0.75rem; margin-bottom:0.5rem; border-radius:6px; font-family:monospace; font-size:0.85rem;">
        <pre>${JSON.stringify(log, null, 2)}</pre>
      </div>
    `).join("");
  }
  renderFHIRRecords();
});