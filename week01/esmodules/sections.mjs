export function setSectionSelection(sections) {
  const sectionElement = document.querySelector("#sectionNumber");
  // Removed "byuiCourse." from the start of the loop
  const html = sections.map(
    (section) => `<option value="${section.sectionNum}">${section.sectionNum}</option>`
  );
  sectionElement.innerHTML = html.join("");
}
