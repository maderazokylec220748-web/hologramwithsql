import { db } from './db';
import { chatHistory } from '@shared/schema';
import { lt } from 'drizzle-orm';

export async function cleanupOldChats() {
  try {
    // Delete chats older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .delete(chatHistory)
      .where(lt(chatHistory.createdAt, thirtyDaysAgo));

    console.log(`Cleaned up old chat history. Records deleted: ${result.rowsAffected || 0}`);
    return result.rowsAffected || 0;
  } catch (error) {
    console.error('Error cleaning up old chats:', error);
    throw error;
  }
}

// Schedule cleanup to run daily at 2 AM
export function scheduleCleanup() {
  const runCleanup = () => {
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0);

    // If it's past 2 AM today, schedule for tomorrow
    if (now > next2AM) {
      next2AM.setDate(next2AM.getDate() + 1);
    }

    const timeUntil2AM = next2AM.getTime() - now.getTime();

    setTimeout(async () => {
      await cleanupOldChats();
      // Schedule next cleanup
      setInterval(cleanupOldChats, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntil2AM);

    console.log(`Scheduled chat cleanup for ${next2AM.toLocaleString()}`);
  };

  runCleanup();
}
