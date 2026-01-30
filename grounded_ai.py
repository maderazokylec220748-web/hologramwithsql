"""
Topic-Bounded Grounded Generation AI
Connects database to AI with NO hallucinations
Only answers from database content, organized by TOPIC
"""

import os
import mysql.connector
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='',
        database='hologram'
    )

# ============================================
# TOPIC-ORIENTED KNOWLEDGE RETRIEVAL
# ============================================

class TopicKnowledgeBase:
    """Organizes database content by TOPICS, not exact Q&A"""
    
    def __init__(self):
        self.knowledge = {}
        self.load_from_database()
    
    def load_from_database(self):
        """Load all database content organized by topics"""
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Topic 1: ENROLLMENT / ADMISSION
            cursor.execute("""
                SELECT question, answer FROM faqs 
                WHERE category IN ('admissions', 'enrollment') 
                AND is_active = TRUE
            """)
            enrollment_faqs = cursor.fetchall()
            
            self.knowledge['enrollment'] = {
                'keywords': ['enroll', 'apply', 'admission', 'register', 'registration', 'entry', 'how to join'],
                'data': [faq['answer'] for faq in enrollment_faqs]
            }
            
            # Topic 2: FACULTY / PROFESSORS
            cursor.execute("SELECT fullName, position, department, email, phone, description FROM professors")
            professors = cursor.fetchall()
            
            faculty_info = []
            for prof in professors:
                info = f"{prof['fullName']} is the {prof['position']} in {prof['department']}."
                if prof['email']:
                    info += f" Contact: {prof['email']}"
                if prof['description']:
                    info += f" {prof['description']}"
                faculty_info.append(info)
            
            self.knowledge['faculty'] = {
                'keywords': ['professor', 'faculty', 'staff', 'teacher', 'instructor', 'dean', 'president', 
                            'ceo', 'chairman', 'vice president', 'who is', 'contact'],
                'data': faculty_info
            }
            
            # Topic 3: FACILITIES / CAMPUS
            cursor.execute("SELECT name, type, location, capacity, description FROM facilities WHERE status = 'active'")
            facilities = cursor.fetchall()
            
            facility_info = []
            for fac in facilities:
                info = f"{fac['name']} is a {fac['type']} located at {fac['location']}."
                if fac['capacity']:
                    info += f" Capacity: {fac['capacity']}."
                if fac['description']:
                    info += f" {fac['description']}"
                facility_info.append(info)
            
            self.knowledge['facilities'] = {
                'keywords': ['facility', 'facilities', 'building', 'library', 'lab', 'gym', 
                            'campus', 'room', 'where', 'location'],
                'data': facility_info
            }
            
            # Topic 4: EVENTS / SCHEDULE
            cursor.execute("""
                SELECT title, description, event_date, location, department, organizer 
                FROM events WHERE is_active = TRUE
            """)
            events = cursor.fetchall()
            
            event_info = []
            for event in events:
                info = f"{event['title']}: {event['description']}"
                if event['event_date']:
                    info += f" Date: {event['event_date']}"
                if event['location']:
                    info += f" Location: {event['location']}"
                if event['organizer']:
                    info += f" Organized by: {event['organizer']}"
                event_info.append(info)
            
            self.knowledge['events'] = {
                'keywords': ['event', 'events', 'schedule', 'activity', 'activities', 
                            'when', 'upcoming', 'calendar'],
                'data': event_info
            }
            
            # Topic 5: SCHOLARSHIPS / FINANCIAL
            cursor.execute("""
                SELECT question, answer FROM faqs 
                WHERE category IN ('scholarships', 'financial') 
                AND is_active = TRUE
            """)
            financial_faqs = cursor.fetchall()
            
            self.knowledge['scholarships'] = {
                'keywords': ['scholarship', 'tuition', 'financial', 'aid', 'discount', 
                            'grant', 'fee', 'cost', 'payment'],
                'data': [faq['answer'] for faq in financial_faqs]
            }
            
            # Topic 6: GENERAL / ABOUT SCHOOL
            cursor.execute("""
                SELECT question, answer FROM faqs 
                WHERE category IN ('general', 'academic') 
                AND is_active = TRUE
            """)
            general_faqs = cursor.fetchall()
            
            self.knowledge['general'] = {
                'keywords': ['what', 'who', 'where', 'about', 'school', 'westmead', 
                            'program', 'course', 'offer'],
                'data': [faq['answer'] for faq in general_faqs]
            }
            
            print(f"✅ Knowledge base loaded: {len(self.knowledge)} topics")
            
        finally:
            cursor.close()
            conn.close()
    
    def retrieve_topic_context(self, question: str) -> str:
        """
        Retrieve relevant context based on TOPIC matching
        NOT exact keyword matching - this prevents hallucination
        """
        question_lower = question.lower()
        context_parts = []
        topics_found = []
        
        # Match question to topics
        for topic, content in self.knowledge.items():
            # Check if ANY keyword from this topic appears in question
            if any(keyword in question_lower for keyword in content['keywords']):
                topics_found.append(topic)
                context_parts.extend(content['data'])
        
        if not context_parts:
            return ""
        
        # Build formatted context
        context = f"=== RELEVANT INFORMATION FROM DATABASE ===\n"
        context += f"Topics found: {', '.join(topics_found)}\n\n"
        
        for i, info in enumerate(context_parts, 1):
            context += f"[{i}] {info}\n\n"
        
        return context


# ============================================
# AI QUERY WITH GROUNDED GENERATION
# ============================================

class GroundedAI:
    """AI that ONLY uses database content - NO external knowledge"""
    
    SYSTEM_PROMPT = """You are operating in GROUNDED GENERATION MODE.

STRICT RULES:
1. You may ONLY use information from the provided database context
2. You must NOT invent, assume, or infer missing details
3. If exact answer not available, use related info from SAME TOPIC
4. Do NOT add specifics that are not in the context
5. Stay within the topic of the question
6. Do NOT use external knowledge
7. Keep responses short, clear, and factual

If information is not in the database, respond with:
"Information not found in the database."

REMEMBER: You are a DATABASE QUERY SYSTEM, not a general knowledge AI."""
    
    def __init__(self, knowledge_base: TopicKnowledgeBase):
        self.kb = knowledge_base
        self.ollama_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.ollama_model = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')
    
    def ask(self, question: str) -> str:
        """
        Ask question with grounded generation
        Returns answer ONLY from database
        """
        print(f"\n🔍 Question: {question}")
        
        # Step 1: Retrieve topic-based context
        context = self.kb.retrieve_topic_context(question)
        
        # Step 2: If no context found, return early (NO AI CALL)
        if not context:
            print("❌ No relevant topics found in database")
            return "This kiosk only provides official Westmead International School information. Please ask about enrollment, faculty, facilities, events, or scholarships."
        
        print(f"✅ Retrieved context from database ({len(context)} chars)")
        
        # Step 3: Call AI with strict grounded prompt
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.ollama_model,
                    "prompt": f"{self.SYSTEM_PROMPT}\n\n{context}\n\nQuestion: {question}\n\nAnswer:",
                    "stream": False,
                    "options": {
                        "temperature": 0.0,  # Absolutely deterministic
                        "top_p": 0.0,        # No probability sampling
                        "top_k": 1,          # Only most likely token
                        "repeat_penalty": 1.1,
                        "seed": 42           # Fixed seed for reproducibility
                    }
                },
                timeout=60
            )
            
            if response.status_code == 200:
                answer = response.json().get('response', '').strip()
                print(f"✅ AI response generated")
                return answer
            else:
                print(f"❌ Ollama error: {response.status_code}")
                return "AI service temporarily unavailable."
                
        except Exception as e:
            print(f"❌ Error calling AI: {e}")
            return "AI service temporarily unavailable."


# ============================================
# MAIN PROGRAM
# ============================================

def main():
    """Run interactive grounded AI assistant"""
    
    print("=" * 60)
    print("🤖 WESTMEAD AI - GROUNDED GENERATION MODE")
    print("=" * 60)
    print("Loading knowledge base from database...")
    
    # Initialize
    kb = TopicKnowledgeBase()
    ai = GroundedAI(kb)
    
    print("\n✅ System ready! Ask questions about:")
    print("   - Enrollment/Admission")
    print("   - Faculty/Professors")
    print("   - Facilities/Campus")
    print("   - Events/Schedule")
    print("   - Scholarships/Financial Aid")
    print("\nType 'quit' to exit\n")
    
    # Interactive loop
    while True:
        try:
            question = input("\n👤 You: ").strip()
            
            if not question:
                continue
            
            if question.lower() in ['quit', 'exit', 'bye']:
                print("\n👋 Goodbye!")
                break
            
            # Get grounded answer
            answer = ai.ask(question)
            print(f"\n🤖 AI: {answer}")
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
