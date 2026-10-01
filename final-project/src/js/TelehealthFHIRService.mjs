export default class TelehealthFHIRService {
  constructor() {
    // I define my standard FHIR observation code system URI
    this.systemUri = "http://ubumihealth.org/fhir/codesystem/triage-evaluations";
  }

  // I convert completed clinical evaluations into standard HL7 FHIR v4 Observation resources
  createObservationResource(patient, evaluationResult) {
    const timestamp = new Date().toISOString();

    const fhirObservation = {
      resourceType: "Observation",
      id: `ubumi-obs-${Date.now()}`,
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "exam",
              display: "Exam / Clinical Screening"
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: this.systemUri,
            code: evaluationResult.moduleKey || "general-screening",
            display: evaluationResult.title
          }
        ],
        text: evaluationResult.title
      },
      subject: {
        reference: `Patient/${patient.id || "anonymous-child"}`,
        display: `Age: ${patient.ageMonths || "Unknown"} months`
      },
      effectiveDateTime: timestamp,
      issued: timestamp,
      valueString: `${evaluationResult.level} - Score: ${evaluationResult.score || 0}`,
      interpretation: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
              code: evaluationResult.class === "danger" ? "H" : evaluationResult.class === "warning" ? "N" : "L",
              display: evaluationResult.level
            }
          ],
          text: evaluationResult.details
        }
      ]
    };

    return fhirObservation;
  }

  // I format observation records into JSON strings for export or transmission
  exportAsJSONString(fhirResource) {
    return JSON.stringify(fhirResource, null, 2);
  }
}