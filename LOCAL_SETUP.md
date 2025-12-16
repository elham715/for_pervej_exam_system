# Local Development Setup

This system now runs entirely in your browser using localStorage instead of Supabase.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - The app will open at `http://localhost:5173`
   - **No login required** - you'll have immediate access to the admin panel

## How to Use

### Creating Questions and Exams

1. **Create a Question Set:**
   - Click "Create Question Set" on the home page
   - Enter a title and optional description
   - Click "Create Question Set"

2. **Add Questions:**
   - Select your question set from the list
   - Fill in the question form (text, LaTeX, options, etc.)
   - Create topics as needed
   - Click "Create Question"

3. **Create an Exam:**
   - Click "Create Exam" from the home page
   - Enter exam title and time limit
   - Select the question sets you want to include
   - Click "Generate Exam Link"
   - **Copy the generated link** to share with students

4. **Taking an Exam:**
   - Open the exam link in a new tab/window
   - Enter student name and email
   - Take the exam
   - View results with incorrect answers and topic recommendations

5. **View Dashboard:**
   - Click "Dashboard" to see all exam results
   - View topic performance and student scores

## Data Storage

- All data is stored in browser localStorage
- Data persists between sessions
- **Note:** Clearing browser data will delete all questions/exams/results

## Resetting Data

To start fresh, open browser console (F12) and run:
```javascript
localStorage.clear();
location.reload();
```

## Features Available

✅ Create question sets with multiple questions  
✅ Support for LaTeX math formulas  
✅ Image support for questions  
✅ Dynamic answer options  
✅ Topic-based organization  
✅ Timed exams with countdown  
✅ Instant results with score breakdown  
✅ Topic-specific video explanations  
✅ Admin dashboard with analytics  
✅ No authentication required (local dev mode)

## Sharing Exam Links

The exam links work as long as:
1. The dev server is running (`npm run dev`)
2. The link is accessed from the same machine/network
3. Data exists in the same browser that created the exam

For production deployment with public links, you would need to set up Supabase or another backend.
