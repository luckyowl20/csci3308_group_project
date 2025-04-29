# 🍀Lucky Moment 
### A dating website that is designed to prevent catfishing and have people show their true selves.
### Current render hosted version: https://csci3308-group-project.onrender.com/
- _if using the hosted version, please allow a few minutes for render to serve our application as the container is required to reboot upon activity_


## FEATURES
### * One daily picture that resets at the start of the day.
### * Swiping algorithm to match you with people in your area, with your interests.
### * Real time chat with people you have matched with. 
### * A feed that shows your matches daily posts.
### A discovery page that allows you to explore music, activities, and resturants.
### Ability to view potential matches posts from the last 7 days
### You muust post to be able to use other features
### Detailed profiles that allow you to display your interests, favorite song, birthday, and a short biography.

## TECH STACK
### * Frontend: HTMl, CSS, Handlebars, Bootstrap
### * Backend: Node.js, Express, Socket.io
### * Database: PostgressSQL + PostGIS
### * Testing: Mocha, Chai
### * Image Storage: Supabase
### * APIS: Spotify, Google Maps

## DIRECTORY STRUCTURE
### Meeting_Logs:
  - Contains minutes of our TA meetings and weekly team meetings

### Milestones 
  - Containes project milestones and UAT plan for lab 11

### data_generator
  - GoogleImageScraper.py: contains class used to define the image scraping tool used in main.py to scrape dummy images from the web based on search criteria, convers URL list for each search criteria into a CSV.
  - sql_generator.py: Main generator script that uses gathererd URLs from CSV file to generate posts, complete profiles, messages (unused), matches, friendships, and compile them into SQL commands to be run in our database

### project_source_code
  - contains docker compose file and package.json required packages for our project
  - init_data:
      - 00-RESTART-db.sql: file to completely drop all tables from database, used in resetting database on Render
      - 01-create.sql: creates all the tables we use in our project
      - 02-interests_data.sql: inserts all possible interest options that users can select in their profile
      - 03-dummy-data.sql: dummy profiles generated from sql_generator.py
      - 04-dummy-blogs.sql: demo blog posts for some users
      - 99-reset-sequences.sql: resets the primary key sequence counter for all tables after all inserts are done

  - src: contains all back end utilities, routes, middleware, front end pages, handlebars partials, styling, and static images
      - helpers: handlebars helper functions to be called from partials for increased functionality
      - middleware: functions used for authentication and setting local session variables
      - resources: contains all public scripts and images available to the front end
          - css: contains all style sheets for each page separately
              - main style stored in base.css, contains global color scheme, font settings, button customizations, etc
              - page specific styles stored in their own style sheet
          - fonts: contains the fonts used in css files, specifically base.css
          - img: contains static images used on our site, landing page for example
          - js: contains all client side scripts for each page. profile/profileScript.js for example controls all rendering of friends/matches column dynamically based on JSON object passed from backend upon successful profile load for a given user.
      - routes: contains all the routes split into their own files based on page for organizational purposes
      - utils: scripts/functions that are used by both front end scripts and back end routes. Utils folder ensures accessibility to scripts without awkward boilerplate functions. Specifically, database config variable is set here for access from both app and test cases.
      - views:
          - layouts: contains the page layout for our landing page and main layout which we inject all other content into
          - pages: contains all the main pages for our website
              - example: profile.hbs corresponds to the profile page for both a user and their friends
          - partials: contains all partials used in each page
              - exmaple: profile page depends on the editProfileModal.hbs and editPreferencesModal.hbs partials for the pop-ups to edit each respectively.
      - test: contains test cases for lab 11

## Using 
### 1: signup with a username and password 
### 2: Set up your profile with required information (display name, age, location, gender, and preferred gender)
### 3: Upload your daily photo
### 4: Begin Swiping 

### COLLABERATORS
## Alec Volkert, Matt Schneider, Vivian Diep, Nina Vo, Varun Cheela, John Kreye, Daniel Zhu

### RUNNING 
### make sure to setup .env file should look like this: 
### SESSION_SECRET="lucky_secret_2025"

### PostgreSQL settings
### POSTGRES_USER="postgres"
### POSTGRES_PASSWORD="pwd"
### POSTGRES_DB="lucky_moment_db"
### POSTGRES_HOST='db'

### spotify api keys
### SPOTIFY_CLIENT_ID=""
### SPOTIFY_CLIENT_SECRET=""

### image datbase key
### SUPABASE_URL=''
### SUPABASE_API_KEY=''

### google map api key
### MAP_API_KEY = ''

### 1: Clone the repository
### 2: Create and finish the .env file
### 3: docker compose up to run and load the database
### 4: Host the network on localhost:3000 or with your desired platform





