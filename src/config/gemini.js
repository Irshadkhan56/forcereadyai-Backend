/**
 * Configuration options for the Google Gemini API.
 */
export const GEMINI_CONFIG = {
  // We use the fast, reliable gemini-1.5-flash model by default for general tasks & JSON generation
  defaultModel: 'gemini-1.5-flash',
  
  // Generation parameters for structured, predictable responses
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  },
  
  // Generation configuration when demanding JSON schema output
  jsonGenerationConfig: {
    temperature: 0.2, // Low temperature for high deterministic accuracy
    topP: 0.95,
    responseMimeType: 'application/json',
  }
};
