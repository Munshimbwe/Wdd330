// Wrapper for querySelector... returns matching element
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

// Wrapper for querySelectorAll... returns NodeList array
export function qsa(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

// Retrieve data safely from localStorage
export function getLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return null;
  }
}

// Save data securely to localStorage
export function setLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
}

// Set a listener for both touchend and click to support mobile & desktop seamlessly
export function setClick(selector, callback) {
  const element = qs(selector);
  if (element) {
    element.addEventListener("touchend", (event) => {
      event.preventDefault();
      callback(event);
    });
    element.addEventListener("click", callback);
  }
}

// Render template helper utility for dynamic component population
export function renderListWithTemplate(templateFn, parentElement, list, position = "afterbegin", clear = false) {
  if (clear) {
    parentElement.innerHTML = "";
  }
  const htmlStrings = list.map(templateFn);
  parentElement.insertAdjacentHTML(position, htmlStrings.join(""));
}