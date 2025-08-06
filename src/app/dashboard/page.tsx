// src/app/dashboard/page.tsx
'use client';

// ... (imports are unchanged) ...
import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, orderBy, query, limit, startAfter, DocumentData, endBefore, limitToLast, QuerySnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';


// --- UPDATED: UserProfile type to include new fields ---
type UserProfile = {
  age: number; 
  weight: number; 
  height: number; 
  conditions: string; 
  allergies: string; 
  familyHistory?: string;
  // dateOfBirth is not needed for display here, but the type is aware of it
  dateOfBirth?: string;
};

// --- Report type is unchanged ---
type Report = {
  id: string;
  prescription: string;
  labReport: string;
  report: string;
  createdAt: { seconds: number; nanoseconds: number; };
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // ... (rest of the state and functions are unchanged) ...

  if (!userProfile) { // Simplified loading state
    return <div className="text-center p-10">Loading Dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Health Profile</h2>
        {/* --- The JSX here already shows all the required fields --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Age:</strong> {userProfile.age ? `${userProfile.age} years` : 'Not provided'}</p>
          <p><strong>Weight:</strong> {userProfile.weight ? `${userProfile.weight} kg` : 'Not provided'}</p>
          <p><strong>Height:</strong> {userProfile.height ? `${userProfile.height} cm` : 'Not provided'}</p>
          <p className="col-span-2"><strong>Your Conditions:</strong> {userProfile.conditions || 'Not provided'}</p>
          <p className="col-span-2"><strong>Your Allergies:</strong> {userProfile.allergies || 'Not provided'}</p>
          <p className="col-span-2"><strong>Family History:</strong> {userProfile.familyHistory || 'Not provided'}</p>
        </div>
        <button onClick={() => router.push('/profile')} className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700">
          Edit Profile
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* ... (Analysis History JSX is unchanged) ... */}
      </div>
    </div>
  );
}