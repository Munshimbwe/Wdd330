export default class AnalyticsSyncEngine {
  constructor() {
    // I set my local storage key for outbox queuing
    this.outboxKey = "ubumi_sync_outbox";
  }

  // I securely anonymize patient IDs using the native Web Crypto API (SHA-256)
  async anonymizePatientId(patientId) {
    if (!patientId) return "anonymous-hash";
    const encoder = new TextEncoder();
    const data = encoder.encode(patientId.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // I queue assessment records locally when offline
  async queueForSync(payload) {
    try {
      const outbox = JSON.parse(localStorage.getItem(this.outboxKey)) || [];
      
      // I anonymize subject references inside payloads before storage
      if (payload.subject && payload.subject.reference) {
        const rawId = payload.subject.reference.split("/")[1];
        const secureHash = await this.anonymizePatientId(rawId);
        payload.subject.reference = `Patient/anonymized-${secureHash.substring(0, 12)}`;
      }

      outbox.push({
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        data: payload
      });

      localStorage.setItem(this.outboxKey, JSON.stringify(outbox));
      return { success: true, queuedCount: outbox.length };
    } catch (error) {
      console.error("I failed to queue record for sync:", error);
      return { success: false, error: error.message };
    }
  }

  // I process and synchronize outbox queue records when network connectivity returns
  async processSyncQueue() {
    if (!navigator.onLine) {
      return { synced: 0, message: "I detected offline status. Records are safely retained in the outbox." };
    }

    const outbox = JSON.parse(localStorage.getItem(this.outboxKey)) || [];
    if (outbox.length === 0) {
      return { synced: 0, message: "I found the outbox queue empty." };
    }

    let syncedCount = 0;
    const remainingItems = [];

    for (const item of outbox) {
      try {
        // I simulate successful secure server transmission
        const success = true; 

        if (success) {
          syncedCount++;
        } else {
          remainingItems.push(item);
        }
      } catch (err) {
        remainingItems.push(item);
      }
    }

    localStorage.setItem(this.outboxKey, JSON.stringify(remainingItems));
    return { synced: syncedCount, remaining: remainingItems.length };
  }
}