export default class HealthDataService {
  constructor() {
    this.cache = {};
  }

  // Generic async loader for local JSON configuration files
  async loadJsonData(filePath) {
    if (this.cache[filePath]) {
      return this.cache[filePath];
    }
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load clinical dataset: ${filePath}`);
      }
      const data = await response.json();
      this.cache[filePath] = data;
      return data;
    } catch (error) {
      console.error("HealthDataService Error:", error);
      return null;
    }
  }

  // Fetch WHO diet and feeding guidelines (0-60 months)
  async getPediatricDietGuidelines() {
    return await this.loadJsonData("./json/pediatric_diet.json");
  }

  // Fetch symptom-to-risk screening rules for organ and cancer checks
  async getScreeningRules() {
    return await this.loadJsonData("./json/screening_rules.json");
  }
}