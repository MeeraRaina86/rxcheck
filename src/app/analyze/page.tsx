// src/app/analyze/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// Define a type for our user profile data
type UserProfile = {
  age: number;
  weight: number;
  height: number;
  conditions: string;
  allergies: string;
};

export default function AnalyzePage() {
  const [user, setUser] = useState<User | null>(null);
  // Use the UserProfile type we just defined
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [prescription, setPrescription] = useState('');
  const [labReport, setLabReport] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect to get the current user and their profile
  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          setError('Please create a health profile before running an analysis.');
        }
      } else {
        window.location.href = '/login';
      }
    });
  }, []);

  const handleAnalysis = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userProfile) {
      setError('Cannot run analysis without a user profile.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysisResult('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userProfile, prescription, labReport }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysisResult(data.report);
    } catch (err) {
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred during analysis.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Prescription & Lab Report Analysis
        </h1>
        <p className="text-center text-gray-600 mt-2">
          Enter your prescription and lab report details below for an AI-powered review.
        </p>

        <form onSubmit={handleAnalysis} className="mt-8 space-y-6">
          <div>
            <label htmlFor="prescription" className="block text-sm font-medium text-gray-700">
              Prescription
            </label>
            <textarea
              id="prescription"
              rows={8}
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              placeholder="e.g.,&#10;- Metformin 500mg (1 tablet, twice a day)&#10;- Atorvastatin 20mg (1 tablet, at night)"
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="labReport" className="block text-sm font-medium text-gray-700">
              Lab Report
            </label>
            <textarea
              id="labReport"
              rows={8}
              value={labReport}
              onChange={(e) => setLabReport(e.target.value)}
              placeholder="e.g.,&#10;Blood Sugar (Fasting): 180 mg/dL&#10;Cholesterol (LDL): 150 mg/dL"
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !userProfile}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Now'}
            </button>
          </div>
        </form>

        {error && <p className="mt-4 text-center text-red-600">{error}</p>}

        {analysisResult && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-800">Analysis Report</h2>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-gray-700">
              {analysisResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}