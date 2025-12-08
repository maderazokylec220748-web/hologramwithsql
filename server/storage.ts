// Reference: MySQL database storage
import { 
  adminUsers, 
  queries, 
  faqs,
  type AdminUser, 
  type InsertAdminUser,
  type Query,
  type InsertQuery,
  type Faq,
  type InsertFaq
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
  deleteAdminUser(id: string): Promise<void>;

  // Queries
  createQuery(query: InsertQuery): Promise<Query>;
  getAllQueries(): Promise<Query[]>;
  getQueryById(id: string): Promise<Query | undefined>;

  // FAQs
  createFaq(faq: InsertFaq): Promise<Faq>;
  getAllFaqs(): Promise<Faq[]>;
  getActiveFaqs(): Promise<Faq[]>;
  getFaqById(id: string): Promise<Faq | undefined>;
  updateFaq(id: string, data: Partial<Faq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<void>;
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
}

export const storage = new DatabaseStorage();
