# AI Timetable Generator

A beginner-friendly college timetable web application built with HTML, CSS, JavaScript, Python, and Flask.

## Features

- Add, edit, and remove subjects
- Choose working days and periods per day
- Generate a weekly timetable from subject period requirements
- Basic spreading of subjects across the week
- Download the generated timetable as CSV
- Print the timetable
- Responsive layout for desktop and mobile
- Flask API validates timetable inputs

## Important project note

This starter version uses a randomized scheduling algorithm with simple balancing heuristics. It does **not** call a large language model or train a machine-learning model yet. If you describe it in a report, call it an algorithm-based timetable generator until you add and test an AI integration.

## Requirements

- Python 3.10 or newer
- Internet is needed to install Flask the first time

## Run on Windows

1. Open this folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Create a virtual environment:

   ```powershell
   py -m venv .venv
   ```

4. Activate it:

   ```powershell
   .venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, use Command Prompt and run `.venv\Scripts\activate.bat`, or run `py -m pip install -r requirements.txt` without activating the environment.

5. Install dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

6. Start the app:

   ```powershell
   py app.py
   ```

7. Open this address in your browser: http://127.0.0.1:5000

Keep the terminal open while using the website. Stop the server with `Ctrl+C`.

## Upload to GitHub

1. Create a new repository on GitHub, for example `ai-timetable-generator`.
2. Upload the project files, or use Git from the VS Code terminal.
3. Do not upload `.venv`, `.env`, passwords, or API keys.
4. Add screenshots of your own running project to the README if you want to document the result.

## Limitations and future improvements

- Does not yet assign classrooms or account for multiple student sections.
- Teacher names are displayed but teacher availability is not checked.
- It does not currently model labs that require consecutive periods.
- The generator uses heuristics and does not guarantee an optimal timetable.
- Future work: teacher/room conflict constraints, lab blocks, timetable saving, login, export to PDF, and an optional AI API integration.

## License

Choose and add a license only after confirming the licenses of any third-party code or assets you include. This starter project was generated for customization and learning.
