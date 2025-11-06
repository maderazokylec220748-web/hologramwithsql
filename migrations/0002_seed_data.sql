-- Seed initial data
USE hologram;

-- Create default admin user
-- Password: admin123 (bcrypt hash)
INSERT INTO admin_users (id, username, password, role, full_name, email) VALUES 
('admin-uuid-12345', 'admin', '$2b$10$ptFUWfS1r4OoynMyJ3gykelE/KsAjkX5YyG1MVjFzqXYDE1.tZa8a', 'admin', 'System Administrator', 'admin@westmead.edu.ph')
ON DUPLICATE KEY UPDATE password=VALUES(password);

-- Sample FAQs
INSERT INTO faqs (id, question, answer, category, priority, is_active) VALUES 
('faq-1', 'What programs does Westmead International School offer?', 'Westmead International School offers comprehensive programs from Pre-K through Grade 12, including IB programs and various extracurricular activities.', 'academic', 10, true),
('faq-2', 'How do I apply for admission?', 'You can apply online through our website or visit our admissions office. Required documents include academic records, recommendation letters, and completed application forms.', 'admissions', 9, true),
('faq-3', 'What scholarship opportunities are available?', 'We offer academic excellence scholarships, need-based financial aid, and special talent scholarships for arts and sports.', 'scholarships', 8, true),
('faq-4', 'What are the campus facilities like?', 'Our campus features modern classrooms, science laboratories, library, sports facilities, art studios, and technology centers.', 'campus', 7, true)
ON DUPLICATE KEY UPDATE 
    question=VALUES(question),
    answer=VALUES(answer),
    category=VALUES(category),
    priority=VALUES(priority),
    is_active=VALUES(is_active);