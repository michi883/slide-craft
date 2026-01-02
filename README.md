# SlideCraft

A sophisticated web application that transforms business ideas into professional pitch slides using AI. Features a multi-step workflow with style options, AI-powered refinements, and cloud storage integration.

![App Screenshot](https://via.placeholder.com/800x400?text=AI+Business+Pitch+Generator)

## Features

- **AI-Powered Slide Generation**: Uses Google Gemini 3 Flash and Imagen 4.0 to create professional pitch slides from text descriptions
- **Multiple Design Styles**: Choose from 3 visual style options (minimalist, data-focused, icon-heavy)
- **Intelligent Refinement**: Get AI-suggested improvements or provide custom refinement instructions
- **Download & Storage**: Download slides as PNG images or upload directly to InsForge cloud storage
- **Professional UI**: Clean, business-oriented interface with intuitive step indicators

## Workflow

The application follows a clear 4-step process:

1. **Enter Idea** - Describe your business concept or startup idea
2. **Choose Style** - Select from 3 generated visual style options
3. **Final Slide** - Review your sophisticated, investor-ready pitch slide
4. **Refine** (Optional) - Apply AI-suggested improvements or custom refinements

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Vanilla HTML/CSS/JavaScript |
| **Backend** | Node.js with Express |
| **Text AI** | Google Gemini 3 Flash (`gemini-3-flash-preview`) |
| **Image AI** | Google Imagen 4.0 (`imagen-4.0-fast-generate-001`) |
| **Storage** | InsForge Object Storage |
| **HTTP Client** | Axios with FormData |

## Project Structure

```
slide-craft/
├── public/
│   └── index.html       # Single-page application with embedded CSS/JS
├── server.js            # Express server with API endpoints
├── package.json         # Dependencies and scripts
├── .env                 # Environment variables (API keys)
└── README.md            # This file
```

## Installation

### Prerequisites

- Node.js 18+ installed
- Google GenAI API key
- InsForge API key and bucket

### Setup Steps

1. **Clone or navigate to the project directory:**
   ```bash
   cd slide-craft
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the project root:
   ```env
   GOOGLE_GENAI_API_KEY=your_google_api_key_here
   INSFORGE_API_KEY=your_insforge_api_key_here
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open in browser:**
   ```
   http://localhost:5000
   ```

## API Configuration

### Google GenAI API

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GOOGLE_GENAI_API_KEY`

### InsForge Storage

1. Sign up at [InsForge](https://insforge.app)
2. Create a bucket (default: `slides`)
3. Get your API key
4. Add it to your `.env` file as `INSFORGE_API_KEY`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve the main application |
| `/generate-options` | POST | Generate 3 initial style options |
| `/generate-final` | POST | Generate final slide from selected style |
| `/get-refine-options` | POST | Get AI-suggested refinements |
| `/refine-slide` | POST | Apply refinement to slide |
| `/upload` | POST | Upload slide to InsForge |

### Request/Response Examples

**Generate Options**
```json
// Request
{
  "prompt": "A flying car service for rural areas"
}

// Response
{
  "success": true,
  "options": [
    {
      "id": 1,
      "concept": "minimalist with bold typography",
      "image": "data:image/png;base64,..."
    }
  ]
}
```

**Generate Final Slide**
```json
// Request
{
  "prompt": "A flying car service for rural areas",
  "selectedOption": 0
}

// Response
{
  "success": true,
  "image": "data:image/png;base64,...",
  "description": "• Headline: SkyWay Rides\n• Style: minimalist..."
}
```

## UI Color Scheme

The application uses a professional color palette with semantic meaning:

| Element | Color | Hex | Purpose |
|---------|-------|-----|---------|
| Primary Blue | Blue | `#2563eb` | Primary actions, active step indicator |
| Success Green | Green | `#059669` | Download ("get result") action |
| Refine Purple | Purple | `#7c3aed` | Refine ("improve") action |
| Upload Teal | Teal | `#0d9488` | Cloud upload action |
| Secondary Gray | Gray | `#6b7280` | Cancel/reset actions |

## Development

### Running in Development

```bash
npm start
```

The server runs on port 5000 by default.

### Configuration

Edit the constants in `server.js`:

```javascript
const PORT = 5000;
const TEXT_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'imagen-4.0-fast-generate-001';
const INSFORGE_BASE_URL = 'https://dx2ji8ea.us-west.insforge.app';
const INSFORGE_BUCKET = 'slides';
```

## Dependencies

- **express** (^4.19.2) - Web server framework
- **axios** (^1.7.0) - HTTP client for API requests
- **dotenv** (^16.4.5) - Environment variable management
- **form-data** (^4.0.0) - Multipart form data for file uploads

## Browser Compatibility

Works on all modern browsers that support:
- ES6+ JavaScript
- CSS Flexbox
- CSS Grid
- Fetch API

## License

This project is provided as-is for educational and commercial use.

## Support

For issues related to:
- **Google AI APIs**: Visit [Google AI Studio](https://makersuite.google.com)
- **InsForge Storage**: Visit [InsForge Documentation](https://insforge.app)
- **Application bugs**: Check the browser console and server logs

## Version History

### v1.0.0 (Current)
- Initial release with multi-step workflow
- Google Gemini 3 Flash + Imagen 4.0 integration
- InsForge cloud storage upload
- AI-powered refinement suggestions
- Professional business software UI
