import { db } from './db';
import { chatHistory, queries, analyticsEvents, feedback } from '@shared/schema';
import { lt } from 'drizzle-orm';

export async function cleanupOldData() {
  try {
    // Data retention policy (configurable via environment)
    const QUERY_RETENTION_DAYS = parseInt(process.env.QUERY_RETENTION_DAYS || '7'); // Queries: 7 days
    const CHAT_RETENTION_DAYS = parseInt(process.env.CHAT_RETENTION_DAYS || '7');   // Chat: 7 days
    const ANALYTICS_RETENTION_DAYS = parseInt(process.env.ANALYTICS_RETENTION_DAYS || '30'); // Analytics: 30 days
    const FEEDBACK_RETENTION_DAYS = parseInt(process.env.FEEDBACK_RETENTION_DAYS || '90'); // Feedback: 90 days

    const queryCutoff = new Date();
    queryCutoff.setDate(queryCutoff.getDate() - QUERY_RETENTION_DAYS);
    
    const chatCutoff = new Date();
    chatCutoff.setDate(chatCutoff.getDate() - CHAT_RETENTION_DAYS);
    
    const analyticsCutoff = new Date();
    analyticsCutoff.setDate(analyticsCutoff.getDate() - ANALYTICS_RETENTION_DAYS);
    
    const feedbackCutoff = new Date();
    feedbackCutoff.setDate(feedbackCutoff.getDate() - FEEDBACK_RETENTION_DAYS);

    console.log('🔒 Starting privacy-focused data cleanup...');
    console.log(`   Retention policy: Queries=${QUERY_RETENTION_DAYS}d, Chat=${CHAT_RETENTION_DAYS}d, Analytics=${ANALYTICS_RETENTION_DAYS}d, Feedback=${FEEDBACK_RETENTION_DAYS}d`);

    // Clean up chat history (most sensitive - shortest retention)
    const chatResult = await db
      .delete(chatHistory)
      .where(lt(chatHistory.createdAt, chatCutoff));
    console.log(`  - Chat history: ${chatResult.rowsAffected || 0} records deleted (>${CHAT_RETENTION_DAYS} days)`);

    // Clean up old queries (contains user questions - short retention)
    const queriesResult = await db
      .delete(queries)
      .where(lt(queries.createdAt, queryCutoff));
    console.log(`  - Queries: ${queriesResult.rowsAffected || 0} records deleted (>${QUERY_RETENTION_DAYS} days)`);

    // Clean up old analytics events (aggregated data - longer retention)
    const analyticsResult = await db
      .delete(analyticsEvents)
      .where(lt(analyticsEvents.createdAt, analyticsCutoff));
    console.log(`  - Analytics events: ${analyticsResult.rowsAffected || 0} records deleted (>${ANALYTICS_RETENTION_DAYS} days)`);

    // Clean up old feedback (improvement data - longest retention)
    const feedbackResult = await db
      .delete(feedback)
      .where(lt(feedback.createdAt, feedbackCutoff));
    console.log(`  - Feedback: ${feedbackResult.rowsAffected || 0} records deleted (>${FEEDBACK_RETENTION_DAYS} days)`);

    const totalDeleted = (chatResult.rowsAffected || 0) + 
                        (queriesResult.rowsAffected || 0) + 
                        (analyticsResult.rowsAffected || 0) + 
                        (feedbackResult.rowsAffected || 0);

    console.log(`✅ Privacy cleanup complete. Total records deleted: ${totalDeleted}`);
    return totalDeleted;
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Backward compatibility alias
export const cleanupOldChats = cleanupOldData;

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
      await cleanupOldData();
      // Schedule next cleanup
      setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntil2AM);

    const retentionPolicy = `Queries/Chat=${process.env.QUERY_RETENTION_DAYS || '7'}d, Analytics=${process.env.ANALYTICS_RETENTION_DAYS || '30'}d, Feedback=${process.env.FEEDBACK_RETENTION_DAYS || '90'}d`;
    console.log(`📅 Scheduled daily privacy cleanup for ${next2AM.toLocaleString()}`);
    console.log(`🔒 Data retention policy: ${retentionPolicy}`);
  };

  runCleanup();
}
