export default class Store {
  constructor() {
    // I initialize my reactive Pub/Sub event listeners and state store
    this.subscribers = {};
    this.state = {};
  }

  // I set state values and notify registered subscribers
  setState(key, value) {
    this.state[key] = value;
    if (this.subscribers[key]) {
      this.subscribers[key].forEach(callback => callback(value));
    }
  }

  // I retrieve current state values
  getState(key) {
    return this.state[key];
  }

  // I allow components to subscribe to state changes
  subscribe(key, callback) {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    this.subscribers[key].push(callback);
  }
}