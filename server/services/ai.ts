import Anthropic from '@anthropic-ai/sdk';
import OpenAI from "openai";
import { storage } from '../storage';
import { formatDocumentForPrompt } from './document';
import type { PromptTemplate } from '@shared/schema';
import fs from 'fs';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || "default_key",
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY || "default_key" 
});

export interface ObituaryFormData {
  fullName: string;
  age?: number;
  dateOfBirth?: string;
  dateOfDeath?: string;
  location?: string;
  highSchool?: string;
  hsGradYear?: number;
  higherEducation?: string;
  degree?: string;
  jobTitle?: string;
  company?: string;
  yearsOfService?: number;
  achievements?: string;
  spouseName?: string;
  anniversaryDate?: string;
  spouseDeceased?: boolean;
  children?: Array<{
    relation: string;
    name: string;
    spouse?: string;
    deceased?: boolean;
  }>;
  grandchildrenCount?: number;
  greatGrandchildrenCount?: number;
  tone: string;
  ageCategory: string;
  traits?: string[];
  hobbies?: string[];
  hobbiesDetails?: string;
  religion?: string;
  religiousOrganization?: string;
  religiousVerse?: string;
  favoriteQuotes?: string;
  memorialRequests?: string;
  specialNotes?: string;
  avoidNotes?: string;
}

export interface GeneratedObituaryResult {
  content: string;
  tone: string;
}

function createObituaryPrompt(formData: ObituaryFormData, isRevision: boolean = false, feedback?: { liked: string[]; disliked: string[] }): string {
  let prompt = `Write a heartfelt obituary for ${formData.fullName}`;
  
  if (formData.age) prompt += `, age ${formData.age}`;
  prompt += `. Use a ${formData.tone} tone appropriate for a ${formData.ageCategory} person.\n\n`;
  
  prompt += "Include the following information:\n";
  
  if (formData.dateOfBirth || formData.dateOfDeath) {
    prompt += `- Born ${formData.dateOfBirth || '[date]'}`;
    if (formData.dateOfDeath) prompt += `, passed away ${formData.dateOfDeath}`;
    prompt += "\n";
  }
  
  if (formData.location) prompt += `- Location: ${formData.location}\n`;
  
  if (formData.highSchool || formData.higherEducation) {
    prompt += "- Education: ";
    if (formData.highSchool) prompt += `${formData.highSchool}`;
    if (formData.hsGradYear) prompt += ` (${formData.hsGradYear})`;
    if (formData.higherEducation) {
      if (formData.highSchool) prompt += ", ";
      prompt += `${formData.higherEducation}`;
      if (formData.degree) prompt += ` - ${formData.degree}`;
    }
    prompt += "\n";
  }
  
  if (formData.jobTitle || formData.company) {
    prompt += "- Career: ";
    if (formData.jobTitle) prompt += formData.jobTitle;
    if (formData.company) prompt += ` at ${formData.company}`;
    if (formData.yearsOfService) prompt += ` for ${formData.yearsOfService} years`;
    prompt += "\n";
  }
  
  if (formData.achievements) prompt += `- Achievements: ${formData.achievements}\n`;
  
  if (formData.spouseName) {
    prompt += `- ${formData.spouseDeceased ? 'Was preceded in death by' : 'Survived by'} spouse: ${formData.spouseName}`;
    if (formData.anniversaryDate) prompt += ` (married ${formData.anniversaryDate})`;
    prompt += "\n";
  }
  
  if (formData.children && formData.children.length > 0) {
    prompt += "- Children: ";
    const childrenDesc = formData.children.map(child => {
      let desc = `${child.relation} ${child.name}`;
      if (child.spouse) desc += ` (${child.spouse})`;
      if (child.deceased) desc += " (deceased)";
      return desc;
    }).join(", ");
    prompt += childrenDesc + "\n";
  }
  
  if (formData.grandchildrenCount) prompt += `- ${formData.grandchildrenCount} grandchildren\n`;
  if (formData.greatGrandchildrenCount) prompt += `- ${formData.greatGrandchildrenCount} great-grandchildren\n`;
  
  if (formData.traits && formData.traits.length > 0) {
    prompt += `- Personality traits: ${formData.traits.join(", ")}\n`;
  }
  
  if (formData.hobbies && formData.hobbies.length > 0) {
    prompt += `- Hobbies and interests: ${formData.hobbies.join(", ")}`;
    if (formData.hobbiesDetails) prompt += `. ${formData.hobbiesDetails}`;
    prompt += "\n";
  }
  
  if (formData.religion) {
    prompt += `- Religion: ${formData.religion}`;
    if (formData.religiousOrganization) prompt += ` (member of ${formData.religiousOrganization})`;
    if (formData.religiousVerse) prompt += `. Include this verse: "${formData.religiousVerse}"`;
    prompt += "\n";
  }
  
  if (formData.favoriteQuotes) prompt += `- Include this favorite quote or saying: "${formData.favoriteQuotes}"\n`;
  
  if (formData.memorialRequests) prompt += `- Memorial requests: ${formData.memorialRequests}\n`;
  
  if (formData.specialNotes) prompt += `- Special notes to include: ${formData.specialNotes}\n`;
  
  if (formData.avoidNotes) prompt += `- Please avoid mentioning: ${formData.avoidNotes}\n`;
  
  if (isRevision && feedback) {
    prompt += "\n--- REVISION INSTRUCTIONS ---\n";
    if (feedback.liked.length > 0) {
      prompt += "Please include similar language and themes to these phrases the family liked:\n";
      feedback.liked.forEach(text => prompt += `- "${text}"\n`);
    }
    if (feedback.disliked.length > 0) {
      prompt += "Please avoid or rephrase content similar to these phrases the family wants changed:\n";
      feedback.disliked.forEach(text => prompt += `- "${text}"\n`);
    }
  }
  
  prompt += "\nWrite a complete, flowing obituary that honors their memory appropriately. Make it personal and meaningful.";
  
  return prompt;
}

async function getTemplateWithContext(platform: string, promptType: string): Promise<string> {
  const template = await storage.getPromptTemplate(platform, promptType);
  let prompt = template?.template || createObituaryPrompt({} as ObituaryFormData);
  
  // Add document context if available
  if (template?.contextDocument && template?.contextDocumentName) {
    try {
      if (fs.existsSync(template.contextDocument)) {
        const documentText = fs.readFileSync(template.contextDocument, 'utf-8');
        prompt += formatDocumentForPrompt(documentText, template.contextDocumentName);
      }
    } catch (error) {
      console.error('Error reading context document:', error);
    }
  }
  
  return prompt;
}

function substituteTemplateVariables(template: string, formData: ObituaryFormData): string {
  let result = template;
  
  // Replace template variables with actual data
  result = result.replace(/\{\{fullName\}\}/g, formData.fullName || '');
  result = result.replace(/\{\{age\}\}/g, formData.age?.toString() || '');
  result = result.replace(/\{\{dateOfBirth\}\}/g, formData.dateOfBirth || '');
  result = result.replace(/\{\{dateOfDeath\}\}/g, formData.dateOfDeath || '');
  result = result.replace(/\{\{location\}\}/g, formData.location || '');
  result = result.replace(/\{\{tone\}\}/g, formData.tone || '');
  result = result.replace(/\{\{ageCategory\}\}/g, formData.ageCategory || '');
  result = result.replace(/\{\{jobTitle\}\}/g, formData.jobTitle || '');
  result = result.replace(/\{\{company\}\}/g, formData.company || '');
  result = result.replace(/\{\{spouseName\}\}/g, formData.spouseName || '');
  result = result.replace(/\{\{education\}\}/g, formData.higherEducation || formData.highSchool || '');
  result = result.replace(/\{\{hobbies\}\}/g, formData.hobbies?.join(', ') || '');
  result = result.replace(/\{\{traits\}\}/g, formData.traits?.join(', ') || '');
  result = result.replace(/\{\{achievements\}\}/g, formData.achievements || '');
  result = result.replace(/\{\{religion\}\}/g, formData.religion || '');
  result = result.replace(/\{\{specialNotes\}\}/g, formData.specialNotes || '');
  
  return result;
}

export async function generateObituariesWithClaude(formData: ObituaryFormData, userId: number = 1, userType: string = 'admin'): Promise<GeneratedObituaryResult[]> {
  const templatePrompt = await getTemplateWithContext('claude', 'base');
  const basePrompt = substituteTemplateVariables(templatePrompt, formData);
  const results: GeneratedObituaryResult[] = [];
  
  const variations = [
    { suffix: " Focus on their professional accomplishments and community impact.", tone: "Traditional" },
    { suffix: " Emphasize their relationships and the joy they brought to others.", tone: "Celebratory" },
    { suffix: " Tell their life story through meaningful moments and personal anecdotes.", tone: "Personal" }
  ];
  
  for (let i = 0; i < variations.length; i++) {
    let apiCallId: number | null = null;
    try {
      const prompt = basePrompt + variations[i].suffix;
      
      // Create API call record for tracking
      apiCallId = await storage.createApiCall({
        userId,
        userType,
        provider: 'claude',
        model: 'claude-sonnet-4-20250514',
        platformFunction: 'obituary_generation',
        promptTemplate: `Obituary ${variations[i].tone}`,
        status: 'pending',
      });
      
      const message = await anthropic.messages.create({
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-sonnet-4-20250514',
      });
      
      const content = Array.isArray(message.content) ? 
        (message.content[0].type === 'text' ? (message.content[0] as any).text : '') : 
        message.content;
      
      // Calculate costs and update API call record
      const inputTokens = message.usage.input_tokens;
      const outputTokens = message.usage.output_tokens;
      const inputCost = (inputTokens / 1000) * 0.003; // $3 per 1M tokens
      const outputCost = (outputTokens / 1000) * 0.015; // $15 per 1M tokens
      
      if (apiCallId) {
        await storage.updateApiCall(apiCallId, {
          inputTokens,
          outputTokens,
          tokensUsed: inputTokens + outputTokens,
          inputCost: inputCost.toString(),
          outputCost: outputCost.toString(),
          status: 'completed',
        });
      }
      
      results.push({
        content: content || '',
        tone: variations[i].tone
      });
    } catch (error) {
      console.error(`Error generating Claude obituary ${i + 1}:`, error);
      
      // Update API call record with error
      if (apiCallId) {
        await storage.updateApiCall(apiCallId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      results.push({
        content: `Error generating obituary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tone: variations[i].tone
      });
    }
  }
  
  return results;
}

export async function generateObituariesWithChatGPT(formData: ObituaryFormData, userId: number = 1, userType: string = 'admin'): Promise<GeneratedObituaryResult[]> {
  const templatePrompt = await getTemplateWithContext('chatgpt', 'base');
  const basePrompt = substituteTemplateVariables(templatePrompt, formData);
  const results: GeneratedObituaryResult[] = [];
  
  const variations = [
    { suffix: " Write in a formal, respectful style with traditional obituary structure.", tone: "Formal" },
    { suffix: " Write with warmth and focus on the love and connections they shared.", tone: "Warm" },
    { suffix: " Write as a narrative story that captures their unique personality and journey.", tone: "Narrative" }
  ];
  
  for (let i = 0; i < variations.length; i++) {
    let apiCallId: number | null = null;
    try {
      const prompt = basePrompt + variations[i].suffix;
      
      // Create API call record for tracking
      apiCallId = await storage.createApiCall({
        userId,
        userType,
        provider: 'openai',
        model: 'gpt-4o',
        platformFunction: 'obituary_generation',
        promptTemplate: `Obituary ${variations[i].tone}`,
        status: 'pending',
      });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });
      
      // Calculate costs and update API call record
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const inputCost = (inputTokens / 1000) * 0.01; // $10 per 1M tokens
      const outputCost = (outputTokens / 1000) * 0.03; // $30 per 1M tokens
      
      if (apiCallId) {
        await storage.updateApiCall(apiCallId, {
          inputTokens,
          outputTokens,
          tokensUsed: inputTokens + outputTokens,
          inputCost: inputCost.toString(),
          outputCost: outputCost.toString(),
          status: 'completed',
        });
      }
      
      results.push({
        content: response.choices[0].message.content || '',
        tone: variations[i].tone
      });
    } catch (error) {
      console.error(`Error generating ChatGPT obituary ${i + 1}:`, error);
      
      // Update API call record with error
      if (apiCallId) {
        await storage.updateApiCall(apiCallId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      results.push({
        content: `Error generating obituary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tone: variations[i].tone
      });
    }
  }
  
  return results;
}

export async function generateRevisedObituary(
  originalFormData: ObituaryFormData,
  feedback: { liked: string[]; disliked: string[] },
  aiProvider: 'claude' | 'chatgpt'
): Promise<GeneratedObituaryResult> {
  // Use revision template if available, otherwise fall back to base template with revision instructions
  let templatePrompt = await getTemplateWithContext(aiProvider, 'revision');
  if (!templatePrompt || templatePrompt === createObituaryPrompt({} as ObituaryFormData)) {
    templatePrompt = await getTemplateWithContext(aiProvider, 'base');
  }
  
  const basePrompt = substituteTemplateVariables(templatePrompt, originalFormData);
  
  // Add revision-specific instructions
  let prompt = basePrompt + "\n\n--- REVISION INSTRUCTIONS ---\n";
  
  if (feedback.liked.length > 0) {
    prompt += "Please include similar language and themes to these phrases the family liked:\n";
    feedback.liked.forEach(text => prompt += `- "${text}"\n`);
  }
  
  if (feedback.disliked.length > 0) {
    prompt += "Please avoid or rewrite content similar to these phrases the family disliked:\n";
    feedback.disliked.forEach(text => prompt += `- "${text}"\n`);
  }
  
  prompt += "\nPlease revise the obituary incorporating this feedback while maintaining the overall quality and tone.";
  
  try {
    if (aiProvider === 'claude') {
      const message = await anthropic.messages.create({
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-sonnet-4-20250514',
      });
      
      const content = Array.isArray(message.content) ? 
        (message.content[0].type === 'text' ? (message.content[0] as any).text : '') : 
        message.content;
      
      return {
        content: content || '',
        tone: "Revised"
      };
    } else {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });
      
      return {
        content: response.choices[0].message.content || '',
        tone: "Revised"
      };
    }
  } catch (error) {
    console.error(`Error generating revised ${aiProvider} obituary:`, error);
    return {
      content: `Error generating revised obituary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tone: "Revised"
    };
  }
}
