// AI integration - Local Ollama (offline, privacy-first)
import { ollama } from "./ollama.js";
import { storage } from "./storage";

// ============================================
// CONTENT FILTERING - SCHOOL-ONLY MODE
// ============================================
// Keywords that indicate off-topic or harmful requests
const BLOCKED_PATTERNS = [
  /^(exit|quit|shutdown|close|restart|kill|terminate)/i,
  /^(hack|crack|exploit|vulnerability|breach)/i,
  /^(inappropriate|adult|nsfw|explicit|sexual)/i,
  /(delete|remove|drop) (database|tables|data)/i,
  /(create|execute|run|code|script|command)/i,
  /^(who are you|what is your name|tell me about yourself)/i,
  /^(instruction|prompt|system)/i,
];

// Keywords that indicate school-related questions
const SCHOOL_KEYWORDS = [
  'school', 'class', 'student', 'teacher', 'professor', 'faculty', 'staff', 'dean', 'director', 'head',
  'enroll', 'enrollment', 'admit', 'admission', 'apply', 'application', 'courses', 'course', 'program', 'programs', 'major', 'grade', 'department',
  'library', 'facility', 'facilities', 'campus', 'event', 'events', 'schedule', 'timetable',
  'tuition', 'fee', 'fees', 'payment', 'scholarship', 'scholarships', 'financial',
  'accommodation', 'dormitory', 'housing', 'club', 'activity', 'activities',
  'exam', 'test', 'assignment', 'deadline', 'requirement', 'requirements',
  'registrar', 'office', 'contact', 'phone', 'email', 'address',
  'westmead', 'wis', 'international', 'faq', 'information',
  'citcs', 'cas', 'chs', 'che', 'cts', 'cie', 'ces',  // Common department acronyms
  // More natural question words
  'offer', 'offers', 'provide', 'provides', 'available', 'have', 'has', 'there',
  'study', 'learn', 'education', 'educational', 'academic', 'academics',
  'science', 'math', 'engineering', 'business', 'arts', 'humanities',
  'building', 'buildings', 'room', 'rooms', 'location', 'locations',
  'upcoming', 'happening', 'held', 'organized', 'organize',
  'register', 'registration', 'join', 'joining', 'participate', 'enrol',
  'help', 'assist', 'info', 'details', 'detail', 'about', 'regarding',
  'who', 'what', 'where', 'when', 'how', 'why', 'can', 'could', 'do', 'does'
];

// Check if question is school-related
function isSchoolRelated(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  
  // Check if it matches blocked patterns (off-topic or harmful)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lowerQuestion)) {
      return false;
    }
  }
  
  // Check if it contains school keywords
  const hasSchoolKeyword = SCHOOL_KEYWORDS.some(keyword => 
    lowerQuestion.includes(keyword)
  );
  
  // Also accept greetings and general queries
  const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)/i.test(lowerQuestion);
  const isGeneral = question.trim().length < 5; // Very short questions might be greetings
  
  // Be more lenient - if question is >10 chars and not blocked, let it through
  // This allows natural school-related questions to pass even without exact keywords
  const isReasonableLength = question.trim().length >= 10;
  
  return hasSchoolKeyword || isGreeting || isGeneral || isReasonableLength;
}

// SYSTEM PROMPT - Official School Kiosk Mode
// GROUNDED GENERATION MODE - ABSOLUTE STRICTNESS
const SYSTEM_PROMPT = `🔒 GROUNDED GENERATION MODE - ZERO HALLUCINATION 🔒

YOU ARE A DATABASE LOOKUP TOOL. YOU CAN ONLY READ AND REPEAT DATABASE CONTENT.

=== CRITICAL RULES (VIOLATION = FAILURE) ===

1. DATABASE CONTENT ONLY
   - ONLY use information from the "DATABASE CONTENT" section below
   - You CANNOT use ANY knowledge from your training
   - You CANNOT make assumptions or inferences
   - You CANNOT add details not explicitly stated in the database
   
2. IF INFORMATION IS IN DATABASE
   - Answer directly using ONLY the database text
   - You may rephrase or combine database sentences
   - Keep answers SHORT and FACTUAL
   - No fluff, no preambles, no "According to..."

3. IF INFORMATION IS NOT IN DATABASE
   - STOP IMMEDIATELY
   - Do NOT try to answer from memory
   - Do NOT make educated guesses
   - Respond: "I don't have that information available right now. I can help you with questions about Westmead's programs, faculty, facilities, events, admissions, and scholarships."

4. ABSOLUTELY FORBIDDEN
   🚫 Using world knowledge or training data
   🚫 Saying "Westmead is a suburb" or similar external facts
   🚫 Describing what international schools "typically" do
   🚫 Making assumptions about school policies
   🚫 Inventing contact info, dates, or procedures
   🚫 Saying "I think", "probably", "maybe", "might"

=== YOUR ONLY JOB ===
Read database → Find exact answer → Repeat it clearly
If not in database → Say you don't have that info

=== EXAMPLES ===

User: "How do I apply?"
Database: [FAQ about application with steps]
CORRECT: [State the steps from the FAQ]
WRONG: "Typically international schools require..." (NO!)

User: "Where is Westmead?"
Database: [No location info]
CORRECT: "I don't have that information available right now."
WRONG: "Westmead is a suburb in Sydney..." (EXTERNAL KNOWLEDGE - FORBIDDEN!)

User: "What programs do you offer?"
Database: [FAQ listing programs]
CORRECT: [List programs from FAQ]
WRONG: Adding programs not in database

REMEMBER: You are a DATABASE READER, not a general AI. Read and repeat ONLY what's in the database.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

import { storage } from "./storage";

// ============================================
// HELPER: Build strict database context
// ============================================
function buildDatabaseContext(
  question: string,
  faqs: any[],
  professors: any[],
  facilities: any[],
  events: any[]
): { context: string; foundRelevant: boolean } {
  const lowerQ = question.toLowerCase();
  
  // Keywords for different topics - more comprehensive
  const topicKeywords = {
    professor: ['professor', 'faculty', 'staff', 'teacher', 'instructor', 'head', 'dean', 'director', 'dean\'s', 'who is', 'contact', 'president', 'ceo', 'chairman', 'vice president', 'vp', 'teach', 'teaches', 'teaching'],
    facility: ['facility', 'facilities', 'building', 'buildings', 'library', 'lab', 'labs', 'gym', 'classroom', 'classrooms', 'office', 'campus', 'room', 'rooms', 'where', 'location', 'locations', 'place', 'places'],
    event: ['event', 'events', 'upcoming', 'schedule', 'schedules', 'activity', 'activities', 'competition', 'competitions', 'when', 'happening', 'held', 'organized'],
    admission: ['admission', 'admissions', 'enroll', 'enrollment', 'apply', 'application', 'entry', 'exam', 'requirement', 'requirements', 'registration', 'register', 'how to', 'join', 'joining'],
    scholarship: ['scholarship', 'scholarships', 'tuition', 'financial', 'aid', 'discount', 'grant', 'grants', 'alumni', 'wastfi', 'gawad', 'fee', 'fees', 'cost', 'costs', 'payment', 'payments'],
    programs: ['program', 'programs', 'course', 'courses', 'offer', 'offers', 'provide', 'provides', 'available', 'study', 'studies', 'major', 'majors', 'degree', 'degrees'],
    general: ['what', 'who', 'where', 'when', 'how', 'tell me', 'info', 'information', 'about', 'regarding', 'details', 'detail', 'can', 'could', 'do', 'does', 'have', 'has', 'there']
  };

  let context = ``;
  let foundRelevant = false;

  // Check which topics are relevant
  const includeAllProfessors = topicKeywords.professor.some(k => lowerQ.includes(k));
  const includeAllFacilities = topicKeywords.facility.some(k => lowerQ.includes(k));
  const includeEvents = topicKeywords.event.some(k => lowerQ.includes(k));
  
  // Only treat as "general" if question is VERY vague (tell me about, what is, etc.) AND short
  // Don't include specific questions like "how do I apply" as general
  const isVeryVagueQuestion = (
    (lowerQ.includes('tell me about') || lowerQ.includes('what is westmead') || lowerQ.includes('about westmead')) &&
    lowerQ.split(' ').length <= 5
  );

  console.log(`🔎 Question: "${question}"`);
  console.log(`   Prof: ${includeAllProfessors ? '✅' : '❌'} | Fac: ${includeAllFacilities ? '✅' : '❌'} | Events: ${includeEvents ? '✅' : '❌'} | Vague: ${isVeryVagueQuestion ? '✅' : '❌'}`);
  
  // INCLUDE ALL PROFESSORS (for professor questions OR very vague questions)
  if (professors.length > 0 && (includeAllProfessors || isVeryVagueQuestion)) {
    context += `=== SCHOOL FACULTY AND STAFF (COMPLETE LIST) ===\n`;
    context += `Total staff in database: ${professors.length}\n\n`;
    professors.forEach((prof, i) => {
      context += `[${i + 1}] ${prof.fullName}\n`;
      context += `   Position: ${prof.position}\n`;
      context += `   Department: ${prof.department}\n`;
      if (prof.email) context += `   Email: ${prof.email}\n`;
      if (prof.phone) context += `   Phone: ${prof.phone}\n`;
      if (prof.description) context += `   Bio: ${prof.description}\n`;
      context += '\n';
    });
    foundRelevant = true;
  }

  // INCLUDE ALL FACILITIES (for facility questions OR very vague questions)
  if (facilities.length > 0 && (includeAllFacilities || isVeryVagueQuestion)) {
    context += `=== SCHOOL FACILITIES (COMPLETE LIST) ===\n`;
    context += `Total facilities in database: ${facilities.length}\n\n`;
    facilities.forEach((fac, i) => {
      context += `[${i + 1}] ${fac.name}\n`;
      context += `   Type: ${fac.type}\n`;
      context += `   Location: ${fac.location}\n`;
      if (fac.capacity) context += `   Capacity: ${fac.capacity}\n`;
      if (fac.status) context += `   Status: ${fac.status}\n`;
      if (fac.description) context += `   Description: ${fac.description}\n`;
      context += '\n';
    });
    foundRelevant = true;
  }

  // INCLUDE ALL EVENTS (for event questions OR very vague questions)
  if (events.length > 0 && (includeEvents || isVeryVagueQuestion)) {
    context += `=== UPCOMING EVENTS (COMPLETE LIST) ===\n`;
    context += `Total events in database: ${events.length}\n\n`;
    events.forEach((event, i) => {
      const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      context += `[${i + 1}] ${event.title}\n`;
      context += `   Date: ${eventDate}\n`;
      if (event.location) context += `   Location: ${event.location}\n`;
      if (event.eventType) context += `   Type: ${event.eventType}\n`;
      if (event.department) context += `   Organized by: ${event.department}\n`;
      context += `   Description: ${event.description}\n`;
      context += '\n';
    });
    foundRelevant = true;
  }

  // INCLUDE ALL RELEVANT FAQs - More liberal matching
  const relevantFaqs = faqs.filter(faq => {
    const faqText = (faq.question + ' ' + faq.answer).toLowerCase();
    const questionWords = lowerQ.split(' ').filter(w => w.length > 3);
    
    // Include FAQ if:
    // 1. Any meaningful word (>3 chars) from question appears in FAQ text
    // 2. Topic keywords match for specific categories
    return (
      questionWords.some(word => faqText.includes(word)) ||
      (topicKeywords.admission.some(k => lowerQ.includes(k)) && 
       (faqText.includes('admission') || faqText.includes('enroll') || faqText.includes('apply'))) ||
      (topicKeywords.scholarship.some(k => lowerQ.includes(k)) && 
       (faqText.includes('scholarship') || faqText.includes('tuition') || faqText.includes('financial'))) ||
      (topicKeywords.programs.some(k => lowerQ.includes(k)) && 
       (faqText.includes('program') || faqText.includes('course') || faqText.includes('offer')))
    );
  });

  if (relevantFaqs.length > 0) {
    context += `=== FREQUENTLY ASKED QUESTIONS ===\n`;
    context += `Relevant FAQs found: ${relevantFaqs.length}\n\n`;
    relevantFaqs.forEach((faq, i) => {
      context += `[FAQ ${i + 1}]\n`;
      context += `Q: ${faq.question}\n`;
      context += `A: ${faq.answer}\n\n`;
    });
    foundRelevant = true;
  }

  return { context, foundRelevant };
}

export async function getChatResponse(
  userQuestion: string,
  conversationHistory: ChatMessage[] = [],
  language: 'en' | 'tl' = 'en'
): Promise<{
  answer: string;
  category: string | null;
}> {
  // ============================================
  // GREETING HANDLER - Respond warmly
  // ============================================
  const greetingPatterns = /^(hi|hello|hey|good morning|good afternoon|good evening|welcome|greetings)\s*[.,!?]*$/i;
  if (greetingPatterns.test(userQuestion.trim())) {
    const greetings = {
      en: "Hello! Welcome to Westmead International School. I'm here to help you with information about our programs, faculty, facilities, and events. What would you like to know?",
      tl: "Halo! Maligayang pagdating sa Westmead International School. Nandito ako upang tumulong sa inyo tungkol sa aming mga programa, faculty, facilities, at events. Ano ang gusto ninyong malaman?"
    };
    return {
      answer: greetings[language],
      category: "greeting"
    };
  }

  // ============================================
  // GRATITUDE HANDLER - Respond to thanks
  // ============================================
  const gratitudePatterns = /^(thank you|thankyou|thanks|thank|gracias|maraming salamat|salamat)\s*[.,!?]*$/i;
  if (gratitudePatterns.test(userQuestion.trim())) {
    const gratitudeReplies = {
      en: "You're welcome! Feel free to ask if you have any more questions about Westmead International School.",
      tl: "Maraming salamat! Huwag mag-atubiling magtanong kung mayroon pa kayong mga tanong tungkol sa Westmead International School."
    };
    return {
      answer: gratitudeReplies[language],
      category: "gratitude"
    };
  }

  // ============================================
  // CONTENT FILTERING - Reject off-topic questions
  // ============================================
  if (!isSchoolRelated(userQuestion)) {
    return {
      answer: "I'm specifically designed to assist with questions about Westmead International School. Please ask me about our programs, faculty, facilities, events, admissions, and scholarships. How can I help you?",
      category: null
    };
  }
  
  // Get FULL database - ALL FAQs, professors, facilities, events
  const activeFaqs = await storage.getActiveFaqs();
  const professors = await storage.getAllProfessors();
  const facilities = await storage.getAllFacilities();
  const upcomingEvents = await storage.getUpcomingEvents();

  console.log(`📚 Question: "${userQuestion.substring(0, 50)}..."`);
  console.log(`📊 Database loaded: ${activeFaqs.length} FAQs | ${professors.length} Professors | ${facilities.length} Facilities | ${upcomingEvents.length} Events`);
  
  // *** BUILD STRICT DATABASE CONTEXT ***
  // Only include relevant sections based on question
  const { context: databaseContext, foundRelevant } = buildDatabaseContext(
    userQuestion, 
    activeFaqs, 
    professors, 
    facilities, 
    upcomingEvents
  );
  
  console.log(`🔍 Relevant context found: ${foundRelevant ? '✅ YES' : '❌ NO'}`);
  console.log(`📏 Context length: ${databaseContext.length} characters`);

  // Build the system prompt with strict grounded generation rules
  const fullContext = `${SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DATABASE CONTENT SECTION (YOUR ONLY SOURCE OF TRUTH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${databaseContext.length > 0 ? databaseContext : '⚠️ NO RELEVANT DATABASE ENTRIES FOUND ⚠️'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF DATABASE CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT REMINDERS:
- You have NO other information beyond what's shown above
- If the answer is not in the database section above → respond: "I'm specifically designed to assist with questions about Westmead International School. Please ask me about our programs, faculty, facilities, events, admissions, and scholarships. How can I help you?"
- Do NOT use external knowledge, training data, or assumptions
- Stay friendly and helpful in tone
- Keep responses SHORT and FACTUAL`;

  console.log('═'.repeat(80));
  console.log(`📋 AI REQUEST SUMMARY:`);
  console.log(`   🌡️  Temperature: 0.0 (GROUNDED GENERATION MODE)`);
  console.log(`   🤖 Model: ${ollama.modelName || 'tinyllama'}`);
  console.log(`   ❓ Question: "${userQuestion}"`);
  console.log(`   📦 Context: ${databaseContext.length} chars`);
  console.log(`   📊 Found Relevant: ${foundRelevant ? '✅ YES' : '❌ NO (will say "not found")'}`);
  console.log(`   🔒 Hallucination Prevention: MAXIMUM`);
  console.log('═'.repeat(80));
  
  // DEBUG: Print what database content AI actually sees
  if (foundRelevant && databaseContext.length > 0) {
    console.log('\n🔍 DATABASE CONTEXT BEING SENT TO AI:');
    console.log('─'.repeat(80));
    console.log(databaseContext.substring(0, 1500)); // First 1500 chars
    if (databaseContext.length > 1500) {
      console.log(`\n... (${databaseContext.length - 1500} more characters) ...`);
    }
    console.log('─'.repeat(80));
  }

  const languageInstruction = language === 'tl'
    ? '\nLANGUAGE: Respond in Tagalog (Filipino). Keep school names, acronyms, and proper nouns in English.'
    : '';

  const messages: ChatMessage[] = [
    { role: "system", content: `${fullContext}${languageInstruction}` },
    ...conversationHistory,
    { role: "user", content: userQuestion }
  ];

  // Try Ollama (local, offline, private)
  try {
    const answer = await ollama.chat(
      messages,
      0.0,  // TEMPERATURE 0.0 = Pure retrieval, zero creativity, zero hallucination
      300   // Allow enough tokens for complete database-based answers
    );
    
    // Validate the answer doesn't contain hallucination indicators
    const hallucinationPhrases = [
      'i think', 'probably', 'maybe', 'might be', 'could be', 'likely',
      'according to my knowledge', 'based on my understanding', 'in general',
      'typically', 'usually', 'normally'
    ];
    
    const lowerAnswer = answer.toLowerCase();
    const hasHallucination = hallucinationPhrases.some(phrase => lowerAnswer.includes(phrase));
    
    if (hasHallucination) {
      console.warn('⚠️ Detected hallucination indicators in response, filtering...');
      return {
        answer: "I'm specifically designed to assist with questions about Westmead International School. Please ask me about our programs, faculty, facilities, events, admissions, and scholarships. How can I help you?",
        category: categorizeQuestion(userQuestion)
      };
    }
    
    const category = categorizeQuestion(userQuestion);
    console.log(`✅ Response generated (${answer.length} chars)`);
    return { answer: answer || "I'm specifically designed to assist with questions about Westmead International School. Please ask me about our programs, faculty, facilities, events, admissions, and scholarships. How can I help you?", category };
  } catch (ollamaError) {
    console.error("❌ Ollama error:", ollamaError);
    
    // If Ollama fails, return a helpful error message with setup instructions
    const errorMessage = ollamaError instanceof Error ? ollamaError.message : String(ollamaError);
    
    if (errorMessage.includes('not running')) {
      throw new Error("Ollama server is not running. Start it with: ollama serve");
    } else if (errorMessage.includes('not found')) {
      throw new Error("Llama model not available. Install it with: ollama pull tinyllama");
    } else {
      throw new Error(`AI service error: ${errorMessage}. Please ensure Ollama is running.`);
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

/**
 * Stream chat response - yields tokens as they arrive
 * Used for real-time display in kiosk UI
 */
export async function* getChatResponseStream(
  userQuestion: string,
  conversationHistory: ChatMessage[] = [],
  language: 'en' | 'tl' = 'en'
): AsyncGenerator<string> {
  // ============================================
  // GREETING HANDLER - Stream warm response
  // ============================================
  const greetingPatterns = /^(hi|hello|hey|good morning|good afternoon|good evening|welcome|greetings)\s*[.,!?]*$/i;
  if (greetingPatterns.test(userQuestion.trim())) {
    const greetings = {
      en: "Hello! Welcome to Westmead International School. I'm here to help you with information about our programs, faculty, facilities, and events. What would you like to know?",
      tl: "Halo! Maligayang pagdating sa Westmead International School. Nandito ako upang tumulong sa inyo tungkol sa aming mga programa, faculty, facilities, at events. Ano ang gusto ninyong malaman?"
    };
    yield greetings[language];
    return;
  }

  // ============================================
  // GRATITUDE HANDLER - Stream thanks response
  // ============================================
  const gratitudePatterns = /^(thank you|thankyou|thanks|thank|gracias|maraming salamat|salamat)\s*[.,!?]*$/i;
  if (gratitudePatterns.test(userQuestion.trim())) {
    const gratitudeReplies = {
      en: "You're welcome! Feel free to ask if you have any more questions about Westmead International School.",
      tl: "Maraming salamat! Huwag mag-atubiling magtanong kung mayroon pa kayong mga tanong tungkol sa Westmead International School."
    };
    yield gratitudeReplies[language];
    return;
  }

  // ============================================
  // CONTENT FILTERING - Reject off-topic questions
  // ============================================
  if (!isSchoolRelated(userQuestion)) {
    yield "I'm specifically designed to assist with questions about Westmead International School. Please ask me about our programs, faculty, facilities, events, admissions, and scholarships. How can I help you?";
    return;
  }
  
  // Get FULL database
  const activeFaqs = await storage.getActiveFaqs();
  const professors = await storage.getAllProfessors();
  const facilities = await storage.getAllFacilities();
  const upcomingEvents = await storage.getUpcomingEvents();
  
  // *** BUILD STRICT DATABASE CONTEXT - SAME AS NON-STREAMING ***
  const { context: databaseContext, foundRelevant } = buildDatabaseContext(
    userQuestion, 
    activeFaqs, 
    professors, 
    facilities, 
    upcomingEvents
  );

  console.log(`🎬 Stream - Question: "${userQuestion.substring(0, 50)}..."`);
  console.log(`📊 Database: ${activeFaqs.length} FAQs | ${professors.length} Professors | ${facilities.length} Facilities | ${upcomingEvents.length} Events`);
  console.log(`🔍 Found relevant: ${foundRelevant ? '✅' : '❌'}`);

  const fullContext = `${SYSTEM_PROMPT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DATABASE CONTENT SECTION (YOUR ONLY SOURCE OF TRUTH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${databaseContext.length > 0 ? databaseContext : '⚠️ NO RELEVANT DATABASE ENTRIES FOUND ⚠️'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF DATABASE CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT REMINDERS:
- You have NO other information beyond what's shown above
- If the answer is not in the database section above → respond: "I'm specifically designed to assist with questions about Westmead International School. Please ask me about our programs, faculty, facilities, events, admissions, and scholarships. How can I help you?"
- Do NOT use external knowledge, training data, or assumptions
- Stay friendly and helpful in tone
- Keep responses SHORT and FACTUAL`;

  const languageInstruction = language === 'tl'
    ? '\nLANGUAGE: Respond in Tagalog (Filipino). Keep school names, acronyms, and proper nouns in English.'
    : '';

  const messages: ChatMessage[] = [
    { role: "system", content: `${fullContext}${languageInstruction}` },
    ...conversationHistory,
    { role: "user", content: userQuestion }
  ];

  try {
    // Stream tokens from Ollama - GROUNDED GENERATION MODE
    for await (const token of ollama.chatStream(
      messages,
      0.0,  // TEMPERATURE 0.0 = Pure retrieval, zero creativity, zero hallucination
      300   // Allow enough tokens for complete database-based answers
    )) {
      yield token;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ Ollama streaming error:", errorMsg);
    
    // Provide helpful error messages
    if (errorMsg.includes('not running') || errorMsg.includes('ECONNREFUSED')) {
      yield "\nError: Ollama service is not running. Please start Ollama first.";
    } else if (errorMsg.includes('not found')) {
      yield "\nError: Llama model not found. Please install with: ollama pull tinyllama";
    } else if (errorMsg.includes('timeout') || errorMsg.includes('hang')) {
      yield "\nError: The AI service is taking too long. Please try again.";
    } else {
      yield "\nI apologize, but I encountered an error while processing your question. Please try again.";
    }
  }
}
