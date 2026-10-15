from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import random

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=None)


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:filename>")
def static_files(filename):
    allowed = {"style.css", "script.js"}
    if filename not in allowed:
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(BASE_DIR, filename)


@app.post("/api/generate")
def generate_timetable():
    data = request.get_json(silent=True) or {}
    days = data.get("days")
    subjects = data.get("subjects")
    periods_per_day = data.get("periods_per_day")
    class_name = str(data.get("class_name", "College timetable")).strip()[:80]

    valid_days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}
    if not isinstance(days, list) or not days or any(day not in valid_days for day in days):
        return jsonify({"error": "Choose at least one valid working day."}), 400
    if len(set(days)) != len(days):
        return jsonify({"error": "Working days cannot be repeated."}), 400
    if not isinstance(periods_per_day, int) or isinstance(periods_per_day, bool) or not 1 <= periods_per_day <= 10:
        return jsonify({"error": "Periods per day must be between 1 and 10."}), 400
    if not isinstance(subjects, list) or not subjects or len(subjects) > 40:
        return jsonify({"error": "Add between 1 and 40 subjects."}), 400

    clean_subjects = []
    names_seen = set()
    total_periods = 0
    for item in subjects:
        if not isinstance(item, dict):
            return jsonify({"error": "Each subject must be an object."}), 400
        name = str(item.get("name", "")).strip()[:80]
        teacher = str(item.get("teacher", "")).strip()[:80]
        periods = item.get("periods")
        if not name:
            return jsonify({"error": "Subject names cannot be empty."}), 400
        if not isinstance(periods, int) or isinstance(periods, bool) or not 1 <= periods <= 30:
            return jsonify({"error": f"Enter a valid weekly period count for {name}."}), 400
        if name.casefold() in names_seen:
            return jsonify({"error": f"Subject '{name}' is repeated. Use unique subject names."}), 400
        names_seen.add(name.casefold())
        clean_subjects.append({"name": name, "teacher": teacher, "periods": periods})
        total_periods += periods

    capacity = len(days) * periods_per_day
    if total_periods > capacity:
        return jsonify({"error": f"You requested {total_periods} periods, but only {capacity} weekly slots are available."}), 400

    # Shuffle equal-priority subjects so the timetable is not always identical.
    remaining = []
    for subject in clean_subjects:
        remaining.extend([subject.copy() for _ in range(subject["periods"])])
    random.shuffle(remaining)
    # Schedule the subjects with the most remaining sessions first, preferring
    # a different subject from the previous period and spreading subjects by day.
    schedule = {day: [None for _ in range(periods_per_day)] for day in days}
    counts_by_day = {day: {} for day in days}

    slots = [(day, period) for day in days for period in range(periods_per_day)]
    random.shuffle(slots)
    slots.sort(key=lambda slot: slot[1])  # distribute choices across period numbers

    for day, period in slots:
        if not remaining:
            break
        previous_name = schedule[day][period - 1]["name"] if period > 0 and schedule[day][period - 1] else None

        candidate_indices = list(range(len(remaining)))
        random.shuffle(candidate_indices)
        candidate_indices.sort(key=lambda idx: (
            remaining[idx]["name"] == previous_name,
            counts_by_day[day].get(remaining[idx]["name"], 0),
            -sum(1 for s in remaining if s["name"] == remaining[idx]["name"])
        ))
        chosen_index = candidate_indices[0]
        chosen = remaining.pop(chosen_index)
        schedule[day][period] = {"name": chosen["name"], "teacher": chosen["teacher"]}
        counts_by_day[day][chosen["name"]] = counts_by_day[day].get(chosen["name"], 0) + 1

    return jsonify({
        "class_name": class_name or "College timetable",
        "days": days,
        "periods_per_day": periods_per_day,
        "schedule": schedule,
        "total_periods": total_periods,
        "subject_count": len(clean_subjects)
    })


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
