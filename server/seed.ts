import bcrypt from "bcryptjs";
import { storage } from "./storage";

async function seed() {
  try {
    console.log("Seeding database...");

    // ⚠️ SECURITY: Default admin credentials removed
    // Create your first admin user manually using one of these methods:
    // 
    // Method 1: Use the generate-hash script
    //   node scripts/generate-hash.js YourSecurePassword123!
    //   Then run the generated SQL command in MySQL
    //
    // Method 2: Direct SQL (replace with your values)
    //   First generate hash: node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
    //   Then: INSERT INTO admin_users (id, username, password, role, full_name, email) 
    //         VALUES (UUID(), 'yourusername', 'HASH_FROM_ABOVE', 'admin', 'Your Name', 'your@email.com');
    //
    console.log("⚠️  No default admin user - create one manually for security");
    console.log("   Run: node scripts/generate-hash.js YourPassword");

    // Create some sample FAQs
    const existingFaqs = await storage.getAllFaqs();
    
    if (existingFaqs.length === 0) {
      await storage.createFaq({
        question: "How do I apply to Westmead International School?",
        answer: "To apply to Westmead International School, visit our admissions office or go to https://admission.westmead-is.edu.ph/ to complete the online application form. You'll need to submit your academic records, birth certificate, and other required documents. For more information, contact us at our campus in Batangas City.",
        category: "admissions",
        priority: 10,
        isActive: true,
      });

      await storage.createFaq({
        question: "How do I enroll at Westmead?",
        answer: "Enrollment at Westmead International School is simple and straightforward. You can enroll online through our website or visit our admissions office in person. The enrollment process requires submission of academic records, birth certificate, and a completed enrollment form. Our admissions team is ready to guide you through each step of the registration process.",
        category: "admissions",
        priority: 10,
        isActive: true,
      });

      await storage.createFaq({
        question: "What is the enrollment procedure?",
        answer: "The enrollment procedure at Westmead includes: 1) Submit application form online or in person, 2) Present required documents (academic records, birth certificate, medical records), 3) Complete entrance assessment if applicable, 4) Finalize payment arrangements, 5) Get your enrollment confirmation. Our staff can assist you at each stage.",
        category: "admissions",
        priority: 9,
        isActive: true,
      });

      await storage.createFaq({
        question: "What makes Westmead International School unique?",
        answer: "Westmead International School is the ONLY international school in the Philippines recognized by all three major education bodies: DepEd, TESDA, and CHED. Founded in 2004, we offer a comprehensive education from preparatory school to college level, focusing on developing Filipino talents for nation-building.",
        category: "general",
        priority: 9,
        isActive: true,
      });

      await storage.createFaq({
        question: "What programs does Westmead offer?",
        answer: "Westmead International School offers a full range of programs from pre-elementary to college level. We have courses accredited by DepEd for basic education, TESDA for technical-vocational programs, and CHED for college degrees. Visit our website at westmead-is.edu.ph to see our complete course offerings.",
        category: "academic",
        priority: 8,
        isActive: true,
      });

      console.log("✓ Sample FAQs created");
    } else {
      console.log("✓ FAQs already exist");
    }

    // Create some sample professors
    const existingProfessors = await storage.getAllProfessors();
    
    if (existingProfessors.length === 0) {
      const sampleProfessors = [
        {
          fullName: "Dr. Arlene D. Castor",
          position: "President & CEO",
          department: "Mathematics",
          email: "arlene.castor@westmead.edu.ph",
          phone: "+63-43-740-1000",
          description: "President and CEO of Westmead International School, leading the institution with over 20 years of experience in education.",
        },
        {
          fullName: "Dr. Marites D. Manlongat",
          position: "Vice President for Academic Affairs",
          department: "SEBA/CAS",
          email: "marites.manlongat@westmead.edu.ph",
          phone: "+63-43-740-1001",
          description: "Vice President for Academic Affairs overseeing curriculum and academic excellence across all departments.",
        },
        {
          fullName: "Iluminada De Chavez",
          position: "Chairman of the Board",
          department: "Board of Trustees",
          email: "iluminada.dechavez@westmead.edu.ph",
          phone: "+63-43-740-1002",
          description: "Chairman of the Board providing strategic direction and governance for the institution.",
        },
        {
          fullName: "Mr. John Andrew C. Manalo",
          position: "Professor",
          department: "CITCS",
          email: "john.manalo@westmead.edu.ph",
          phone: "+63-43-740-1003",
          description: "Professor in the College of Information Technology and Computer Science.",
        },
        {
          fullName: "Mr. Roberto Fernandez",
          position: "Instructor",
          department: "Arts & Design",
          email: "roberto.fernandez@westmead.edu.ph",
          phone: "+63-43-740-1004",
          description: "Instructor specializing in Arts and Design programs.",
        },
        {
          fullName: "Prof. Ernesto Carlo L. De Chavez",
          position: "Dean",
          department: "CTHM",
          email: "ernesto.dechavez@westmead.edu.ph",
          phone: "+63-43-740-1005",
          description: "Dean of the College of Tourism and Hospitality Management.",
        },
        {
          fullName: "Prof. Rosana De Chavez",
          position: "CITCS Dean",
          department: "CITCS",
          email: "rosana.dechavez@westmead.edu.ph",
          phone: "+63-43-740-1006",
          description: "Dean of the College of Information Technology and Computer Science.",
        },
      ];

      for (const professor of sampleProfessors) {
        await storage.createProfessor(professor);
      }

      console.log("✓ Sample professors created");
    } else {
      console.log("✓ Professors already exist");
    }

    // Create some sample facilities
    const existingFacilities = await storage.getAllFacilities();
    
    if (existingFacilities.length === 0) {
      const sampleFacilities = [
        {
          name: "Main Library",
          type: "Library",
          location: "Building A, Ground Floor",
          capacity: 150,
          status: "active" as const,
          description: "State-of-the-art library with extensive collection of books, digital resources, and study areas. Features quiet zones, group study rooms, and computer stations.",
        },
        {
          name: "Science Laboratory Complex",
          type: "Laboratory",
          location: "Building B, 2nd Floor",
          capacity: 40,
          status: "active" as const,
          description: "Advanced science labs equipped with modern instruments for physics, chemistry, and biology experiments. Includes safety equipment and digital data acquisition systems.",
        },
        {
          name: "Sports Complex",
          type: "Sports Facility",
          location: "Outdoor Area, East Campus",
          capacity: 500,
          status: "active" as const,
          description: "Multi-purpose sports facility with basketball courts, volleyball courts, badminton courts, and athletic track. Well-maintained grounds with professional-grade equipment.",
        },
        {
          name: "Computer Lab 1",
          type: "Technology Lab",
          location: "Building C, 1st Floor",
          capacity: 35,
          status: "active" as const,
          description: "Modern computer laboratory with latest workstations, dual monitors, and high-speed internet. Used for programming, design, and digital literacy courses.",
        },
        {
          name: "Auditorium",
          type: "Event Space",
          location: "Building D",
          capacity: 800,
          status: "active" as const,
          description: "Large auditorium with advanced audio-visual equipment, stage facilities, and comfortable seating. Used for assemblies, performances, and presentations.",
        },
        {
          name: "Art Studio",
          type: "Creative Space",
          location: "Building A, 3rd Floor",
          capacity: 50,
          status: "active" as const,
          description: "Spacious art studio equipped with easels, painting supplies, sculpture tools, and digital art workstations. Features natural lighting and kiln facilities.",
        },
        {
          name: "Cafeteria",
          type: "Dining Facility",
          location: "Building A, Basement",
          capacity: 300,
          status: "active" as const,
          description: "Modern cafeteria serving nutritious meals prepared fresh daily. Offers halal, vegetarian, and dietary-restricted meal options. Comfortable seating and outdoor dining area.",
        },
      ];

      for (const facility of sampleFacilities) {
        await storage.createFacility(facility);
      }

      console.log("✓ Sample facilities created");
    } else {
      console.log("✓ Facilities already exist");
    }

    // Create some sample events
    const existingEvents = await storage.getAllEvents();
    
    if (existingEvents.length === 0) {
      const now = new Date();
      const sampleEvents = [
        {
          title: "Science Fair 2026",
          description: "Annual science fair where students showcase their innovative projects and experiments. Open to all students across all grade levels.",
          eventDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          eventEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours duration
          location: "Auditorium & Building B Grounds",
          department: "Science Department",
          organizer: "STEM Club",
          eventType: "event",
          isActive: true,
        },
        {
          title: "Inter-School Basketball Tournament",
          description: "Compete with students from neighboring schools in this exciting basketball tournament. All levels welcome!",
          eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          eventEndDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 2-day event
          location: "Sports Complex",
          department: "Physical Education",
          organizer: "Sports Association",
          eventType: "event",
          isActive: true,
        },
        {
          title: "Digital Marketing Workshop",
          description: "Learn essential digital marketing skills including social media strategy, SEO, and content creation from industry experts.",
          eventDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          location: "Building C, Computer Lab 1",
          department: "Business Department",
          organizer: "Digital Marketing Club",
          eventType: "announcement",
          isActive: true,
        },
        {
          title: "Annual Awards Night",
          description: "Celebrate student achievements and excellence in academics, sports, arts, and leadership. Join us for an evening of recognition and celebration.",
          eventDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
          location: "Auditorium",
          organizer: "Student Affairs",
          eventType: "event",
          isActive: true,
        },
        {
          title: "Environmental Awareness Seminar",
          description: "Join us for an important discussion on climate change, sustainability, and environmental protection. Featuring guest speakers and interactive activities.",
          eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          location: "Building A, Auditorium",
          department: "Science Department",
          organizer: "Environmental Club",
          eventType: "event",
          isActive: true,
        },
        {
          title: "Student Organization Fair",
          description: "Explore the wide variety of student clubs and organizations. Meet club leaders, learn about activities, and join groups that match your interests!",
          eventDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          location: "Main Campus Grounds",
          organizer: "Student Council",
          eventType: "event",
          isActive: true,
        },
        {
          title: "Creative Writing Competition",
          description: "Showcase your storytelling talent! Submit short stories, poetry, or essays. Winners will be announced at the Awards Night.",
          eventDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
          location: "Building A, Room 305",
          department: "English Department",
          organizer: "Literary Club",
          eventType: "announcement",
          isActive: true,
        },
      ];

      for (const event of sampleEvents) {
        await storage.createEvent(event);
      }

      console.log("✓ Sample events created");
    } else {
      console.log("✓ Events already exist");
    }

    // Create some sample queries for analytics
    const existingQueries = await storage.getAllQueries();
    
    if (existingQueries.length === 0) {
      const sampleQueries = [
        { question: "How do I apply?", answer: "Visit our admissions office...", userType: "visitor", category: "admissions", responseTime: 850 },
        { question: "What programs do you offer?", answer: "We offer programs from...", userType: "parent", category: "academic", responseTime: 920 },
        { question: "What are the tuition fees?", answer: "Our tuition fees vary...", userType: "parent", category: "admissions", responseTime: 780 },
        { question: "Where is the school located?", answer: "We are located in Batangas City...", userType: "visitor", category: "general", responseTime: 650 },
        { question: "Do you offer scholarships?", answer: "Yes, we offer various scholarships...", userType: "student", category: "scholarships", responseTime: 890 },
        { question: "How do I apply?", answer: "Visit our admissions office...", userType: "visitor", category: "admissions", responseTime: 820 },
        { question: "What programs do you offer?", answer: "We offer programs from...", userType: "visitor", category: "academic", responseTime: 900 },
        { question: "What are the school hours?", answer: "Regular classes are from...", userType: "student", category: "general", responseTime: 700 },
      ];

      for (const query of sampleQueries) {
        await storage.createQuery(query);
      }

      console.log("✓ Sample queries created for analytics");
    } else {
      console.log("✓ Queries already exist");
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
