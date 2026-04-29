export const PromptTemplates = {
  summarize: (text: string, maxLength: string = 'medium') => `
    You are an expert editor. Summarize the following article.
    The length of the summary should be: ${maxLength}.
    Return ONLY the summary text, no extra formatting or markdown.
    
    Article text:
    ${text}
  `,

  translate: (
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ) => `
    You are an expert translator. Translate the following article text into ${targetLanguage}.
    ${sourceLanguage ? `The original language is ${sourceLanguage}.` : ''}
    Return ONLY the translated text, no extra formatting.
    
    Article text:
    ${text}
  `,

  analyze: (text: string, task: string = 'review') => `
    You are an expert technical reviewer. Analyze the following article focusing on: ${task}.
    You MUST return ONLY a valid, raw JSON object (without markdown code blocks) with this exact structure:
    {
      "analysis": "your detailed analysis paragraph",
      "suggestions": ["suggestion 1", "suggestion 2"],
      "severity": "info" // must be one of: "info", "warning", "error"
    }
    
    Article text:
    ${text}
  `,
};
