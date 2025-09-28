import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from a .env file
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

async function testGeminiApi() {
  if (!API_KEY) {
    console.error('Error: GEMINI_API_KEY not found. Please create a .env file with your key.');
    process.exit(1);
  }

  console.log('Testing Gemini API...');

  const simplePrompt = "Write a short, two-sentence paragraph about the future of AI.";

  const requestBody = {
    contents: [{
      parts: [{
        text: simplePrompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 100,
    }
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`\nResponse Status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('Error: No content generated. Full response:');
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    console.log('\n✅ Test Passed! API call was successful.');
    console.log('\nGenerated Content:');
    console.log('--------------------');
    console.log(generatedText.trim());
    console.log('--------------------');

  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error(error);
  }
}

testGeminiApi();
