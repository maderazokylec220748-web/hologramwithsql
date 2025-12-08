// Analytics tracking for usage statistics
import { db } from './db';
import { sql } from 'drizzle-orm';
import { analyticsEvents, feedback } from '../shared/schema';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsEvent {
  eventType: string;
  eventData?: any;
  timestamp?: Date;
  sessionId?: string;
  userType?: string;
}

export interface AnalyticsStats {
  totalQueries: number;
  avgResponseTime: number;
  popularQuestions: Array<{ question: string; count: number }>;
  categoryBreakdown: Record<string, number>;
  peakHours: Record<number, number>;
  userTypeDistribution: Record<string, number>;
  totalFeedback: { positive: number; negative: number };
  recentEvents: Array<{ eventType: string; eventData: any; createdAt: Date }>;
}

class Analytics {
  // Track an event - now saves to database
  async trackEvent(event: AnalyticsEvent) {
    try {
      await db.insert(analyticsEvents).values({
        id: uuidv4(),
        eventType: event.eventType,
        eventData: event.eventData ? JSON.stringify(event.eventData) : null,
        sessionId: event.sessionId || null,
        userType: event.userType || null,
        createdAt: event.timestamp || new Date(),
      });
      console.log('[Analytics] Event saved:', event.eventType);
    } catch (error) {
      console.error('[Analytics] Failed to save event:', error);
    }
  }

  // Get analytics statistics
  async getStats(startDate?: Date, endDate?: Date): Promise<AnalyticsStats> {
    try {
      // Total queries - db.execute returns [rows, fields], we need rows[0]
      const [totalQueriesRows] = await db.execute(sql`
        SELECT COUNT(*) as count FROM queries
        WHERE ${startDate ? sql`created_at >= ${startDate}` : sql`1=1`}
        AND ${endDate ? sql`created_at <= ${endDate}` : sql`1=1`}
      `);
      const count = (totalQueriesRows[0] as any)?.count;
      const totalQueries = typeof count === 'bigint' ? Number(count) : (count || 0);

      // Average response time
      const [avgResponseRows] = await db.execute(sql`
        SELECT AVG(response_time) as avg_time FROM queries
        WHERE response_time IS NOT NULL
        AND ${startDate ? sql`created_at >= ${startDate}` : sql`1=1`}
        AND ${endDate ? sql`created_at <= ${endDate}` : sql`1=1`}
      `);
      const avgTime = (avgResponseRows[0] as any)?.avg_time;
      const avgResponseTime = typeof avgTime === 'bigint' ? Number(avgTime) : (avgTime || 0);

      // Popular questions
      const [popularQuestionsRows] = await db.execute(sql`
        SELECT question, COUNT(*) as count
        FROM queries
        WHERE ${startDate ? sql`created_at >= ${startDate}` : sql`1=1`}
        AND ${endDate ? sql`created_at <= ${endDate}` : sql`1=1`}
        GROUP BY question
        ORDER BY count DESC
        LIMIT 10
      `);
      const popularQuestions = (popularQuestionsRows as any[]).map((row: any) => ({
        question: row.question,
        count: typeof row.count === 'bigint' ? Number(row.count) : row.count,
      }));

      // Category breakdown
      const [categoryRows] = await db.execute(sql`
        SELECT category, COUNT(*) as count
        FROM queries
        WHERE category IS NOT NULL
        AND ${startDate ? sql`created_at >= ${startDate}` : sql`1=1`}
        AND ${endDate ? sql`created_at <= ${endDate}` : sql`1=1`}
        GROUP BY category
      `);
      const categoryBreakdown: Record<string, number> = {};
      (categoryRows as any[]).forEach((row: any) => {
        categoryBreakdown[row.category] = typeof row.count === 'bigint' ? Number(row.count) : row.count;
      });

      // Peak hours (0-23) - using local timezone
      const [peakHoursRows] = await db.execute(sql`
        SELECT HOUR(CONVERT_TZ(created_at, '+00:00', @@session.time_zone)) as hour, COUNT(*) as count
        FROM queries
        WHERE ${startDate ? sql`created_at >= ${startDate}` : sql`1=1`}
        AND ${endDate ? sql`created_at <= ${endDate}` : sql`1=1`}
        GROUP BY HOUR(CONVERT_TZ(created_at, '+00:00', @@session.time_zone))
      `);
      const peakHours: Record<number, number> = {};
      (peakHoursRows as any[]).forEach((row: any) => {
        peakHours[row.hour] = typeof row.count === 'bigint' ? Number(row.count) : row.count;
      });

      // User type distribution
      const [userTypeRows] = await db.execute(sql`
        SELECT user_type, COUNT(*) as count
        FROM queries
        WHERE ${startDate ? sql`created_at >= ${startDate}` : sql`1=1`}
        AND ${endDate ? sql`created_at <= ${endDate}` : sql`1=1`}
        GROUP BY user_type
      `);
      const userTypeDistribution: Record<string, number> = {};
      (userTypeRows as any[]).forEach((row: any) => {
        userTypeDistribution[row.user_type] = typeof row.count === 'bigint' ? Number(row.count) : row.count;
      });

      // Feedback statistics (with error handling for new table)
      let totalFeedback = { positive: 0, negative: 0 };
      try {
        const [feedbackRows] = await db.execute(sql`
          SELECT rating, COUNT(*) as count
          FROM feedback
          WHERE ${startDate ? sql`created_at >= ${startDate}` : sql`1=1`}
          AND ${endDate ? sql`created_at <= ${endDate}` : sql`1=1`}
          GROUP BY rating
        `);
        (feedbackRows as any[]).forEach((row: any) => {
          // Convert BigInt to number
          const count = typeof row.count === 'bigint' ? Number(row.count) : row.count;
          if (row.rating === 'positive') totalFeedback.positive = count;
          if (row.rating === 'negative') totalFeedback.negative = count;
        });
      } catch (error) {
        console.log('Feedback table not available yet:', error);
      }

      // Recent events (last 50) (with error handling for new table)
      let recentEvents: any[] = [];
      try {
        const recentEventsResult = await db.execute(sql`
          SELECT event_type, event_data, created_at
          FROM analytics_events
          WHERE ${startDate ? sql`created_at >= ${startDate}` : sql`1=1`}
          AND ${endDate ? sql`created_at <= ${endDate}` : sql`1=1`}
          ORDER BY created_at DESC
          LIMIT 50
        `);
        recentEvents = (recentEventsResult as any[]).map((row: any) => ({
          eventType: row.event_type,
          eventData: row.event_data ? JSON.parse(row.event_data) : null,
          createdAt: row.created_at,
        }));
      } catch (error) {
        console.log('Analytics events table not available yet:', error);
      }

      return {
        totalQueries,
        avgResponseTime: Math.round(avgResponseTime),
        popularQuestions,
        categoryBreakdown,
        peakHours,
        userTypeDistribution,
        totalFeedback,
        recentEvents,
      };
    } catch (error) {
      console.error('Error getting analytics stats:', error);
      return {
        totalQueries: 0,
        avgResponseTime: 0,
        popularQuestions: [],
        categoryBreakdown: {},
        peakHours: {},
        userTypeDistribution: {},
        totalFeedback: { positive: 0, negative: 0 },
        recentEvents: [],
      };
    }
  }

  // Track chat query
  trackQuery(question: string, category: string, userType: string, responseTime: number) {
    this.trackEvent({
      eventType: 'chat_query',
      eventData: {
        question,
        category,
        userType,
        responseTime,
      },
    });
  }

  // Track user feedback - saves to both feedback table and events
  async trackFeedback(queryId: string, rating: 'positive' | 'negative', comment?: string) {
    try {
      // Save to feedback table
      await db.insert(feedback).values({
        id: uuidv4(),
        queryId,
        rating,
        comment: comment || null,
        createdAt: new Date(),
      });
      console.log(`[Analytics] Feedback saved: ${rating} for query ${queryId}`);

      // Also track as event
      await this.trackEvent({
        eventType: 'feedback',
        eventData: {
          queryId,
          rating,
          comment,
        },
      });
    } catch (error) {
      console.error('[Analytics] ❌ Failed to save feedback:', error);
      throw error; // Re-throw to notify caller
    }
  }

  // Track user interaction
  trackInteraction(action: string, data?: any) {
    this.trackEvent({
      eventType: 'interaction',
      eventData: {
        action,
        ...data,
      },
    });
  }
}

export const analytics = new Analytics();
