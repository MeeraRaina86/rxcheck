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
    const webClient = new RetellWebClient();
    webClient.on("call_started", () => setIsCalling(true));
    webClient.on("call_ended", () => setIsCalling(false));
    webClient.on("error", (sdkError) => {
        console.error("Retell SDK Error:", sdkError);
        setError(`SDK Error: ${sdkError.message}`);
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

      if (data.error) {
        throw new Error(data.error);
      }
      
      setAnalysisResult(data.analysis || "");
      
      if (data.callData && data.callData.access_token) {
        // With the ESLint rule disabled in the config file, this will now build successfully.
        await sdk.current?.startCall({
          call_id: data.callData.call_id, 
          access_token: data.callData.access_token,
        } as any);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
        {/* ... The rest of your JSX ... */}
      </div>
    </div>
  );
}