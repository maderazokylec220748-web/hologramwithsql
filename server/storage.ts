// Reference: MySQL database storage
import { 
  adminUsers, 
  queries, 
  faqs,
  feedback,
  professors,
  facilities,
  events,
  type AdminUser, 
  type InsertAdminUser,
  type Query,
  type InsertQuery,
  type Faq,
  type InsertFaq,
  type Feedback,
  type Professor,
  type InsertProfessor,
  type Facility,
  type InsertFacility,
  type Event,
  type InsertEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Admin Users
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser>;
  deleteAdminUser(id: string): Promise<void>;

  // Queries
  createQuery(query: InsertQuery): Promise<Query>;
  getAllQueries(): Promise<Query[]>;
  getQueryById(id: string): Promise<Query | undefined>;
  getFeedbackByQueryId(queryId: string): Promise<Feedback | undefined>;

  // FAQs
  createFaq(faq: InsertFaq): Promise<Faq>;
  getAllFaqs(): Promise<Faq[]>;
  getActiveFaqs(): Promise<Faq[]>;
  getFaqById(id: string): Promise<Faq | undefined>;
  updateFaq(id: string, data: Partial<Faq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<void>;

  // Professors
  createProfessor(professor: InsertProfessor): Promise<Professor>;
  getAllProfessors(): Promise<Professor[]>;
  getProfessorById(id: string): Promise<Professor | undefined>;
  updateProfessor(id: string, data: Partial<Professor>): Promise<Professor>;
  deleteProfessor(id: string): Promise<void>;

  // Facilities
  createFacility(facility: InsertFacility): Promise<Facility>;
  getAllFacilities(): Promise<Facility[]>;
  getFacilityById(id: string): Promise<Facility | undefined>;
  updateFacility(id: string, data: Partial<Facility>): Promise<Facility>;
  deleteFacility(id: string): Promise<void>;

  // Events
  createEvent(event: InsertEvent): Promise<Event>;
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  getActiveEvents(): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  getEventsByType(eventType: string): Promise<Event[]>;
  updateEvent(id: string, data: Partial<Event>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Admin Users
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user || undefined;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user || undefined;
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const id = randomUUID();
    const userWithId = { ...insertUser, id };
    await db.insert(adminUsers).values(userWithId);
    console.log(`[DB] ✅ Admin user saved to database - ID: ${id}, Username: ${insertUser.username}`);
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
  }

  async updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    await db.update(adminUsers).set(data).where(eq(adminUsers.id, id));
    console.log(`[DB] ✅ Admin user updated in database - ID: ${id}`);
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async deleteAdminUser(id: string): Promise<void> {
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    console.log(`[DB] ✅ Admin user deleted from database - ID: ${id}`);
  }

  // Queries
  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const id = randomUUID();
    const queryWithId = { ...insertQuery, id };
    await db.insert(queries).values(queryWithId);
    console.log(`[DB] ✅ Query saved to database - ID: ${id}`);
    const [query] = await db.select().from(queries).where(eq(queries.id, id));
    return query;
  }

  async getAllQueries(): Promise<Query[]> {
    return await db.select().from(queries).orderBy(desc(queries.createdAt));
  }

  async getQueryById(id: string): Promise<Query | undefined> {
    const [query] = await db.select().from(queries).where(eq(queries.id, id));
    return query || undefined;
  }

  async getFeedbackByQueryId(queryId: string): Promise<Feedback | undefined> {
    const [feedbackRecord] = await db.select().from(feedback).where(eq(feedback.queryId, queryId));
    return feedbackRecord || undefined;
  }

  // FAQs
  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const id = randomUUID();
    const faqWithId = { ...insertFaq, id };
    await db.insert(faqs).values(faqWithId);
    console.log(`[DB] ✅ FAQ saved to database - ID: ${id}`);
    const [faq] = await db.select().from(faqs).where(eq(faqs.id, id));
    return faq;
  }

  async getAllFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).orderBy(desc(faqs.priority), desc(faqs.createdAt));
  }

  async getActiveFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).where(eq(faqs.isActive, true)).orderBy(desc(faqs.priority));
  }

  async getFaqById(id: string): Promise<Faq | undefined> {
    const [faq] = await db.select().from(faqs).where(eq(faqs.id, id));
    return faq || undefined;
  }

  async updateFaq(id: string, data: Partial<Faq>): Promise<Faq | undefined> {
    await db
      .update(faqs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(faqs.id, id));
    console.log(`[DB] ✅ FAQ updated in database - ID: ${id}`);
    const [faq] = await db.select().from(faqs).where(eq(faqs.id, id));
    return faq || undefined;
  }

  async deleteFaq(id: string): Promise<void> {
    await db.delete(faqs).where(eq(faqs.id, id));
    console.log(`[DB] ✅ FAQ deleted from database - ID: ${id}`);
  }

  // Professors
  async createProfessor(insertProfessor: InsertProfessor): Promise<Professor> {
    const id = randomUUID();
    const professorWithId = { ...insertProfessor, id };
    await db.insert(professors).values(professorWithId);
    console.log(`[DB] ✅ Professor saved to database - ID: ${id}`);
    const [professor] = await db.select().from(professors).where(eq(professors.id, id));
    return professor;
  }

  async getAllProfessors(): Promise<Professor[]> {
    return await db.select().from(professors).orderBy(desc(professors.createdAt));
  }

  async getProfessorById(id: string): Promise<Professor | undefined> {
    const [professor] = await db.select().from(professors).where(eq(professors.id, id));
    return professor || undefined;
  }

  async updateProfessor(id: string, data: Partial<Professor>): Promise<Professor> {
    await db.update(professors).set({ ...data, updatedAt: new Date() }).where(eq(professors.id, id));
    console.log(`[DB] ✅ Professor updated in database - ID: ${id}`);
    const [professor] = await db.select().from(professors).where(eq(professors.id, id));
    return professor;
  }

  async deleteProfessor(id: string): Promise<void> {
    await db.delete(professors).where(eq(professors.id, id));
    console.log(`[DB] ✅ Professor deleted from database - ID: ${id}`);
  }

  // Facilities
  async createFacility(insertFacility: InsertFacility): Promise<Facility> {
    const id = randomUUID();
    const facilityWithId = { ...insertFacility, id };
    await db.insert(facilities).values(facilityWithId);
    console.log(`[DB] ✅ Facility saved to database - ID: ${id}`);
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility;
  }

  async getAllFacilities(): Promise<Facility[]> {
    return await db.select().from(facilities).orderBy(desc(facilities.createdAt));
  }

  async getFacilityById(id: string): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility || undefined;
  }

  async updateFacility(id: string, data: Partial<Facility>): Promise<Facility> {
    await db.update(facilities).set({ ...data, updatedAt: new Date() }).where(eq(facilities.id, id));
    console.log(`[DB] ✅ Facility updated in database - ID: ${id}`);
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility;
  }

  async deleteFacility(id: string): Promise<void> {
    await db.delete(facilities).where(eq(facilities.id, id));
    console.log(`[DB] ✅ Facility deleted from database - ID: ${id}`);
  }

  // Events
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const eventWithId = { 
      ...insertEvent, 
      id,
      eventDate: new Date(insertEvent.eventDate),
      eventEndDate: insertEvent.eventEndDate ? new Date(insertEvent.eventEndDate) : null,
    };
    await db.insert(events).values(eventWithId);
    console.log(`[DB] ✅ Event saved to database - ID: ${id}`);
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.eventDate));
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return await db.select()
      .from(events)
      .where((e) => e.eventDate > now && e.isActive === true)
      .orderBy((e) => e.eventDate);
  }

  async getActiveEvents(): Promise<Event[]> {
    const now = new Date();
    return await db.select()
      .from(events)
      .where((e) => e.eventDate >= now && e.isActive === true)
      .orderBy((e) => e.eventDate);
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByType(eventType: string): Promise<Event[]> {
    return await db.select()
      .from(events)
      .where((e) => e.eventType === eventType)
      .orderBy((e) => e.eventDate);
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.eventDate) {
      updateData.eventDate = new Date(data.eventDate);
    }
    if (data.eventEndDate) {
      updateData.eventEndDate = new Date(data.eventEndDate);
    }
    await db.update(events).set(updateData).where(eq(events.id, id));
    console.log(`[DB] ✅ Event updated in database - ID: ${id}`);
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
    console.log(`[DB] ✅ Event deleted from database - ID: ${id}`);
  }}

export const storage = new DatabaseStorage();