# Survey_Backend

This project implements a visual personality-based assessment similar to Traitify/Paradox using:
    - Express.js backend (Node)
    - PostgreSQL database (Docker container)
    - Frontend served from /public (HTML/CSS/JS)
    - Migration and seed SQL files located under /db
    - REST API endpoints to fetch slides, start an assessment, record responses, and finish the session

The system presents a deck of images to the user, who answers “Me” / “Not Me”, and the backend logs all responses.

# How the System Works

1. /public/index.html
The UI loads the quiz:
    - Displays the current image
    - Shows caption + progress counter
    - Sends answers using /api/answer
    - Starts the session using /api/start
    - Finishes with /api/finish

2. server.js (Express API)
Key routes:
    - /api/deck, method: GET, functionality: Returns all slides (images + captions)
    - /api/start, method: POST, functionality: Creates an assessment entry
    - /api/answer, method: POST, functionality: Saves one ME/NOT_ME response
    - /api/finish, method: POST, functionality: Marks assessment complete
    - /, method: GET, functionality: Serves frontend

The backend reads images from /public/img/....

3. PostgreSQL Database

Runs inside Docker as container survey_pg.

Core tables:
    - slides → list of image cards
    - assessments → one per test session
    - responses → one per slide per user
    - scores → placeholder for OCEAN/RAISEC scoring
    - algo → custom mapping table for weight combinations

4. Migrations

Each SQL file under /db/migrations contains a single table creation.

They must be run in the correct order.

5. Seeding

db/seed/weight.sql inserts slide data.

# How to Run the App

Step 1: Start Docker --> Ensure Docker Desktop is running.

Step 2: Start the containers --> docker compose up -d --build
    - This launches:
        > api → Express server on port 3000
        > survey_pg → PostgreSQL on 5432

Step 3: Run DB migrations

Go to the project root terminal and use this PowerShell block, paste it as paste instead of paste as one line:

    $files = @(
    ".\db\migrations\V1_create_slide_table.sql",
    ".\db\migrations\V1_create_assessment_table.sql",
    ".\db\migrations\V1_create_responses_table.sql",
    ".\db\migrations\V1_create_score_table.sql",
    ".\db\migrations\V1_create_algo_table.sql"
    )

    foreach ($f in $files) {
    Write-Host "Running $f"
    Get-Content $f | docker exec -i survey_pg psql -U postgres -d survey_db
    }

Step 4: Seed slide data --> Get-Content .\db\seed\weight.sql | docker exec -i survey_pg psql -U postgres -d survey_db

Step 5: Open the app --> Open at: http://localhost:3000


# How to Inspect Database Contents

List tables --> docker exec -it survey_pg psql -U postgres -d survey_db -c "\dt"
Check slides --> docker exec -it survey_pg psql -U postgres -d survey_db -c "SELECT * FROM slides;"
Check responses --> docker exec -it survey_pg psql -U postgres -d survey_db -c "SELECT * FROM responses ORDER BY assessment_id;"

# Common Errors and Fixes

Drop all tables in the database to make sure there are no partial tables before running any code to create a table again: docker exec -it survey_pg psql -U postgres -d survey_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

Error: relation "slides" does not exist
- Cause: Migrations ran in the wrong order or failed.
- Fix --> DROP SCHEMA public CASCADE; CREATE SCHEMA public;
- Re-run migrations in correct order (see above) and seed slides again

Error: GET /api/deck 500 (Internal Server Error)
- Cause: Database exists but the slides table does not.
- Fix: Ensure migrations ran successfully 
- Run the slide creation SQL and seed slides

Error: Port already in use: bind: Only one usage of each socket address
- Cause: Another Node/Express process is already using port 3000.
- Fix:
    netstat -ano | findstr :3000
    tasklist /FI "PID eq <PID>"
- Kill it --> taskkill /PID <PID> /F
- Restart Docker.