// Groq AI integration
import OpenAI from "openai";

const openai = new OpenAI({ 
  baseURL: "https://api.groq.com/openai/v1", 
  apiKey: process.env.GROQ_API_KEY 
});

// Westmead International School context
const WESTMEAD_CONTEXT = `
You are an AI assistant for Westmead International School (WIS), the ONLY international school recognized by DepEd, TESDA, and CHED.

KEY FACTS:
- Founded: 2004 (originally as Batangas Institute of Science and Technology, became Westmead International School on September 5, 2006)
- Location: Batangas City, Batangas, Philippines
- Website: https://westmead-is.edu.ph/
- Unique Status: Only international school accredited by all three major Philippine education bodies (DepEd, TESDA, CHED)
- Motto: "WIS education is geared towards the full consummation of the talents and potentials of the Filipino in the task of nation-building"
- Mascot/Identity: Westmead Warriors
- Offers: Full range of courses from preparatory school to college level

IMPORTANT RULES:
1. ONLY answer questions related to Westmead International School
2. If asked about other schools, politely redirect to Westmead-specific information
3. If you don't have specific information, acknowledge it but stay on topic
4. Be professional, helpful, and enthusiastic about WIS
5. Encourage visitors to apply or contact the school for more details

If asked about non-school topics, respond with: "I'm specifically designed to assist with questions about Westmead International School. Please ask me about our admissions, programs, campus facilities, or any other school-related topics!"
`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

import { storage } from "./storage";

export async function getChatResponse(
  userQuestion: string,
  conversationHistory: ChatMessage[] = []
): Promise<{
  answer: string;
  category: string | null;
}> {
  try {
    // Get active FAQs from the database
    const activeFaqs = await storage.getActiveFaqs();
    
    // Create FAQ context
    const faqContext = activeFaqs.map(faq => 
      `Q: ${faq.question}\nA: ${faq.answer}`
    ).join('\n\n');

    // Combine static context with FAQ context
    const fullContext = `${WESTMEAD_CONTEXT}\n\nFREQUENTLY ASKED QUESTIONS:\n${faqContext}`;

    const messages: ChatMessage[] = [
      { role: "system", content: fullContext },
      ...conversationHistory,
      { role: "user", content: userQuestion }
    ];

    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try asking your question again.";

    // Categorize the question
    const category = categorizeQuestion(userQuestion);

    return { answer, category };
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("Failed to get AI response: " + (error as Error).message);
  }
}

function categorizeQuestion(question: string): string | null {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.match(/admissions?|apply|enroll|requirements?|how to join/)) {
    return "admissions";
  }
  if (lowerQuestion.match(/program|course|degree|study|curriculum|major/)) {
    return "academic";
  }
  if (lowerQuestion.match(/campus|facilities|building|library|lab|location/)) {
    return "campus";
  }
  if (lowerQuestion.match(/scholarship|financial|aid|grant|discount/)) {
    return "scholarships";
  }
  
  return "general";
}

// Text-to-speech helper (returns text for browser's Speech Synthesis API)
export function prepareTextForSpeech(text: string): string {
  // Clean up text for better speech output
  return text
    .replace(/WIS/g, "W I S")
    .replace(/DepEd/g, "DepEd")
    .replace(/TESDA/g, "TESDA")
    .replace(/CHED/g, "CHED")
    .replace(/\n/g, " ")
    .trim();
}
