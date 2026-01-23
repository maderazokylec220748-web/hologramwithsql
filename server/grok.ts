// AI integrations - Groq (primary) and Gemini (backup)
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({ 
  baseURL: "https://api.groq.com/openai/v1", 
  apiKey: process.env.GROQ_API_KEY 
});

// Initialize Gemini as backup
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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

CONVERSATION GUIDELINES:
1. Handle short queries intelligently - if someone says "forest", "library", "enrollment", etc., provide relevant information about that topic at WIS
2. Maintain conversational context - if they ask follow-up questions like "why?", "when?", "how?", refer back to the previous conversation
3. For single words or very short queries, interpret them as questions about WIS and provide helpful information
4. Be natural and conversational - remember what was discussed earlier in the conversation
5. If a question is unclear, make a reasonable interpretation based on context and WIS topics

IMPORTANT RULES:
1. ONLY answer questions related to Westmead International School
2. If asked about other schools, politely redirect to Westmead-specific information
3. If you don't have specific information, acknowledge it but stay on topic
4. Be professional, helpful, and enthusiastic about WIS
5. Encourage visitors to apply or contact the school for more details

If asked about non-school topics (that cannot be related to WIS), respond with: "I'm specifically designed to assist with questions about Westmead International School. Please ask me about our admissions, programs, campus facilities, or any other school-related topics!"
`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

import { storage } from "./storage";

export async function getChatResponse(
  userQuestion: string,
  conversationHistory: ChatMessage[] = [],
  language: 'en' | 'tl' = 'en'
): Promise<{
  answer: string;
  category: string | null;
}> {
  // Get active FAQs from the database
  const activeFaqs = await storage.getActiveFaqs();
  
  // Get professors, facilities, and events data
  const professors = await storage.getAllProfessors();
  const facilities = await storage.getAllFacilities();
  const upcomingEvents = await storage.getUpcomingEvents();
  
  // Create FAQ context
  const faqContext = activeFaqs.map(faq => 
    `Q: ${faq.question}\nA: ${faq.answer}`
  ).join('\n\n');

  // Create professors context
  const professorsContext = professors.length > 0 
    ? professors.map(prof => 
        `${prof.fullName} - ${prof.position} in ${prof.department}${prof.email ? ` (${prof.email})` : ''}${prof.description ? `\n  ${prof.description}` : ''}`
      ).join('\n')
    : 'No professor information available yet.';

  // Create facilities context
  const facilitiesContext = facilities.length > 0
    ? facilities.map(fac => 
        `${fac.name} (${fac.type}) - Located at ${fac.location}${fac.capacity ? `, Capacity: ${fac.capacity}` : ''}, Status: ${fac.status}${fac.description ? `\n  ${fac.description}` : ''}`
      ).join('\n')
    : 'No facility information available yet.';

  // Create events context
  const eventsContext = upcomingEvents.length > 0
    ? upcomingEvents.map(event => {
        const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        return `${event.title} (${event.eventType}) - ${eventDate} at ${event.location}\n  Organized by: ${event.department || 'School Administration'}\n  ${event.description}`;
      }).join('\n\n')
    : 'No upcoming events scheduled.';

  // Combine all contexts
  const fullContext = `${WESTMEAD_CONTEXT}

FREQUENTLY ASKED QUESTIONS:
${faqContext}

OUR FACULTY & STAFF:
${professorsContext}

CAMPUS FACILITIES:
${facilitiesContext}

UPCOMING EVENTS:
${eventsContext}

Use this information to answer questions about our professors, faculty, staff, facilities, campus resources, and upcoming events. When asked about professors or staff, provide their details from the faculty list above. When asked about facilities, describe what we have available on campus. When asked about events or activities, provide the event details from the upcoming events list above, including dates, times, locations, and descriptions.`;

  const languageInstruction = language === 'tl'
    ? '\nLANGUAGE: Respond in Tagalog (Filipino). Keep school names, acronyms, and proper nouns in English as appropriate.'
    : '';

  const messages: ChatMessage[] = [
    { role: "system", content: `${fullContext}${languageInstruction}` },
    ...conversationHistory,
    { role: "user", content: userQuestion }
  ];

  // Try Groq first (primary AI)
  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try asking your question again.";
    const category = categorizeQuestion(userQuestion);

    return { answer, category };
  } catch (groqError) {
    console.error("Groq API error:", groqError);
    
    // Fallback to Gemini if available
    if (genAI) {
      try {
        console.log("Falling back to Gemini AI...");
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        // Convert conversation history to Gemini format
        const conversationText = conversationHistory
          .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
          .join('\n');
        
        const prompt = `${fullContext}${languageInstruction}\n\n${conversationText}\n\nUser: ${userQuestion}\n\nAssistant:`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text() || "I apologize, but I couldn't generate a response. Please try asking your question again.";
        
        const category = categorizeQuestion(userQuestion);
        
        return { answer, category };
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        throw new Error("Both AI services are unavailable. Please try again later.");
      }
    } else {
      throw new Error("Primary AI service is unavailable and no backup is configured.");
    }
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
  if (lowerQuestion.match(/professor|teacher|faculty|staff|instructor|dean|who teaches/)) {
    return "faculty";
  }
  if (lowerQuestion.match(/campus|facilities|facility|building|library|lab|location|room|classroom|gym/)) {
    return "campus";
  }
  if (lowerQuestion.match(/scholarship|financial|aid|grant|discount/)) {
    return "scholarships";
  }
  if (lowerQuestion.match(/event|activity|activities|upcoming|schedule|competition|sport|tournament|program|concert|meeting|conference|workshop|seminar|fair|celebration|gathering/)) {
    return "events";
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
