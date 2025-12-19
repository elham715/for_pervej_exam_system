import { useState, useEffect } from 'react';
import { analyticsApi, userApi, topicApi, examApi } from '../lib/api';
import { EnhancedAnalyticsService } from '../lib/enhancedAnalytics';
import { useAuth } from '../contexts/AuthContext';

export function AnalyticsTestPage() {
  const { userData } = useAuth();
  const [results, setResults] = useState<Record<string, { success: boolean; data?: any; error?: string }>>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      setResults((prev: Record<string, any>) => ({
        ...prev,
        [name]: { success: true, data: result }
      }));
    } catch (error: any) {
      setResults((prev: Record<string, any>) => ({
        ...prev,
        [name]: { success: false, error: error.message }
      }));
    }
  };

  const runAllTests = async () => {
    if (!userData) return;
    
    setLoading(true);
    setResults({});

    // Test user analytics
    await testEndpoint('getUserPerformance', () => 
      analyticsApi.getUserPerformance(userData.id)
    );
    
    await testEndpoint('getUserHistory', () => 
      analyticsApi.getUserHistory(userData.id, { take: 5 })
    );
    
    await testEndpoint('getUserTopicPerformance', () => 
      analyticsApi.getUserTopicPerformance(userData.id)
    );
    
    await testEndpoint('getUserTrend', () => 
      analyticsApi.getUserTrend(userData.id)
    );

    // Test admin analytics if admin
    if (userData.role === 'ADMIN') {
      await testEndpoint('getSystemAnalytics', () => 
        analyticsApi.getSystemAnalytics()
      );
      
      await testEndpoint('getTopPerformingTopics', () => 
        analyticsApi.getTopPerformingTopics()
      );
      
      // Test exam usage stats (this might fail)
      await testEndpoint('getExamUsageStats', () => 
        analyticsApi.getExamUsageStats()
      );
    }

    // Test enhanced analytics
    await testEndpoint('enhancedSystemAnalytics', () => 
      EnhancedAnalyticsService.getEnhancedSystemAnalytics()
    );
    
    await testEndpoint('enhancedUserPerformance', () => 
      EnhancedAnalyticsService.getEnhancedUserPerformance(userData.id)
    );

    // Test basic APIs
    await testEndpoint('getAllUsers', () => 
      userApi.getAllUsers({ limit: 10 })
    );
    
    await testEndpoint('getAllTopics', () => 
      topicApi.getAll({ include_count: true })
    );
    
    await testEndpoint('getAllExams', () => 
      examApi.getAll({ take: 10 })
    );

    setLoading(false);
  };

  useEffect(() => {
    if (userData) {
      runAllTests();
    }
  }, [userData]);

  if (!userData) {
    return <div className="p-6">Please log in to test analytics endpoints.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics Endpoints Test</h1>
        <button
          onClick={runAllTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(results).map(([name, result]: [string, any]) => (
          <div key={name} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{name}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                result.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? 'SUCCESS' : 'FAILED'}
              </span>
            </div>
            
            {result.success ? (
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            ) : (
              <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                Error: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Testing endpoints...</p>
        </div>
      )}
    </div>
  );
}