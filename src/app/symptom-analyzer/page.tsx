// src/app/symptom-analyzer/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { RetellWebClient } from 'retell-client-js-sdk';

export default function SymptomAnalyzerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [symptomText, setSymptomText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isCalling, setIsCalling] = useState(false);
  const sdk = useRef<RetellWebClient | null>(null);

  useEffect(() => {
    // SDK setup remains the same
    const webClient = new RetellWebClient();
    webClient.on("call_started", () => setIsCalling(true));
    webClient.on("call_ended", () => setIsCalling(false));
    webClient.on("error", (sdkError) => {
        console.error("Retell SDK Error:", sdkError);
        setError(`An error occurred during the call: ${sdkError.message}`);
        setIsCalling(false);
    });
    sdk.current = webClient;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else router.push('/login');
    });
    return () => unsubscribe();
  }, [router]);

  const handleSymptomAnalysis = async (event?: React.FormEvent) => {
    if(event) event.preventDefault();
    if(isLoading || isCalling) return;

    setIsLoading(true);
    setError('');
    setAnalysisResult('');
    
    try {
      const response = await fetch('/api/symptom-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, symptoms: symptomText }),
      });

      const data = await response.json();

      // ** NEW ERROR HANDLING **
      // Check if our backend sent us a specific error message
      if (data.error) {
        throw new Error(`Backend Error: ${data.error}`);
      }
      
      if (data.callData && data.callData.access_token) {
        await sdk.current?.startCall({
          call_id: data.callData.call_id,
          access_token: data.callData.access_token,
        });
      } else {
        // This case handles if the call was not supposed to happen (e.g. no consent)
        setAnalysisResult("AI analysis complete. A call was not required.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... rest of the component is the same (handleKeyPress, endCall, return JSX)
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSymptomAnalysis();
    }
  };
  const endCall = () => {
    if (sdk.current && sdk.current.isCalling) {
      sdk.current.stopCall();
    }
  };
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Symptom Analyzer</h1>
        <p className="text-center text-gray-600 mt-2">
          Describe your current symptoms, and our AI will provide a preliminary analysis based on your health profile and history.
        </p>
        {isCalling && (
            <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow text-center">
                <div className="flex items-center justify-center">
                    <div className="animate-pulse flex space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="ml-4 text-blue-700 font-semibold">AI Assistant is on the line...</span>
                </div>
                 <button onClick={endCall} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                    End Call
                </button>
            </div>
        )}
        <form onSubmit={handleSymptomAnalysis} className="mt-8 space-y-6">
          <div>
            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
              Describe Your Symptoms
            </label>
            <textarea
              id="symptoms"
              rows={8}
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="e.g., I have had a persistent dry cough for three days..."
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={isCalling}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading || isCalling}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-center text-red-600 font-bold">{error}</p>}
        {analysisResult && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-800">Symptom Analysis Report</h2>
            <div
              className="prose mt-4 max-w-none"
              dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br />') }}
            />
          </div>
        )}
      </div>
    </div>
  );
}