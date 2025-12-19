import { userApi, topicApi, questionApi, examApi, attemptApi, analyticsApi } from './api';

// Enhanced analytics that combines multiple API sources
export class EnhancedAnalyticsService {
  
  /**
   * Get comprehensive system analytics by combining multiple API sources
   */
  static async getEnhancedSystemAnalytics() {
    try {
      // Try to get analytics from dedicated endpoint first
      try {
        const systemAnalytics = await analyticsApi.getSystemAnalytics();
        console.log('Analytics API response:', systemAnalytics);
        
        // If analytics API doesn't have topic/question counts, supplement them
        if (!systemAnalytics.totalTopics || !systemAnalytics.totalQuestions) {
          console.log('Analytics API missing topic/question counts, supplementing...');
          
          try {
            const topics = await topicApi.getAll({ include_count: true });
            const questions = await questionApi.getAll({ take: 100 });
            
            return {
              ...systemAnalytics,
              totalTopics: systemAnalytics.totalTopics || topics.length,
              totalQuestions: systemAnalytics.totalQuestions || questions.length,
              topPerformingTopics: systemAnalytics.topPerformingTopics || topics.slice(0, 5).map(topic => ({
                topicId: topic.id,
                topicName: topic.name,
                totalQuestions: topic._count?.questions || 0,
                totalAttempts: 0,
                averageAccuracy: 0
              }))
            };
          } catch (supplementError) {
            console.warn('Could not supplement analytics data:', supplementError);
          }
        }
        
        return systemAnalytics;
      } catch (analyticsError) {
        console.warn('Analytics API failed, falling back to aggregated data:', analyticsError);
      }

      // Fallback: Aggregate data from multiple sources
      const [users, topics, exams] = await Promise.all([
        userApi.getAllUsers({ limit: 100 }).catch(() => ({ users: [], pagination: { total: 0 } })),
        topicApi.getAll({ include_count: true }).catch(() => []),
        examApi.getAll({ take: 100 }).catch(() => [])
      ]);

      // Calculate basic metrics
      const totalUsers = users.pagination?.total || users.users?.length || 0;
      const enrolledUsers = users.users?.filter(u => u.is_enrolled)?.length || 0;
      const totalExams = exams.length;
      const totalTopics = topics.length;

      // Get question count
      let totalQuestions = 0;
      try {
        const questions = await questionApi.getAll({ take: 100 });
        totalQuestions = questions.length;
      } catch (error) {
        console.warn('Could not fetch questions:', error);
      }

      return {
        totalUsers,
        activeUsers: enrolledUsers,
        totalExams,
        totalAttempts: 0, // Would need attempts API
        completedAttempts: 0,
        averageSystemScore: 0,
        totalTopics,
        totalQuestions,
        topPerformingTopics: topics.slice(0, 5).map(topic => ({
          topicId: topic.id,
          topicName: topic.name,
          totalQuestions: topic._count?.questions || 0,
          totalAttempts: 0,
          averageAccuracy: 0
        })),
        examUsageStats: exams.slice(0, 10).map(exam => ({
          examId: exam.id,
          examTitle: exam.title,
          totalAttempts: 0,
          uniqueUsers: 0,
          averageScore: 0,
          popularity: 0
        }))
      };
    } catch (error) {
      console.error('Enhanced system analytics failed:', error);
      throw error;
    }
  }

  /**
   * Get enhanced user performance by combining user attempts and analytics
   */
  static async getEnhancedUserPerformance(userId: string) {
    try {
      // Try analytics API first
      try {
        const userAnalytics = await analyticsApi.getUserPerformance(userId);
        return userAnalytics;
      } catch (analyticsError) {
        console.warn('User analytics API failed, falling back to attempts data:', analyticsError);
      }

      // Fallback: Get user attempts and calculate metrics
      const attempts = await attemptApi.getMyAttempts({ take: 50 });
      
      const totalAttempts = attempts.length;
      const completedAttempts = attempts.filter(a => a.status === 'SUBMITTED').length;
      const scores = attempts
        .filter(a => a.status === 'SUBMITTED' && a.score !== null)
        .map(a => a.score || 0);
      
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
      
      // Calculate average time spent
      const timeTaken = attempts
        .filter(a => a.submitted_at && a.started_at)
        .map(a => {
          const start = new Date(a.started_at).getTime();
          const end = new Date(a.submitted_at!).getTime();
          return (end - start) / (1000 * 60); // minutes
        });
      
      const averageTimeSpent = timeTaken.length > 0 ? 
        Math.round(timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length) : 0;

      return {
        userId,
        userName: 'User',
        totalExamsTaken: totalAttempts,
        completedExams: completedAttempts,
        averageScore,
        completionRate,
        averageTimeSpent,
        recentAttempts: attempts.slice(0, 10).map(attempt => ({
          attemptId: attempt.id,
          examId: attempt.exam_id,
          examTitle: attempt.exam?.title || 'Unknown Exam',
          score: attempt.correct_answers || 0,
          totalQuestions: attempt.total_questions || 0,
          scorePercentage: attempt.score || 0,
          timeTaken: Math.round(averageTimeSpent),
          completedAt: attempt.submitted_at,
          status: attempt.status
        })),
        improvementTrend: this.calculateImprovementTrend(attempts),
        topicWisePerformance: []
      };
    } catch (error) {
      console.error('Enhanced user performance failed:', error);
      throw error;
    }
  }

  /**
   * Calculate improvement trend from attempts
   */
  private static calculateImprovementTrend(attempts: any[]) {
    const completedAttempts = attempts
      .filter(a => a.status === 'SUBMITTED' && a.submitted_at)
      .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

    if (completedAttempts.length === 0) return [];

    // Group by month
    const monthlyData: { [key: string]: { scores: number[], count: number } } = {};
    
    completedAttempts.forEach(attempt => {
      const date = new Date(attempt.submitted_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { scores: [], count: 0 };
      }
      
      monthlyData[monthKey].scores.push(attempt.score || 0);
      monthlyData[monthKey].count++;
    });

    return Object.entries(monthlyData).map(([period, data]) => ({
      period,
      averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      attemptsCount: data.count
    }));
  }

  /**
   * Get enhanced topic performance
   */
  static async getEnhancedTopicPerformance() {
    try {
      // Try analytics API first
      try {
        const topTopics = await analyticsApi.getTopPerformingTopics();
        return topTopics;
      } catch (analyticsError) {
        console.warn('Top topics analytics failed, falling back to topics data:', analyticsError);
      }

      // Fallback: Get topics and calculate basic metrics
      const topics = await topicApi.getAll({ include_count: true });
      
      return topics.map(topic => ({
        topicId: topic.id,
        topicName: topic.name,
        totalQuestions: topic._count?.questions || 0,
        totalAttempts: 0,
        averageAccuracy: 0
      }));
    } catch (error) {
      console.error('Enhanced topic performance failed:', error);
      return [];
    }
  }

  /**
   * Get exam statistics
   */
  static async getExamStatistics() {
    try {
      const exams = await examApi.getAll({ take: 100 });
      
      const examStats = await Promise.all(
        exams.slice(0, 10).map(async (exam) => {
          try {
            const attempts = await examApi.getAttempts(exam.id, { take: 100 });
            const completedAttempts = attempts.filter((a: any) => a.status === 'SUBMITTED');
            const uniqueUsers = new Set(attempts.map((a: any) => a.user_id)).size;
            const averageScore = completedAttempts.length > 0 
              ? completedAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completedAttempts.length
              : 0;

            return {
              examId: exam.id,
              examTitle: exam.title,
              totalAttempts: attempts.length,
              completedAttempts: completedAttempts.length,
              uniqueUsers,
              averageScore,
              completionRate: attempts.length > 0 ? (completedAttempts.length / attempts.length) * 100 : 0
            };
          } catch (error) {
            console.warn(`Could not get attempts for exam ${exam.id}:`, error);
            return {
              examId: exam.id,
              examTitle: exam.title,
              totalAttempts: 0,
              completedAttempts: 0,
              uniqueUsers: 0,
              averageScore: 0,
              completionRate: 0
            };
          }
        })
      );

      return examStats;
    } catch (error) {
      console.error('Exam statistics failed:', error);
      return [];
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  static async getDashboardData(userId: string, isAdmin: boolean = false) {
    try {
      const results: any = {
        userPerformance: null,
        systemAnalytics: null,
        topPerformingTopics: [],
        examStatistics: []
      };

      // Always get user performance
      try {
        results.userPerformance = await this.getEnhancedUserPerformance(userId);
      } catch (error) {
        console.error('Failed to get user performance:', error);
      }

      // Get admin data if admin
      if (isAdmin) {
        try {
          results.systemAnalytics = await this.getEnhancedSystemAnalytics();
        } catch (error) {
          console.error('Failed to get system analytics:', error);
        }

        try {
          results.topPerformingTopics = await this.getEnhancedTopicPerformance();
        } catch (error) {
          console.error('Failed to get topic performance:', error);
        }

        try {
          results.examStatistics = await this.getExamStatistics();
        } catch (error) {
          console.error('Failed to get exam statistics:', error);
        }
      }

      return results;
    } catch (error) {
      console.error('Dashboard data failed:', error);
      throw error;
    }
  }
}