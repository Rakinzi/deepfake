# Deepfake Detection System Documentation

## What This System Is

This system is a web application for detecting whether an uploaded image or video appears authentic or manipulated.

A user creates an account, signs in, uploads media, and receives an analysis result. The system also keeps a history of previous uploads and shows summary information on a dashboard.

In simple terms, the platform does four main things:

- lets users log in securely
- accepts image and video uploads
- analyzes the uploaded media using a local AI model
- stores the results for future viewing

## Main Parts of the System

The system has two parts:

### 1. Frontend

This is the part the user sees in the browser.

It provides:

- login and registration
- dashboard with stats, charts, and detection method explanations
- image upload and analysis page
- video upload and analysis page with a custom video player
- profile page
- history view

### 2. Backend

This is the part that does the processing behind the scenes.

It is responsible for:

- checking user login credentials
- receiving uploaded files
- running deepfake analysis using a local model
- falling back to the HuggingFace Inference API if the local model is unavailable
- analyzing video frames one by one
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
- Lucide React (icons)
- shadcn/ui components

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
- Transformers (HuggingFace)
- PyTorch
- Pillow

These libraries handle media processing, image quality calculations, facial attribute extraction, and running the deepfake detection model locally.

## Detection Model

The system uses the model `dima806/deepfake_vs_real_image_detection` from HuggingFace.

This is a Vision Transformer (ViT) fine-tuned to classify face images as either real or AI-generated. It works by learning subtle differences in texture, frequency patterns, and facial structure that distinguish authentic photographs from synthetic ones.

### Inference Strategy

The system uses a two-stage inference strategy:

1. **Local inference (primary)** — The model is loaded directly onto the server using the HuggingFace `transformers` library. Images are classified on-device without sending data to any external server. On first startup, model weights (~500 MB) are downloaded once and cached locally at `~/.cache/huggingface/`.

2. **HuggingFace Inference API (fallback)** — If the local model fails for any reason (for example, insufficient memory or missing dependencies), the system automatically retries the same classification using the HuggingFace Inference API. This requires an `HF_API_KEY` set in the backend environment file.

The response always includes a `model_used` field that tells the frontend which path was taken. The frontend displays this as either a local inference badge or an API fallback badge.

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

```
http://localhost:5000
```

On first startup, the local deepfake detection model will be downloaded from HuggingFace and cached. This may take a few minutes depending on your connection speed.

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

```
http://localhost:5173
```

### 3. Open the Application

Once both servers are running, open the frontend URL in the browser:

```
http://localhost:5173
```

From there, the user can register, log in, and begin using the system.

### 4. Important Startup Requirements

Before starting the project, make sure:

- MySQL is running
- the backend Python dependencies are installed (including `transformers`, `torch`, and `Pillow`)
- the frontend dependencies are installed
- the backend environment variables are set correctly
- `HF_API_KEY` is set in the backend `.env` file (required only if local inference is unavailable)

### 5. Recommended Startup Order

For the project to run smoothly, use this order:

1. Start MySQL
2. Start the backend (model will load on startup)
3. Start the frontend
4. Open the browser

## What the User Can Do

A normal user can:

- register an account
- log in
- upload an image for analysis
- upload a video for analysis
- see previous analysis results
- view a personal dashboard with detection stats and charts
- update profile details

## General Flow of the System

This is the normal journey through the system:

1. A user creates an account or logs in.
2. The user opens either the image analysis page or the video analysis page.
3. The user uploads a file.
4. The backend receives the file and processes it.
5. The local model (or API fallback) classifies the media.
6. The result is shown to the user with confidence scores, quality metrics, and facial attributes.
7. The result is saved so the user can review it later.

## Image Upload and Analysis Algorithm

This is the full image analysis process in plain language.

### Step 1: The user uploads an image

The user selects an image from the image analysis page and submits it.

The frontend sends that image file to the backend API. While waiting, the frontend displays a step-by-step progress indicator showing which stage the pipeline is currently on.

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

### Step 6: The image is classified by the detection model

The system first attempts to classify the image using the local Vision Transformer model loaded in memory.

If that succeeds, the result is returned immediately without any external network call.

If the local model fails, the system automatically retries using the HuggingFace Inference API as a fallback.

Either way, the response includes a label indicating whether the image appears real or synthetic, along with a confidence score.

### Step 7: The prediction result is interpreted

The model may return its answer in slightly different formats depending on whether the local model or the API was used.

The backend normalizes the result into a consistent structure, extracting:

- whether the image should be treated as real or fake
- a realness score between 0 and 1
- a confidence value for display

### Step 8: The system checks image quality

The backend also calculates simple image quality indicators:

- sharpness (Laplacian variance)
- brightness (mean pixel intensity)
- contrast (standard deviation of pixel values)

These values help describe the condition of the uploaded image and are shown to the user alongside the detection result.

### Step 9: The system extracts facial attributes

The backend attempts facial analysis using the DeepFace library.

This step tries to extract supporting attributes from the detected face region, such as:

- estimated age
- emotion distribution
- dominant ethnicity label

This information is secondary. It does not replace the real/fake decision, but it adds more descriptive output to the final result.

### Step 10: The final result is assembled

After prediction and quality checks are completed, the backend builds a complete result structure containing:

- the real/fake decision
- the realness score
- confidence
- image quality values
- facial analysis details
- which model path was used (local or API fallback)

### Step 11: The result is saved

Once the result is ready, the backend stores it in the database.

This allows the system to show:

- previous analyses in user history
- dashboard summaries
- user statistics

### Step 12: The result is returned to the frontend

The backend sends the final analysis result back to the frontend.

The frontend displays:

- whether the image looks authentic or manipulated
- the confidence score
- a gradient score bar
- quality metrics with labels
- facial attribute breakdown with emotion bars
- which inference method was used (local or API fallback)

## Short Version of the Image Algorithm

If you want to explain it quickly during a presentation, say this:

When a user uploads an image, the system saves it, records it in the database, passes it through the local Vision Transformer model (falling back to the HuggingFace API if needed), interprets the prediction score, calculates quality indicators like sharpness and brightness, adds supporting facial analysis from DeepFace, stores the result, and returns the final decision to the user.

## Video Analysis in Simple Terms

The video process works differently from the image process.

Instead of trying to judge the whole video at once, the system samples frames from the uploaded video and analyzes those frames one by one using the same pipeline as image analysis.

### Basic Video Flow

1. The user uploads a video.
2. The backend saves the video permanently.
3. The system reads video properties such as duration, frame rate, and resolution.
4. The backend selects frames at regular intervals rather than analyzing every single frame.
5. Each selected frame is passed into the image detection pipeline (local model or API fallback).
6. A stricter threshold (80% real score required) is used for video frames compared to images (50%).
7. Consecutive fake frames are merged into time-stamped manipulation regions.
8. The system combines all frame results into one overall video result.

### Why the Video System Uses a Stricter Threshold

Image analysis uses a 50% threshold: if the model says the image is more than 50% likely to be real, it is classified as real.

Video analysis uses an 80% threshold: a frame must score above 80% real to be considered authentic. This is stricter because individual video frames are often lower quality than standalone photographs, and a real video should produce consistently high real scores across all frames.

### Why the Video System Uses Frames

A deepfake video is usually made up of many manipulated images shown quickly one after another.

Because of that, the system checks sampled frames and looks for suspicious segments over time.

This makes the video process:

- more practical than analyzing every frame
- easier to summarize into one final result
- capable of pinpointing specific time ranges where manipulation was detected

The frontend video player highlights these regions on the timeline in red and allows the user to jump directly to the next detected manipulation segment.

## Dashboard

The dashboard gives the user a quick summary of activity.

It shows:

- number of analyzed images and videos
- number of detected fake results
- recent detection history for both images and videos
- bar charts showing the distribution of authentic vs. fake results
- a detection methods tab explaining how each analysis technique works
- model status banners showing whether local inference or API fallback is active

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

- secures protected routes using login tokens (JWT)
- stores uploaded files on the server with unique filenames
- stores analysis records in MySQL linked to the correct user account
- loads the detection model once at startup so it is ready for all requests without reloading

## What to Say When Presenting the System

If someone wants a simple explanation of the project, this version is enough:

This is a deepfake detection platform where users log in, upload images or videos, and receive an authenticity result. The system uses a local Vision Transformer model to classify media on-device, with automatic fallback to the HuggingFace API. Results are stored for dashboard and history viewing.

If they ask how image upload works, say:

The image is uploaded through the frontend, saved on the server, recorded in the database, classified by the local ViT model (or the HuggingFace API if the model fails), checked for quality indicators, supplemented with facial attribute analysis from DeepFace, and then the full result is returned to the user and saved for future review.

If they ask how video works, say:

The video is broken into sampled frames, those frames are each classified by the same detection pipeline used for images, a stricter threshold is applied to catch subtle manipulation, and the system combines the frame results into one final assessment with time-stamped manipulation regions shown on the video timeline.

If they ask why there is a local model and an API fallback, say:

The local model keeps image data on the server without sending it to third parties, which is better for privacy and removes dependency on external rate limits. The API fallback ensures the system still works even if the local model cannot load, for example due to insufficient memory on the host machine.

## Important Notes

- This document covers the implemented image and video analysis system
- Audio, text, and live-stream features are intentionally excluded here
- The system stores all results so they can be reviewed later by the same user
- The dashboard is a summary interface, not a scientific evaluation report
- The local model weights are cached after the first download and do not need to be re-downloaded on subsequent startups

## Conclusion

This project is a complete user-facing media analysis system, not just a raw detection script.

Its value comes from combining:

- user authentication
- media upload
- local on-device deepfake analysis with API fallback
- stored history
- dashboard reporting

The most important part of the system is the image analysis pipeline, because that is the core detection flow and the video system is built on top of it.
