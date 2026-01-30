#!/usr/bin/env node

/**
 * Seed database with sample school data for testing
 */

import { db } from './server/db';
import { faqs, professors, facilities, events } from '@shared/schema';
import { randomUUID } from 'crypto';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with school information...\n');

    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(faqs).catch(() => {}); // Ignore if table doesn't exist
    await db.delete(professors).catch(() => {});
    await db.delete(facilities).catch(() => {});
    await db.delete(events).catch(() => {});

    // Add FAQs
    console.log('Adding FAQs...');
    const faqData = [
      {
        id: randomUUID(),
        question: 'When is enrollment open?',
        answer: 'Enrollment is open from May 1st to August 31st each year. Early bird registration opens in April with a 10% discount.',
        category: 'admissions',
        priority: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        question: 'How many students are enrolled?',
        answer: 'Westmead International School currently has 1,250 students across all levels: Preparatory (120), Elementary (350), Middle School (280), High School (300), and College (200).',
        category: 'admissions',
        priority: 9,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        question: 'What programs do you offer?',
        answer: 'WIS offers a comprehensive international curriculum: Preparatory School (Pre-K to K), Elementary (Grades 1-6), Middle School (Grades 7-8), High School (Grades 9-12) with AP courses, and College programs in Business, Engineering, Education, and Liberal Arts.',
        category: 'academic',
        priority: 9,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        question: 'What is the tuition fee?',
        answer: 'Tuition varies by level: Preparatory: ₱150,000/year, Elementary: ₱200,000/year, Middle School: ₱250,000/year, High School: ₱300,000/year, College: ₱350,000/year. Scholarships available based on academic merit.',
        category: 'scholarships',
        priority: 8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        question: 'Do you offer scholarships?',
        answer: 'Yes! We offer merit-based scholarships (50% off tuition), need-based scholarships (up to 100% coverage), and athletic scholarships. Applications are reviewed from February to April each year.',
        category: 'scholarships',
        priority: 8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        question: 'What is your school located?',
        answer: 'Westmead International School is located in Batangas City, Batangas, Philippines. Our main campus spans 5 hectares with modern facilities. The address is: Kilometer 2, Lipa-Nasugbu Road, Batangas City, Batangas 4200, Philippines.',
        category: 'campus',
        priority: 7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(faqs).values(faqData);
    console.log(`✅ Added ${faqData.length} FAQs\n`);

    // Add Professors
    console.log('Adding faculty members...');
    const professorData = [
      {
        id: randomUUID(),
        fullName: 'Dr. Arlene D. Castor',
        position: 'President & CEO',
        department: 'Mathematics',
        email: 'arlene.castor@westmead.edu.ph',
        phone: '+63-43-740-1000',
        description: 'Dr. Arlene D. Castor is the President and CEO of Westmead International School, leading the institution with over 20 years of experience in education.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        fullName: 'Dr. Marites D. Manlongat',
        position: 'Vice President for Academic Affairs',
        department: 'SEBA/CAS',
        email: 'marites.manlongat@westmead.edu.ph',
        phone: '+63-43-740-1001',
        description: 'Vice President for Academic Affairs overseeing curriculum and academic excellence across all departments.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        fullName: 'Iluminada De Chavez',
        position: 'Chairman of the Board',
        department: 'Board of Trustees',
        email: 'iluminada.dechavez@westmead.edu.ph',
        phone: '+63-43-740-1002',
        description: 'Chairman of the Board providing strategic direction and governance for the institution.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        fullName: 'Mr. John Andrew C. Manalo',
        position: 'Professor',
        department: 'CITCS',
        email: 'john.manalo@westmead.edu.ph',
        phone: '+63-43-740-1003',
        description: 'Professor in the College of Information Technology and Computer Science.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        fullName: 'Mr. Roberto Fernandez',
        position: 'Instructor',
        department: 'Arts & Design',
        email: 'roberto.fernandez@westmead.edu.ph',
        phone: '+63-43-740-1004',
        description: 'Instructor specializing in Arts and Design programs.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        fullName: 'Prof. Ernesto Carlo L. De Chavez',
        position: 'Dean',
        department: 'CTHM',
        email: 'ernesto.dechavez@westmead.edu.ph',
        phone: '+63-43-740-1005',
        description: 'Dean of the College of Tourism and Hospitality Management.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        fullName: 'Prof. Rosana De Chavez',
        position: 'CITCS Dean',
        department: 'CITCS',
        email: 'rosana.dechavez@westmead.edu.ph',
        phone: '+63-43-740-1006',
        description: 'Dean of the College of Information Technology and Computer Science.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(professors).values(professorData);
    console.log(`✅ Added ${professorData.length} faculty members\n`);

    // Add Facilities
    console.log('Adding campus facilities...');
    const facilityData = [
      {
        id: randomUUID(),
        name: 'Science Laboratory',
        type: 'Laboratory',
        location: 'Science Building, 2nd Floor',
        capacity: 30,
        status: 'active',
        description: 'Fully equipped science lab with modern equipment for chemistry, physics, and biology experiments.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Main Library',
        type: 'Library',
        location: 'Main Building, Ground Floor',
        capacity: 200,
        status: 'active',
        description: 'Library with 10,000+ books, computers, and study areas. Open 7am-7pm Monday-Friday.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Sports Complex',
        type: 'Sports Facility',
        location: 'South Campus',
        capacity: 500,
        status: 'active',
        description: 'Olympic-size swimming pool, basketball court, volleyball court, tennis courts, and gymnasium.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Computer Laboratory',
        type: 'Laboratory',
        location: 'IT Building, 3rd Floor',
        capacity: 40,
        status: 'active',
        description: 'Computer lab with 40 high-end workstations for programming and IT courses.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Auditorium',
        type: 'Assembly Hall',
        location: 'Center Building',
        capacity: 800,
        status: 'active',
        description: 'Large auditorium for school events, plays, concerts, and assemblies.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: 'Cafeteria',
        type: 'Dining Facility',
        location: 'Main Building',
        capacity: 400,
        status: 'active',
        description: 'Spacious cafeteria serving healthy meals from local and international cuisines.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(facilities).values(facilityData);
    console.log(`✅ Added ${facilityData.length} facilities\n`);

    // Add Events
    console.log('Adding upcoming events...');
    const now = new Date();
    const eventData = [
      {
        id: randomUUID(),
        title: 'Enrollment Fair 2026',
        description: 'Join us for our annual enrollment fair! Meet our staff, tour the campus, and learn about our programs. Light refreshments will be served.',
        eventDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
        eventEndDate: null,
        location: 'Sports Complex',
        department: 'Admissions',
        organizer: 'Admissions Office',
        eventType: 'event',
        image: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: 'Science Fair 2026',
        description: 'Annual science fair showcasing student projects and research. All students are invited to participate or view projects.',
        eventDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        eventEndDate: null,
        location: 'Science Building',
        department: 'Science Department',
        organizer: 'Science Faculty',
        eventType: 'event',
        image: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: 'Foundation Day Celebration',
        description: 'Celebrate 20 years of Westmead International School! Join us for games, performances, and festivities.',
        eventDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        eventEndDate: null,
        location: 'Main Campus',
        department: 'Administration',
        organizer: 'School Administration',
        eventType: 'celebration',
        image: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        title: 'Basketball Tournament',
        description: 'Inter-school basketball tournament. Teams from various schools will compete for the championship.',
        eventDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        eventEndDate: new Date(now.getTime() + 62 * 24 * 60 * 60 * 1000), // 62 days from now
        location: 'Sports Complex',
        department: 'Athletics',
        organizer: 'Athletic Department',
        eventType: 'competition',
        image: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(events).values(eventData);
    console.log(`✅ Added ${eventData.length} events\n`);

    console.log('✅ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   • FAQs: ${faqData.length}`);
    console.log(`   • Faculty: ${professorData.length}`);
    console.log(`   • Facilities: ${facilityData.length}`);
    console.log(`   • Events: ${eventData.length}`);
    console.log('\n🎯 Llama now has real data to answer questions!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
