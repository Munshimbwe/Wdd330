export default class SymptomScreener {
  static evaluateRisk(moduleType, selectedSymptomsCount) {
    if (selectedSymptomsCount >= 2) {
      return {
        level: "High Risk - Clinical Follow-up Advised",
        class: "danger",
        details: `Multiple critical indicators recorded for ${moduleType} screening. Refer to specialist.`
      };
    } else if (selectedSymptomsCount === 1) {
      return {
        level: "Moderate Risk - Monitor Patient",
        class: "warning",
        details: `Single indicator noted for ${moduleType}. Schedule re-evaluation in 14 days.`
      };
    }
    return {
      level: "Low Risk - Normal Parameters",
      class: "success",
      details: `No acute risk factors detected for ${moduleType} screening.`
    };
  }
}