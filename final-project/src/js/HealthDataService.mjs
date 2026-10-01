export default class HealthDataService {
  constructor() {
    // I set my base paths for local JSON data assets
    this.jsonBasePath = "./json";
  }

  // I fetch JSON data safely from local assets
  async loadJsonData(filename) {
    try {
      const response = await fetch(`${this.jsonBasePath}/${filename}`);
      if (!response.ok) {
        throw new Error(`I failed to load data from ${filename}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("I encountered an error loading JSON data:", error);
      return null;
    }
  }

  // I fetch general health screening rules
  async getScreeningRules() {
    return await this.loadJsonData("screening_rules.json");
  }

  // I fetch specialized TB and HIV infection screening rules
  async getTB_HIVScreeningRules() {
    return await this.loadJsonData("./json/tb_hiv_screening_rules.json");
  }

  // I fetch pediatric dietary nutrition guidelines
  async getPediatricDiet() {
    return await this.loadJsonData("pediatric_diet.json");
  }

  // I fetch live OpenFDA drug safety data when online
  async getOpenFDADrugRecalls(drugName) {
    try {
      const response = await fetch(`https://api.fda.gov/drug/enforcement.json?search=report_date:[20230101+TO+20261231]+AND+product_description:${encodeURIComponent(drugName)}&limit=5`);
      if (!response.ok) throw new Error("I could not reach the OpenFDA network service.");
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.warn("I fell back to offline mode: OpenFDA fetch unavailable.", error);
      return [];
    }
  }
}