export default class TelehealthFHIRService {
  static createObservationPayload(patientId, category, statusText) {
    return {
      resourceType: "Observation",
      id: "healthpulse-" + Date.now(),
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "exam",
              display: category
            }
          ]
        }
      ],
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: new Date().toISOString(),
      interpretation: [
        {
          text: statusText
        }
      ]
    };
  }
}