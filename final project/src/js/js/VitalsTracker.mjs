export default class VitalsTracker {
  // Evaluates Middle-Upper Arm Circumference (MUAC) for 6–60 months
  static evaluateMUAC(muacCm) {
    const val = parseFloat(muacCm);
    if (isNaN(val)) {
      return { status: "Invalid Input", class: "danger", action: "Please enter a valid numeric value." };
    }

    if (val < 11.5) {
      return {
        status: "Severe Acute Malnutrition (SAM)",
        class: "danger",
        action: "Urgent: Immediate therapeutic feeding & medical triage required."
      };
    } else if (val >= 11.5 && val < 12.5) {
      return {
        status: "Moderate Acute Malnutrition (MAM)",
        class: "warning",
        action: "Provide supplementary high-energy foods and re-assess weekly."
      };
    }
    return {
      status: "Normal Nutrition Status",
      class: "success",
      action: "Maintain age-appropriate balanced diet."
    };
  }

  // Evaluates Respiratory Rates against age cutoffs
  static evaluateBreathing(ageMonths, bpm) {
    const age = parseInt(ageMonths, 10);
    const rate = parseInt(bpm, 10);
    
    if (isNaN(age) || isNaN(rate)) {
      return { isFast: false, status: "Invalid Input", class: "danger" };
    }

    let fast = false;

    if (age < 2 && rate >= 60) fast = true;
    else if (age >= 2 && age < 12 && rate >= 50) fast = true;
    else if (age >= 12 && age <= 60 && rate >= 40) fast = true;

    return {
      isFast: fast,
      status: fast ? "Rapid Breathing Detected" : "Normal Breathing Rate",
      class: fast ? "warning" : "success"
    };
  }

  // Evaluates Pediatric Oxygen Saturation (SpO2)
  static evaluateSpO2(spo2) {
    const val = parseFloat(spo2);
    if (isNaN(val)) {
      return { status: "Invalid Input", class: "danger", alert: true };
    }

    if (val < 90) {
      return { status: "Severe Hypoxia", class: "danger", alert: true };
    } else if (val >= 90 && val < 95) {
      return { status: "Mild Hypoxia", class: "warning", alert: false };
    }
    return { status: "Normal Oxygenation", class: "success", alert: false };
  }
}