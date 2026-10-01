import HealthDataService from "./HealthDataService.mjs";

export default class SymptomScreener {
  constructor() {
    // I instantiate my data service to retrieve screening rules
    this.dataService = new HealthDataService();
  }

  // I evaluate risk scores based on selected symptom checklists
  async evaluateRisk(moduleKey, selectedSymptomIds = []) {
    // I load both standard and infectious disease rulesets
    const tbHivRules = await this.dataService.getTB_HIVScreeningRules() || {};
    const generalRules = await this.dataService.getScreeningRules() || {};

    const allRules = { ...tbHivRules, ...generalRules };
    const moduleConfig = allRules[moduleKey];

    if (!moduleConfig) {
      return {
        title: "Unknown Module",
        level: "Error",
        class: "danger",
        details: "I could not locate the selected screening ruleset configuration."
      };
    }

    // I calculate the total weighted score based on user selections
    let totalScore = 0;
    moduleConfig.questions.forEach((q) => {
      if (selectedSymptomIds.includes(q.id)) {
        totalScore += q.weight || 1;
      }
    });

    // I determine the appropriate clinical risk tier
    let riskLevel = "Low";
    let cssClass = "success";
    let recommendation = moduleConfig.recommendations.Low;

    if (totalScore >= moduleConfig.highThreshold) {
      riskLevel = "High Risk - Urgent Action Required";
      cssClass = "danger";
      recommendation = moduleConfig.recommendations.High;
    } else if (totalScore >= moduleConfig.moderateThreshold) {
      riskLevel = "Moderate Risk - Clinical Follow-up Advised";
      cssClass = "warning";
      recommendation = moduleConfig.recommendations.Moderate;
    }

    return {
      title: moduleConfig.title,
      score: totalScore,
      level: riskLevel,
      class: cssClass,
      details: recommendation
    };
  }
}