// src/app/analyze/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type UserProfile = {
  age: number;
  weight: number;
  height: number;
  conditions: string;
  allergies: string;
};

export default function AnalyzePage() {
  const router = useRouter();
  // Refs for separate file inputs
  const prescriptionFileInputRef = useRef<HTMLInputElement>(null);
  const labReportFileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // State for manual text input
  const [prescriptionText, setPrescriptionText] = useState('');
  const [labReportText, setLabReportText] = useState('');

  // State for uploaded files
  const [prescriptionFiles, setPrescriptionFiles] = useState<File[]>([]);
  const [labReportFiles, setLabReportFiles] = useState<File[]>([]);

  const [analysisResult, setAnalysisResult] = useState('');
  // Use a more specific loading state
  const [loadingState, setLoadingState] = useState<'prescription' | 'labReport' | 'analysis' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          router.push('/profile');
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fileType: 'prescription' | 'labReport') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);

    if (fileType === 'prescription') {
      setPrescriptionFiles(prev => [...prev, ...newFiles]);
    } else {
      setLabReportFiles(prev => [...prev, ...newFiles]);
    }

    const firstFile = newFiles[0];
    const formData = new FormData();
    formData.append('file', firstFile);

    setLoadingState(fileType); // Set loading state for the specific upload type
    setError('');
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      console.log('File uploaded:', data.url);
      alert(`File "${firstFile.name}" uploaded. OCR is the next step.`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during upload.');
      }
    } finally {
      setLoadingState(null); // Reset loading state
    }
  };
  
  const removeFile = (index: number, fileType: 'prescription' | 'labReport') => {
    if (fileType === 'prescription') {
      setPrescriptionFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setLabReportFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAnalysis = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prescriptionText && !labReportText && prescriptionFiles.length === 0 && labReportFiles.length === 0) {
      alert("Please provide some data to analyze, either by uploading files or entering text manually.");
      return;
    }
    
    // In a real app, you would process the uploaded files here (e.g., run OCR)
    // and combine the text with the manual input before sending to the AI.
    // For now, we'll just use the manual text.
    if (prescriptionFiles.length > 0 || labReportFiles.length > 0) {
       if (!prescriptionText || !labReportText) {
         alert("OCR from files is not yet implemented. Please also fill in the manual text areas for analysis.");
         return;
       }
    }


    setLoadingState('analysis'); // Set loading state for analysis
    setError('');
    setAnalysisResult('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          prescription: prescriptionText,
          labReport: labReportText,
          userId: user!.uid,
        }),
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
      setLoadingState(null); // Reset loading state
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center">Prescription & Lab Report Analysis</h1>
        <p className="text-center text-gray-600 mt-2">Upload documents, enter data manually, or use a combination of both.</p>

        {/* Upload Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prescription Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Prescription(s)</label>
            <input type="file" ref={prescriptionFileInputRef} onChange={(e) => handleFileChange(e, 'prescription')} className="hidden" accept="image/*,application/pdf" multiple />
            <button onClick={() => prescriptionFileInputRef.current?.click()} className="w-full flex justify-center py-3 px-4 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled={!!loadingState}>
              {loadingState === 'prescription' ? 'Processing...' : 'Select Files'}
            </button>
            <div className="mt-2 space-y-2">
              {prescriptionFiles.map((file, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md text-sm">
                  <span>{file.name}</span>
                  <button onClick={() => removeFile(index, 'prescription')} className="text-red-500 hover:text-red-700">&times;</button>
                </div>
              ))}
            </div>
          </div>
          {/* Lab Report Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Lab Report(s)</label>
            <input type="file" ref={labReportFileInputRef} onChange={(e) => handleFileChange(e, 'labReport')} className="hidden" accept="image/*,application/pdf" multiple />
            <button onClick={() => labReportFileInputRef.current?.click()} className="w-full flex justify-center py-3 px-4 border border-dashed border-gray-400 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled={!!loadingState}>
              {loadingState === 'labReport' ? 'Processing...' : 'Select Files'}
            </button>
            <div className="mt-2 space-y-2">
              {labReportFiles.map((file, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md text-sm">
                  <span>{file.name}</span>
                  <button onClick={() => removeFile(index, 'labReport')} className="text-red-500 hover:text-red-700">&times;</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center"><div className="flex-grow border-t border-gray-300"></div><span className="flex-shrink mx-4 text-gray-400">OR</span><div className="flex-grow border-t border-gray-300"></div></div>

        {/* Manual Input Form */}
        <form onSubmit={handleAnalysis} className="space-y-6">
          <div>
            <label htmlFor="prescription" className="block text-sm font-medium text-gray-700">Enter Prescription Manually</label>
            <textarea id="prescription" rows={6} value={prescriptionText} onChange={(e) => setPrescriptionText(e.target.value)} placeholder="e.g.,&#10;- Metformin 500mg..." className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="labReport" className="block text-sm font-medium text-gray-700">Enter Lab Report Manually</label>
            <textarea id="labReport" rows={6} value={labReportText} onChange={(e) => setLabReportText(e.target.value)} placeholder="e.g.,&#10;Blood Sugar (Fasting): 180 mg/dL..." className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <button type="submit" disabled={!!loadingState || !userProfile} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
              {loadingState === 'analysis' ? 'Analyzing...' : 'Analyze Now'}
            </button>
          </div>
        </form>

        {error && <p className="mt-4 text-center text-red-600">{error}</p>}

        {analysisResult && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow">
            <h2 className="text-2xl font-semibold text-gray-800">Analysis Report</h2>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-gray-700">{analysisResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}