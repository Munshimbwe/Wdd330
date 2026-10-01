export default class VitalsTracker {
  constructor() {
    // I initialize thresholds for pediatric vitals and MUAC malnutrition metrics
    this.muacSevereThreshold = 11.5; // cm
    this.muacModerateThreshold = 12.5; // cm
  }

  // I evaluate pediatric MUAC measurements against WHO acute malnutrition standards
  evaluateMUAC(muacCm) {
    const value = parseFloat(muacCm);
    if (value < this.muacSevereThreshold) {
      return { status: "Severe Acute Malnutrition (SAM)", class: "danger", action: "I advise immediate inpatient stabilization and therapeutic feeding." };
    } else if (value < this.muacModerateThreshold) {
      return { status: "Moderate Acute Malnutrition (MAM)", class: "warning", action: "I advise supplementary feeding and outpatient nutritional support." };
    }
    return { status: "Normal Nutritional Status", class: "success", action: "I confirm MUAC measurements are within safe parameters." };
  }

  // I evaluate respiratory rates against age-based WHO thresholds
  evaluateRespirationRate(breathsPerMin, ageMonths) {
    const bpm = parseInt(breathsPerMin, 10);
    const age = parseInt(ageMonths, 10);

    let threshold = 50; // Default infant threshold (2-11 months)
    if (age < 2) {
      threshold = 60; // Newborn threshold (0-2 months)
    } else if (age >= 12) {
      threshold = 40; // Toddler/Child threshold (12+ months)
    }

    if (bpm > threshold) {
      return { urgent: true, message: `I detected fast breathing (${bpm} bpm exceeds threshold of ${threshold} bpm for age). Urgent triage needed.` };
    }
    return { urgent: false, message: "I verified respiration rate is within normal limits for age." };
  }
}