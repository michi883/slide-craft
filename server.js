/**
 * Image Generation Web App - Business Pitch Slide Generator with InsForge Upload
 * Three-step flow: 3 rough options -> 1 sophisticated final version -> optional refinement
 */
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 5000;

// API Keys from environment variables (Zeabur compatible)
const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const INSFORGE_API_KEY = process.env.INSFORGE_STORAGE_KEY || process.env.INSFORGE_API_KEY;
const TEXT_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'imagen-4.0-fast-generate-001';

// InsForge Configuration (use environment variable if available)
const INSFORGE_BASE_URL = process.env.INSFORGE_STORAGE_URL || 'https://dx2ji8ea.us-west.insforge.app';
const INSFORGE_BUCKET = 'slides';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Generate 3 rough initial slide options
app.post('/generate-options', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log('Generating 3 rough options for:', prompt);

    // Create 3 different rough concept descriptions
    const concepts = [
      'minimalist with bold typography',
      'with data visualization focus',
      'with icon-heavy design'
    ];

    // Generate 3 images in parallel
    const promises = concepts.map(async (concept, index) => {
      const imagePrompt = `Simple rough sketch of a business pitch slide for: ${prompt}. Style: ${concept}. Wireframe style, basic layout, minimal detail, grayscale or simple colors, placeholder text blocks. Think of this as a preliminary concept sketch.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:predict?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [
              {
                prompt: imagePrompt,
              },
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: '16:9',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Option ${index + 1} generation failed`);
      }

      const data = await response.json();
      return {
        id: index + 1,
        concept: concept,
        imageBase64: data.predictions?.[0]?.bytesBase64Encoded,
        image: `data:image/png;base64,${data.predictions?.[0]?.bytesBase64Encoded}`,
      };
    });

    const options = await Promise.all(promises);

    res.json({
      success: true,
      options: options,
    });
  } catch (error) {
    console.error('Error generating options:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate sophisticated final slide based on selected option
app.post('/generate-final', async (req, res) => {
  const { prompt, selectedOption } = req.body;

  if (!prompt || selectedOption === undefined) {
    return res.status(400).json({ error: 'Prompt and selected option are required' });
  }

  try {
    console.log('Generating final slide for option:', selectedOption);

    const concepts = [
      'minimalist with bold typography',
      'with data visualization focus',
      'with icon-heavy design'
    ];

    const selectedConcept = concepts[selectedOption];

    // Step 1: Create detailed business pitch slide description
    const textResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are a professional business presentation designer. Create a sophisticated business pitch slide for this idea: "${prompt}"

Design style: ${selectedConcept}

First, provide a concise slide concept summary (for display to user) in this exact format:
SLIDE CONCEPT:
• Headline: [short, catchy title]
• Style: ${selectedConcept}
• Key Points: [3 short bullet points max 6 words each]

Then, describe the visual layout for image generation. Be specific about typography, colors, layout, and visual elements for creating an investor-ready pitch slide.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!textResponse.ok) {
      throw new Error('Text generation failed');
    }

    const textData = await textResponse.json();
    let fullDescription = textData.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
    console.log('Generated slide description:', fullDescription);

    // Extract the concept section for display
    let conceptDisplay = '';
    const conceptMatch = fullDescription.match(/SLIDE CONCEPT:([\s\S]*?)(?=\n\n|$)/);
    if (conceptMatch) {
      conceptDisplay = conceptMatch[1].trim();
      // Remove markdown double asterisks used for bold formatting
      conceptDisplay = conceptDisplay.replace(/\*\*/g, '');
    } else {
      // Fallback: create a concise display from the idea
      conceptDisplay = `• Headline: ${prompt.substring(0, 50)}...\n• Style: ${selectedConcept}\n• Key Points: Professional pitch design`;
    }

    // Step 2: Generate the high-quality slide image using Imagen
    const imageResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:predict?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [
            {
              prompt: `Ultra high-end professional business pitch slide: ${fullDescription}. Stunning visual design, investor-ready quality, crisp typography, perfect color harmony, print-quality resolution, modern aesthetic, Appropriate for Silicon Valley VC presentations.`,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
          },
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image API Error:', errorText);
      return res.status(500).json({ error: 'Image generation failed', details: errorText });
    }

    const imageData = await imageResponse.json();

    if (imageData.predictions && imageData.predictions.length > 0) {
      const imageBase64 = imageData.predictions[0].bytesBase64Encoded;
      res.json({
        success: true,
        image: `data:image/png;base64,${imageBase64}`,
        imageBase64: imageBase64,
        description: conceptDisplay,
      });
    } else {
      res.status(500).json({ error: 'No image generated' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get 3 AI-suggested refinement options
app.post('/get-refine-options', async (req, res) => {
  const { prompt, selectedOption } = req.body;

  if (!prompt || selectedOption === undefined) {
    return res.status(400).json({ error: 'Prompt and selected option are required' });
  }

  try {
    console.log('Generating refinement suggestions for:', prompt);

    const textResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an expert presentation designer. Based on this business idea: "${prompt}"

Suggest 3 specific ways to IMPROVE and REFINE a pitch slide for this idea. Each suggestion should be actionable and different from the others.

Format your response as a JSON array of strings, like this:
[
  "Make it more visual with data charts and infographics",
  "Add customer testimonials and social proof",
  "Emphasize the revenue model with clear financial projections"
]

Provide only the JSON array, no other text.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!textResponse.ok) {
      throw new Error('Refinement suggestions generation failed');
    }

    const textData = await textResponse.json();
    let suggestionsText = textData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON from the response
    let suggestions = [];
    try {
      // Extract JSON array from the response
      const jsonMatch = suggestionsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback suggestions if parsing fails
      suggestions = [
        "Add more visual elements and data visualizations",
        "Emphasize the unique value proposition more prominently",
        "Include social proof and credibility indicators"
      ];
    }

    // Ensure we have exactly 3 suggestions
    while (suggestions.length < 3) {
      suggestions.push(`Enhance the slide with more professional design elements`);
    }
    suggestions = suggestions.slice(0, 3);

    res.json({
      success: true,
      suggestions: suggestions,
    });
  } catch (error) {
    console.error('Error generating refinement suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refine the slide based on selected suggestion or custom instruction
app.post('/refine-slide', async (req, res) => {
  const { prompt, selectedOption, refinementInstruction, isCustom } = req.body;

  if (!prompt || selectedOption === undefined || !refinementInstruction) {
    return res.status(400).json({ error: 'Prompt, selected option, and refinement instruction are required' });
  }

  try {
    console.log('Refining slide with instruction:', refinementInstruction);

    const concepts = [
      'minimalist with bold typography',
      'with data visualization focus',
      'with icon-heavy design'
    ];

    const selectedConcept = concepts[selectedOption];

    // Step 1: Create refined business pitch slide description
    const textResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are a professional business presentation designer. Create a REFINED business pitch slide.

Original idea: "${prompt}"
Design style: ${selectedConcept}
REFINEMENT: ${refinementInstruction}

First, provide a concise slide concept summary (for display to user) in this exact format:
SLIDE CONCEPT:
• Headline: [short, catchy title]
• Style: ${selectedConcept}
• Refinement: ${refinementInstruction.substring(0, 30)}...
• Key Points: [3 short bullet points max 6 words each]

Then, describe the visual layout for image generation incorporating the refinement. Be specific about typography, colors, layout, and visual elements for creating an improved investor-ready pitch slide.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!textResponse.ok) {
      throw new Error('Refined description generation failed');
    }

    const textData = await textResponse.json();
    let fullDescription = textData.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
    console.log('Generated refined slide description:', fullDescription);

    // Extract the concept section for display
    let conceptDisplay = '';
    const conceptMatch = fullDescription.match(/SLIDE CONCEPT:([\s\S]*?)(?=\n\n|$)/);
    if (conceptMatch) {
      conceptDisplay = conceptMatch[1].trim();
      // Remove markdown double asterisks used for bold formatting
      conceptDisplay = conceptDisplay.replace(/\*\*/g, '');
    } else {
      // Fallback
      conceptDisplay = `• Headline: ${prompt.substring(0, 40)}...\n• Style: ${selectedConcept}\n• Refinement: Applied`;
    }

    // Step 2: Generate the refined slide image using Imagen
    const imageResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:predict?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [
            {
              prompt: `Ultra high-end professional business pitch slide (REFINED VERSION): ${fullDescription}. Stunning visual design, investor-ready quality, crisp typography, perfect color harmony, print-quality resolution, modern aesthetic, Appropriate for Silicon Valley VC presentations. This is an IMPROVED, more polished version with enhanced visual appeal.`,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
          },
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Image API Error:', errorText);
      return res.status(500).json({ error: 'Image generation failed', details: errorText });
    }

    const imageData = await imageResponse.json();

    if (imageData.predictions && imageData.predictions.length > 0) {
      const imageBase64 = imageData.predictions[0].bytesBase64Encoded;
      res.json({
        success: true,
        image: `data:image/png;base64,${imageBase64}`,
        imageBase64: imageBase64,
        description: conceptDisplay,
        isRefinement: true,
      });
    } else {
      res.status(500).json({ error: 'No image generated' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload slide to InsForge
app.post('/upload', async (req, res) => {
  const { imageBase64, prompt } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create object path/key from prompt (sanitize and limit length)
    const sanitizedPrompt = prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    const timestamp = Date.now();
    const objectKey = `slides/${sanitizedPrompt}/${timestamp}.png`;

    // Create FormData for InsForge upload
    const form = new FormData();

    // InsForge expects 'file' field
    form.append('file', buffer, {
      filename: `${timestamp}.png`,
      contentType: 'image/png',
    });

    // Upload to InsForge using PUT method with axios
    const uploadResponse = await axios.put(
      `${INSFORGE_BASE_URL}/api/storage/buckets/${INSFORGE_BUCKET}/objects/${objectKey}`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${INSFORGE_API_KEY}`,
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log('Upload successful:', uploadResponse.data);

    const data = uploadResponse.data.data || uploadResponse.data;

    res.json({
      success: true,
      key: data.key,
      fileName: objectKey,
      fileUrl: data.url,
      bucket: data.bucket,
      uploadedAt: data.uploadedAt,
    });
  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Upload to InsForge failed',
      details: error.response?.data || error.message,
    });
  }
});

// Validate required environment variables
if (!GOOGLE_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY or GOOGLE_GENAI_API_KEY environment variable is not set');
  process.exit(1);
}

if (!INSFORGE_API_KEY) {
  console.error('ERROR: INSFORGE_STORAGE_KEY or INSFORGE_API_KEY environment variable is not set');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Text Model: ${TEXT_MODEL}`);
  console.log(`Image Model: ${IMAGE_MODEL}`);
  console.log(`InsForge Bucket: ${INSFORGE_BUCKET}`);
});
