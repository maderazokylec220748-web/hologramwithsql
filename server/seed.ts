import bcrypt from "bcryptjs";
import { storage } from "./storage";

async function seed() {
  try {
    console.log("Seeding database...");

    // Check if admin already exists
    const existingAdmin = await storage.getAdminUserByUsername("admin");
    
    if (!existingAdmin) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      await storage.createAdminUser({
        username: "admin",
        password: hashedPassword,
        fullName: "System Administrator",
        email: "admin@westmead-is.edu.ph",
        role: "admin",
      });

      console.log("✓ Default admin user created");
      console.log("  Username: admin");
      console.log("  Password: admin123");
      console.log("  ⚠️  Please change this password after first login!");
    } else {
      console.log("✓ Admin user already exists");
    }

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

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
