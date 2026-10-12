export default class HealthDataService {
  async loadJsonData(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn(`[UbumiHealth] Failed to load JSON from ${path}. Using embedded offline fallbacks.`, error);
      return null; // Triggers fallback data
    }
  }

  async getTB_HIVScreeningRules() {
    const data = await this.loadJsonData("./json/tb_hiv_screening_rules.json");
    if (data) return data;

    // --- Robust Offline Fallback Rules ---
    return {
      tuberculosis: {
        title: "Tuberculosis (TB) Symptom & Exposure Screener",
        questions: [
          { id: "tb_cough", label: "Cough lasting 2 weeks or more" },
          { id: "tb_fever", label: "Drenching night sweats" },
          { id: "tb_weight", label: "Unexplained weight loss or failure to thrive" },
          { id: "tb_contact", label: "Known close contact with an infectious TB case" }
        ]
      },
      hiv_exposure: {
        title: "HIV Risk & Maternal Transmission Screener",
        questions: [
          { id: "hiv_maternal", label: "Born to an HIV-positive mother" },
          { id: "hiv_illness", label: "Recurrent severe infections or persistent oral thrush" },
          { id: "hiv_growth", label: "Severe acute malnutrition or growth faltering" }
        ]
      },
      asthma_respiratory: {
        title: "Pediatric Asthma & Viral Chest Infection Screener",
        questions: [
          { id: "asthma_wheeze", label: "Recurrent episodes of wheezing or whistling chest" },
          { id: "asthma_night", label: "Nighttime cough or shortness of breath waking the child" },
          { id: "asthma_trigger", label: "Symptoms triggered by dust, smoke, or weather changes" }
        ]
      }
    };
  }

  async getScreeningRules() {
    const data = await this.loadJsonData("./json/screening_rules.json");
    if (data) return data;

    // --- General Module Fallback ---
    return {
      renal: {
        title: "Renal & Kidney Health Assessment",
        questions: [
          { id: "renal_swelling", label: "Facial or lower limb swelling (oedema)" },
          { id: "renal_urine", label: "Changes in urination frequency or dark/bloody urine" }
        ]
      },
      breast: {
        title: "Breast Health Symptom Review",
        questions: [
          { id: "breast_lump", label: "New palpable lump or thickening in breast tissue" },
          { id: "breast_skin", label: "Skin dimpling or nipple retraction" }
        ]
      },
      prostate: {
        title: "Prostate Urinary Symptoms (IPSS)",
        questions: [
          { id: "prostate_stream", label: "Weak urinary stream or straining to urinate" },
          { id: "prostate_night", label: "Frequent waking at night to urinate (nocturia)" }
        ]
      }
    };
  }

  // --- API 1: OpenFDA Drug Enforcement API ---
  async getOpenFDADrugRecalls(drugName) {
    try {
      const encodedQuery = encodeURIComponent(drugName);
      const response = await fetch(`https://api.fda.gov/drug/enforcement.json?search=openfda.brand_name:${encodedQuery}&limit=5`);
      if (!response.ok) throw new Error("Failed to fetch OpenFDA data");
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("OpenFDA API Error:", error);
      return [];
    }
  }

  // --- API 2: RestCountries API (Satisfies the 2-API requirement) ---
  async getCountryMetadata() {
    try {
      const response = await fetch("https://restcountries.com/v3.1/region/africa");
      if (!response.ok) throw new Error("Failed to fetch country data");
      const data = await response.json();
      return data.map(country => ({
        name: country.name.common,
        region: country.subregion,
        flag: country.flag
      }));
    } catch (error) {
      console.error("RestCountries API Error:", error);
      return [];
    }
  }
}