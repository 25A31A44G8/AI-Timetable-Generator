const subjectsBody = document.getElementById("subjects-body");
const form = document.getElementById("timetable-form");
const formMessage = document.getElementById("form-message");
const timetableWrap = document.getElementById("timetable-wrap");
const timetableGrid = document.getElementById("timetable-grid");
const emptyState = document.getElementById("empty-state");
const subtitle = document.getElementById("timetable-subtitle");
const summary = document.getElementById("summary");
const downloadButton = document.getElementById("download-csv");
const printButton = document.getElementById("print-timetable");

let latestTimetable = null;

function addSubject(name = "", periods = 3, teacher = "") {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input class="subject-input subject-name" type="text" maxlength="80" placeholder="e.g. Data Structures" value="${escapeAttribute(name)}" required></td>
    <td><input class="subject-input period-input subject-periods" type="number" min="1" max="30" value="${periods}" required></td>
    <td><input class="subject-input subject-teacher" type="text" maxlength="80" placeholder="Optional" value="${escapeAttribute(teacher)}"></td>
    <td><button type="button" class="remove-subject" aria-label="Remove subject" title="Remove subject">×</button></td>`;
  row.querySelector(".remove-subject").addEventListener("click", () => {
    row.remove();
    if (!subjectsBody.children.length) addSubject();
  });
  subjectsBody.appendChild(row);
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function loadExample() {
  subjectsBody.innerHTML = "";
  [
    ["Data Structures", 4, "Dr. Rao"],
    ["Database Management", 4, "Ms. Kumar"],
    ["Operating Systems", 4, "Mr. Reddy"],
    ["Computer Networks", 3, "Ms. Das"],
    ["Mathematics", 3, "Dr. Singh"],
    ["Python Lab", 2, "Mr. Rao"],
    ["Communication Skills", 2, "Ms. Priya"]
  ].forEach(subject => addSubject(...subject));
  formMessage.textContent = "Example subjects loaded. You can edit them before generating.";
  formMessage.className = "message success";
}

document.getElementById("add-subject").addEventListener("click", () => addSubject());
document.getElementById("load-example").addEventListener("click", loadExample);
document.getElementById("print-timetable").addEventListener("click", () => window.print());
document.getElementById("download-csv").addEventListener("click", downloadCSV);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";
  formMessage.className = "message";

  const days = [...document.querySelectorAll('input[name="day"]:checked')].map(input => input.value);
  if (!days.length) {
    formMessage.textContent = "Choose at least one working day.";
    return;
  }

  const subjects = [...subjectsBody.querySelectorAll("tr")].map(row => ({
    name: row.querySelector(".subject-name").value.trim(),
    periods: Number(row.querySelector(".subject-periods").value),
    teacher: row.querySelector(".subject-teacher").value.trim()
  }));

  if (!subjects.length || subjects.some(subject => !subject.name || !Number.isInteger(subject.periods) || subject.periods < 1)) {
    formMessage.textContent = "Enter a name and a valid weekly period count for every subject.";
    return;
  }
  const totalPeriods = subjects.reduce((sum, subject) => sum + subject.periods, 0);
  const capacity = days.length * Number(document.getElementById("period-count").value);
  if (totalPeriods > capacity) {
    formMessage.textContent = `You requested ${totalPeriods} periods, but the selected week has only ${capacity} slots. Reduce periods or add days.`;
    return;
  }

  const payload = {
    class_name: document.getElementById("class-name").value.trim() || "College timetable",
    days,
    periods_per_day: Number(document.getElementById("period-count").value),
    subjects
  };

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Generating...";
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not generate timetable.");
    latestTimetable = result;
    renderTimetable(result);
    formMessage.textContent = "Timetable generated successfully.";
    formMessage.className = "message success";
  } catch (error) {
    formMessage.textContent = `${error.message} Make sure the Flask app is running, then refresh the page.`;
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>✦</span> Generate timetable";
  }
});

function renderTimetable(data) {
  emptyState.hidden = true;
  timetableWrap.hidden = false;
  summary.hidden = false;
  downloadButton.disabled = false;
  printButton.disabled = false;
  subtitle.textContent = `${data.class_name} · ${data.days.length} working days · ${data.total_periods} scheduled periods`;

  const columns = data.periods_per_day + 1;
  timetableGrid.className = "timetable-grid";
  timetableGrid.style.gridTemplateColumns = `minmax(88px, .8fr) repeat(${data.periods_per_day}, minmax(90px, 1fr))`;
  timetableGrid.innerHTML = "";

  addGridCell("Day", "timetable-cell header");
  for (let period = 1; period <= data.periods_per_day; period++) addGridCell(`Period ${period}`, "timetable-cell header");

  data.days.forEach(day => {
    addGridCell(day, "timetable-cell day-label");
    for (let period = 1; period <= data.periods_per_day; period++) {
      const subject = data.schedule[day][period - 1];
      const cell = document.createElement("div");
      cell.className = "timetable-cell";
      const periodLabel = document.createElement("span");
      periodLabel.className = "period-label";
      periodLabel.textContent = `P${period}`;
      cell.appendChild(periodLabel);
      const card = document.createElement("div");
      card.className = subject ? "class-card" : "class-card empty";
      if (subject) {
        const name = document.createElement("strong");
        name.textContent = subject.name;
        card.appendChild(name);
        if (subject.teacher) {
          const teacher = document.createElement("small");
          teacher.textContent = subject.teacher;
          card.appendChild(teacher);
        }
      } else {
        const free = document.createElement("small");
        free.textContent = "Free";
        card.appendChild(free);
      }
      cell.appendChild(card);
      timetableGrid.appendChild(cell);
    }
  });

  summary.innerHTML = "";
  [
    [data.total_periods, "Scheduled periods"],
    [data.subject_count, "Subjects"],
    [data.days.length, "Working days"]
  ].forEach(([value, label]) => {
    const item = document.createElement("div");
    item.className = "summary-item";
    const strong = document.createElement("strong");
    strong.textContent = value;
    const span = document.createElement("span");
    span.textContent = label;
    item.append(strong, span);
    summary.appendChild(item);
  });
}

function addGridCell(text, className) {
  const cell = document.createElement("div");
  cell.className = className;
  cell.textContent = text;
  timetableGrid.appendChild(cell);
}

function downloadCSV() {
  if (!latestTimetable) return;
  const rows = [["Day", ...Array.from({ length: latestTimetable.periods_per_day }, (_, i) => `Period ${i + 1}`)]];
  latestTimetable.days.forEach(day => {
    rows.push([day, ...latestTimetable.schedule[day].map(subject => subject ? `${subject.name}${subject.teacher ? ` (${subject.teacher})` : ""}` : "Free")]);
  });
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "weekly-timetable.csv";
  link.click();
  URL.revokeObjectURL(url);
}

loadExample();
