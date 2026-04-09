# Deepfake Detection System Documentation

## What This System Is

This system is a web application for detecting whether an uploaded image or video appears authentic or manipulated.

A user creates an account, signs in, uploads media, and receives an analysis result. The system also keeps a history of previous uploads and shows summary information on a dashboard.

In simple terms, the platform does four main things:

- lets users log in securely
- accepts image and video uploads
- analyzes the uploaded media
- stores the results for future viewing

## Main Parts of the System

The system has two parts:

### 1. Frontend

This is the part the user sees in the browser.

It provides:

- login and registration
- dashboard
- image upload page
- video upload page
- profile page
- history view

### 2. Backend

This is the part that does the processing behind the scenes.

It is responsible for:

- checking user login credentials
- receiving uploaded files
- sending images for deepfake analysis
- analyzing video frames
- saving results in the database
- returning results to the frontend

## Technologies Used

This system was built using the following technologies:

### Frontend Technologies

- React
- Vite
- JavaScript
- Tailwind CSS
- Axios
- React Router

These technologies are used to build the user interface, page navigation, and communication with the backend.

### Backend Technologies

- Python
- Flask
- Flask JWT Extended
- Flask CORS
- bcrypt
- python-dotenv

These technologies are used for the server-side logic, authentication, API handling, and environment configuration.

### Database and Storage

- MySQL
- local file storage for uploaded media

MySQL is used to store user records, upload information, and analysis results, while uploaded files are stored on the server.

### Media and Analysis Libraries

- OpenCV
- NumPy
- DeepFace

These libraries help the system process media files, calculate image properties, and perform supporting facial analysis.

## How To Start the Project

To run the system properly, both the frontend and backend must be started.

### 1. Start the Backend

Open a terminal and move into the backend folder:

```bash
cd backend
```

Install the Python dependencies if they are not already installed:

```bash
pip install -r requirements.txt
```

Make sure your MySQL database is running and your environment variables are configured in the backend environment file.

Then start the Flask backend:

```bash
python app.py
```

The backend runs on:

```bash
http://localhost:5000
```

### 2. Start the Frontend

Open another terminal and go to the project root:

```bash
cd /Users/rakinzisilver/Documents/GitHub/deepfake
```

Install frontend dependencies if needed:

```bash
npm install
```

Then start the frontend development server:

```bash
npm run dev
```

If you use Bun in this project, you can also run:

```bash
bun run dev
```

The frontend usually runs on:

```bash
http://localhost:5173
```

### 3. Open the Application

Once both servers are running, open the frontend URL in the browser:

```bash
http://localhost:5173
```

From there, the user can register, log in, and begin using the system.

### 4. Important Startup Requirements

Before starting the project, make sure:

- MySQL is running
- the backend dependencies are installed
- the frontend dependencies are installed
- the backend environment variables are set correctly

### 5. Recommended Startup Order

For the project to run smoothly, use this order:

1. Start MySQL
2. Start the backend
3. Start the frontend
4. Open the browser

## What the User Can Do

A normal user can:

- register an account
- log in
- upload an image for analysis
- upload a video for analysis
- see previous analysis results
- view a personal dashboard
- update profile details

## General Flow of the System

This is the normal journey through the system:

1. A user creates an account or logs in.
2. The user opens either the image analysis page or the video analysis page.
3. The user uploads a file.
4. The backend receives the file and processes it.
5. The system decides whether the media looks real or manipulated.
6. The result is shown to the user.
7. The result is also saved so the user can review it later.

## Image Upload and Analysis Algorithm

This is the full image analysis process in plain language.

### Step 1: The user uploads an image

The user selects an image from the image analysis page and submits it.

The frontend sends that image file to the backend API.

### Step 2: The backend receives the image

When the backend receives the file, it first checks whether an image was actually provided.

If no image is uploaded, the system stops and returns an error.

### Step 3: The image is saved

The backend gives the uploaded file a unique name so it does not clash with other files.

It then stores the image in the uploads folder on the server.

This makes it possible to:

- keep a record of the upload
- analyze the file
- connect the file to the user who uploaded it

### Step 4: The upload is recorded in the database

After saving the file, the system creates a database record containing information such as:

- which user uploaded it
- the file name
- where it was saved
- the file size

This creates a permanent link between the uploaded image and the analysis result that will come next.

### Step 5: The image data is read for analysis

The backend opens the saved image and reads its raw content.

This raw image data is what the system uses during the analysis stage.

### Step 6: The image is sent for deepfake detection

The system passes the uploaded image to the configured detection model.

That model examines the image and returns information that helps the system estimate whether the image is likely to be real or fake.

At this stage, the main goal is to get a prediction score from the model.

### Step 7: The prediction result is interpreted

The model may return its answer in slightly different formats, so the backend interprets the result carefully.

It looks for labels such as:

- real
- fake

From that response, the backend calculates:

- whether the image should be treated as real or fake
- a realness score
- a confidence-related value for display

This is the decision-making stage of the image pipeline.

### Step 8: The system checks image quality

The backend does not only rely on the prediction score. It also calculates simple image quality indicators:

- sharpness
- brightness
- contrast

These values help describe the condition of the uploaded image.

For example:

- a blurry image may reduce trust in the result
- a very dark image may be harder to analyze
- low contrast may affect visible facial detail

These values do not decide the result by themselves, but they help explain the quality of the input.

### Step 9: The system extracts facial information

The backend also attempts facial analysis on the uploaded image.

This step tries to extract supporting facial attributes from the detected face region.

Examples of supporting attributes include:

- estimated age
- emotion distribution
- dominant race label

This information is secondary. It does not replace the real/fake decision, but it adds more descriptive output to the final result.

### Step 10: The final result object is created

After prediction and quality checks are completed, the backend builds a complete result structure.

This result includes:

- the real/fake decision
- the realness score
- confidence
- image quality values
- facial analysis details
- the area of the image that was considered

### Step 11: The result is saved

Once the result is ready, the backend stores it in the database.

This allows the system to show:

- previous analyses in user history
- dashboard summaries
- user statistics

### Step 12: The result is returned to the frontend

The backend sends the final analysis result back to the frontend.

The frontend then displays:

- whether the image looks authentic or manipulated
- how strong the result is
- supporting values such as quality metrics

## Short Version of the Image Algorithm

If you want to explain it quickly during a presentation, say this:

When a user uploads an image, the system saves it, records it in the database, sends it through the detection pipeline, interprets the prediction, calculates quality indicators like sharpness and brightness, adds supporting facial analysis, stores the result, and returns the final decision to the user.

## Video Analysis in Simple Terms

The video process works differently from the image process.

Instead of trying to judge the whole video at once, the system samples frames from the uploaded video and analyzes those frames one by one.

### Basic Video Flow

1. The user uploads a video.
2. The backend saves the video.
3. The system reads video information such as duration and frame count.
4. The backend selects frames at intervals instead of analyzing every single frame.
5. Each selected frame is treated like an image and passed into the image detection pipeline.
6. The system combines those frame-level results into one overall video result.

### Why the Video System Uses Frames

A deepfake video is usually made up of many manipulated images shown quickly one after another.

Because of that, the system checks sampled frames and looks for suspicious segments over time.

This makes the video process:

- more practical
- faster than scanning every frame
- easier to summarize into one final result

## Dashboard

The dashboard gives the user a quick summary of activity.

It shows information such as:

- number of analyzed images
- number of detected fake images
- recent detections
- basic distribution of results

The dashboard is there to help the user quickly understand usage and recent outcomes.

## Profile and History

The profile section lets the user:

- view account information
- update personal details
- change password
- review previous image analyses

The history section is important because it allows the user to go back and check earlier uploads and results.

## What Happens Behind the Scenes

Behind the user interface, the system also does the following:

- secures protected routes using login tokens
- stores uploaded files on the server
- stores analysis records in MySQL
- links every upload to the correct user account

This means the platform is not only doing detection, but also managing users and their analysis history.

## What to Say When Presenting the System

If someone wants a simple explanation of the project, this version is enough:

This is a deepfake detection platform where users log in, upload images or videos, and receive an authenticity result. The system stores uploads, analyzes them in the backend, and keeps the results for dashboard and history viewing.

If they ask how image upload works, say:

The image is uploaded through the frontend, saved on the backend, recorded in the database, analyzed by the detection pipeline, checked for quality indicators, and then the final result is returned and stored for future review.

If they ask how video works, say:

The video is broken into sampled frames, those frames are analyzed one by one, and the system combines the frame results into one final video assessment.

## Important Notes

- This document focuses only on the implemented image and video system
- Audio, text, and live-stream features are intentionally excluded here
- The system stores results so they can be reviewed later by the same user
- The dashboard is a summary interface, not a scientific evaluation report

## Conclusion

This project is a complete user-facing media analysis system, not just a raw detection script.

Its value comes from combining:

- user authentication
- media upload
- deepfake analysis
- stored history
- dashboard reporting

The most important part of the system is the image analysis pipeline, because that is the core detection flow and the video system is built on top of it.
