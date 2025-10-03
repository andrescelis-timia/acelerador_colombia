'use client';

import { useState } from 'react';
import { useUnifiedFetcher, useRetryFetcher, useSafeFetcher } from '@/lib/api/fetcher';
import { useAuth } from '@/lib/context/AuthContext';

/**
 * Example component demonstrating the new unified API client
 * Shows how both Google OAuth and password authentication work seamlessly
 */
export function ApiClientExample() {
  const { authMethod, isAuthenticated, user } = useAuth();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Different fetcher options
  const unifiedFetcher = useUnifiedFetcher();
  const retryFetcher = useRetryFetcher();
  const safeFetcher = useSafeFetcher();

  const testUnifiedFetcher = async () => {
    setLoading(true);
    try {
      // This works with both Google OAuth and password authentication
      const data = await unifiedFetcher('/api/v1/projects');
      setResult(`Unified Fetcher Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(`Unified Fetcher Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRetryFetcher = async () => {
    setLoading(true);
    try {
      // This automatically retries on 401 errors with token refresh
      const data = await retryFetcher('/api/v1/projects', {}, 2);
      setResult(`Retry Fetcher Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(`Retry Fetcher Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSafeFetcher = async () => {
    setLoading(true);
    try {
      // This returns a standardized response format
      const response = await safeFetcher<any[]>('/api/v1/projects');
      if (response.success) {
        setResult(`Safe Fetcher Success: ${JSON.stringify(response.data, null, 2)}`);
      } else {
        setResult(`Safe Fetcher Error: ${response.error} (Status: ${response.status})`);
      }
    } catch (error: any) {
      setResult(`Safe Fetcher Exception: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to test the API client</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">API Client Test</h2>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Current Auth Method:</strong> {authMethod || 'Unknown'}
        </p>
        <p className="text-sm text-blue-800">
          <strong>User:</strong> {user?.email || 'Unknown'}
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={testUnifiedFetcher}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Unified Fetcher
        </button>
        
        <button
          onClick={testRetryFetcher}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Retry Fetcher
        </button>
        
        <button
          onClick={testSafeFetcher}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Safe Fetcher
        </button>
      </div>

      {loading && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
          <p className="text-gray-600">Loading...</p>
        </div>
      )}

      {result && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-medium mb-2">Result:</h3>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
            {result}
          </pre>
        </div>
      )}

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <h3 className="font-medium text-green-800 mb-2">Features Demonstrated:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✅ Unified authentication handling (Google OAuth + Password)</li>
          <li>✅ Automatic JWT token refresh</li>
          <li>✅ Backward compatibility with existing services</li>
          <li>✅ Retry logic on authentication failures</li>
          <li>✅ Standardized error handling</li>
          <li>✅ Header management (X-User, X-Country, Authorization)</li>
        </ul>
      </div>
    </div>
  );
}