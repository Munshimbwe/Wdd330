export function setTitle(course) {
  const courseName = document.querySelector("#courseName");
  const courseCode = document.querySelector("#courseCode");
  courseName.innerHTML = course.name;
  courseCode.innerHTML = course.code;
}

export function renderSections(sections) {
  const html = sections.map(
    (section) => `<tr>
      <td>${section.sectionNum}</td>
      <td>${section.enrolled}</td>
      <td>${section.instructor}</td>
    </tr>`
  );
  document.querySelector("#sections").innerHTML = html.join("");
}
