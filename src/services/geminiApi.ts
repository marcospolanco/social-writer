import { PostFeedback } from '../types/feedback';

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const analyzePostWithGemini = async (
  text: string,
  apiKey: string,
  brandPositioning?: string
): Promise<PostFeedback> => {
  if (!text.trim()) {
    throw new Error('No content to analyze');
  }

  console.log('Analyzing post with Gemini:', {
    textLength: text.length,
    hasApiKey: !!apiKey,
    hasBrandGuide: !!brandPositioning
  });

  const brandContext = brandPositioning ? `

BRAND POSITIONING CONTEXT:
Use the following brand positioning document to ensure the analysis and suggestions align with the brand's voice, messaging, and positioning strategy:

"""
${brandPositioning}
"""

When providing feedback and suggestions, ensure they are consistent with this brand positioning. Consider:
- Brand voice and tone alignment
- Messaging consistency with brand pillars
- Authenticity to the brand personality
- Adherence to communication guidelines
` : '';

  const prompt = `
You are an expert LinkedIn content strategist. Analyze the following LinkedIn post and provide detailed feedback based on these criteria:

1. Hook Quality: How well does the first line grab attention?
2. Story Structure: Does it follow situation-conflict-resolution-lesson format?
3. Scannability: Is it formatted for mobile reading with proper spacing?
4. Takeaway/CTA: Is there a clear lesson and call-to-action?
5. Authenticity: Balance of professional expertise with human authenticity?

${brandContext}

Post to analyze:
"""
${text}
"""

Provide your response as a JSON object with this exact structure:
{
  "overall_score": "A|B|C|D|F",
  "overall_points": number (0-100),
  "hook_quality": {
    "score": "A|B|C|D|F",
    "points": number (0-100),
    "comments": ["specific feedback about the opening"],
    "suggestions": ["actionable improvements"]
  },
  "story_structure": {
    "score": "A|B|C|D|F", 
    "points": number (0-100),
    "comments": ["feedback about narrative flow"],
    "suggestions": ["structural improvements"]
  },
  "scannability": {
    "score": "A|B|C|D|F",
    "points": number (0-100), 
    "comments": ["feedback about formatting and readability"],
    "suggestions": ["formatting improvements"]
  },
  "takeaway_cta": {
    "score": "A|B|C|D|F",
    "points": number (0-100),
    "comments": ["feedback about value and engagement"],
    "suggestions": ["ways to improve call-to-action"]
  },
  "authenticity": {
    "score": "A|B|C|D|F",
    "points": number (0-100),
    "comments": ["feedback about professional/human balance"],
    "suggestions": ["authenticity improvements"]
  },
  "general_feedback": ["overall observations and key recommendations"]
}

Grade strictly:
- A (90-100): Exceptional, viral potential
- B (80-89): Very good, strong engagement likely  
- C (70-79): Good, decent performance expected
- D (60-69): Needs improvement, limited reach
- F (0-59): Poor, major revision needed

Focus on actionable, specific feedback that helps improve engagement${brandPositioning ? ' while maintaining brand consistency' : ''}.
`;

  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || 
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('Empty response from Gemini API. Full response:', data);
      throw new Error('No response generated from Gemini API');
    }

    // Clean up the response to extract JSON
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini API');
    }

    const feedback: PostFeedback = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!feedback.overall_score || !feedback.hook_quality) {
      throw new Error('Invalid feedback structure received');
    }

    return feedback;
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to analyze content with Gemini API');
  }
};
export const improvePostWithGemini = async (
  originalText: string,
  feedback: PostFeedback,
  apiKey: string,
  brandPositioning?: string
): Promise<string> => {
  if (!originalText.trim()) {
    throw new Error('No content to improve');
  }

  const brandContext = brandPositioning ? `

BRAND POSITIONING CONTEXT:
Ensure all improvements align with the following brand positioning:

"""
${brandPositioning}
"""

Maintain consistency with the brand voice, messaging pillars, and communication guidelines while making improvements.
` : '';

  const feedbackSummary = `
Current Feedback Analysis:
- Overall Score: ${feedback.overall_score} (${feedback.overall_points}/100)
- Hook Quality: ${feedback.hook_quality.score} - ${feedback.hook_quality.suggestions.join(', ')}
- Story Structure: ${feedback.story_structure.score} - ${feedback.story_structure.suggestions.join(', ')}
- Scannability: ${feedback.scannability.score} - ${feedback.scannability.suggestions.join(', ')}
- Takeaway/CTA: ${feedback.takeaway_cta.score} - ${feedback.takeaway_cta.suggestions.join(', ')}
- Authenticity: ${feedback.authenticity.score} - ${feedback.authenticity.suggestions.join(', ')}

General Feedback: ${feedback.general_feedback.join(' ')}
`;

  const prompt = `
You are an expert LinkedIn content strategist. I need you to improve the following LinkedIn post by applying the specific feedback provided.

${brandContext}

ORIGINAL POST:
"""
${originalText}
"""

${feedbackSummary}

INSTRUCTIONS:
1. Apply ALL the suggestions from the feedback to improve the post
2. Maintain the original message and intent
3. Keep the markdown formatting
4. Focus on improving engagement potential
5. Ensure the improved post addresses the weaknesses identified in each rubric area
6. Make the hook more compelling if needed
7. Improve story structure and flow
8. Enhance scannability with better formatting
9. Strengthen the takeaway and call-to-action
10. Maintain authenticity while being more engaging${brandPositioning ? '\n11. Stay consistent with the brand positioning provided' : ''}

Return ONLY the improved post content in markdown format, without any additional commentary or explanations. The response should be ready to use directly in the editor.
`;

  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || 
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const improvedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!improvedText) {
      throw new Error('No improved content generated from Gemini API');
    }

    // Clean up the response and return the improved text
    return improvedText.trim();
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to improve content with Gemini API');
  }
};