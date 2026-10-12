import HealthDataService from "./HealthDataService.mjs";

export default class SymptomScreener {
  constructor() {
    this.dataService = new HealthDataService();
  }

  // I evaluate the risk score and triage level based on selected symptom IDs
  async evaluateRisk(moduleKey, selectedIds = []) {
    // Fetch rules from both data services with fallback support
    const tbHivRules = await this.dataService.getTB_HIVScreeningRules() || {};
    const generalRules = await this.dataService.getScreeningRules() || {};
    const allRules = { ...tbHivRules, ...generalRules };

    const config = allRules[moduleKey];
    
    // Safety check if the module configuration isn't found
    if (!config) {
      return {
        title: "Unknown Module",
        level: "Error",
        details: "I could not locate the selected screening ruleset configuration.",
        score: 0,
        class: "triage-error"
      };
    }

    const score = selectedIds.length;
    let level = "Low Risk / Normal";
    let triageClass = "triage-low";
    let details = `No immediate high-risk indicators identified for ${config.title}. Routine clinical follow-up advised.`;

    // Clinical risk stratification based on symptom count
    if (score >= 3) {
      level = "High Risk / Urgent Triage";
      triageClass = "triage-high";
      details = `Multiple critical symptoms detected for ${config.title}. Immediate physical evaluation and diagnostic confirmation recommended.`;
    } else if (score > 0) {
      level = "Moderate Risk / Clinical Review";
      triageClass = "triage-moderate";
      details = `Positive indicators noted for ${config.title}. Schedule a clinical assessment for targeted screening.`;
    }

    return {
      title: config.title,
      score: score,
      level: level,
      details: details,
      class: triageClass
    };
  }
}