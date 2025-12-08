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
