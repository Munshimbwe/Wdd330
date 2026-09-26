import { getLocalStorage, setLocalStorage } from "./utils.mjs";

class Store {
  constructor() {
    // Initialize state from localStorage or set up default baseline structure
    this.state = getLocalStorage("health_app_state") || {
      patientLogs: [],
      screenings: [],
      activePatient: null,
      analyticsQueue: []
    };
    this.listeners = [];
  }

  // Get current immutable state copy or reference
  getState() {
    return this.state;
  }

  // Subscribe UI components to state updates
  subscribe(listener) {
    this.listeners.push(listener);
    // Return an unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Update state, sync to localStorage, and trigger all component listeners
  setState(newState) {
    this.state = { ...this.state, ...newState };
    setLocalStorage("health_app_state", this.state);
    this.notify();
  }

  // Notify all active listeners of state changes
  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  // Helper method to add a clinical patient log
  addPatientLog(log) {
    const updated = [log, ...this.state.patientLogs];
    this.setState({ patientLogs: updated });
  }

  // Helper method to add a screening result
  addScreening(screening) {
    const updated = [screening, ...this.state.screenings];
    this.setState({ screenings: updated });
  }
}

// Export a singleton instance across the application
export const store = new Store();