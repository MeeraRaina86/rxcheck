// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, orderBy, query, limit, startAfter, DocumentData, endBefore, limitToLast, QuerySnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type UserProfile = {
  age: number; weight: number; height: number; conditions: string; allergies: string; familyHistory?: string;
};

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
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Pagination State ---
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(false);

  // Helper function to update state after fetching
  const updatePageState = useCallback((documentSnapshots: QuerySnapshot<DocumentData>) => {
    if (!documentSnapshots.empty) {
      const reportsData = documentSnapshots.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Report[];
      setReports(reportsData);
      setFirstVisible(documentSnapshots.docs[0]);
      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      setIsLastPage(documentSnapshots.docs.length < 5);
    } else {
      setIsLastPage(true);
    }
    setLoading(false);
  }, []);

  // Function to fetch reports for the first page
  const fetchFirstPage = useCallback(async (userId: string) => {
    setLoading(true);
    const reportsQuery = query(
      collection(db, 'profiles', userId, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const documentSnapshots = await getDocs(reportsQuery);
    updatePageState(documentSnapshots);
    setIsFirstPage(true);
  }, [updatePageState]);

  // Function to fetch the next page of reports
  const fetchNextPage = async (userId: string) => {
    if (!lastVisible) return;
    setLoading(true);
    const reportsQuery = query(
      collection(db, 'profiles', userId, 'reports'),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(5)
    );
    const documentSnapshots = await getDocs(reportsQuery);
    updatePageState(documentSnapshots);
    setIsFirstPage(false);
  };

  // Function to fetch the previous page of reports
  const fetchPrevPage = async (userId: string) => {
    if (!firstVisible) return;
    setLoading(true);
    const reportsQuery = query(
      collection(db, 'profiles', userId, 'reports'),
      orderBy('createdAt', 'desc'),
      endBefore(firstVisible),
      limitToLast(5)
    );
    const documentSnapshots = await getDocs(reportsQuery);
    updatePageState(documentSnapshots);
  };
  
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch Profile
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) setUserProfile(profileSnap.data() as UserProfile);
        else router.push('/profile');

        // Fetch initial page of reports
        fetchFirstPage(currentUser.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router, fetchFirstPage]);

  if (loading || !userProfile) {
    return <div className="text-center p-10">Loading Dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Dashboard</h1>
      
      {/* Profile Details Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Health Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-gray-700">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Age:</strong> {userProfile.age} years</p>
          <p><strong>Weight:</strong> {userProfile.weight} kg</p>
          <p><strong>Height:</strong> {userProfile.height} cm</p>
          <p className="col-span-2"><strong>Your Conditions:</strong> {userProfile.conditions}</p>
          <p className="col-span-2"><strong>Your Allergies:</strong> {userProfile.allergies}</p>
          <p className="col-span-2"><strong>Family History:</strong> {userProfile.familyHistory || 'Not provided'}</p>
        </div>
        <button onClick={() => router.push('/profile')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700">
          Edit Profile
        </button>
      </div>

      {/* Analysis History Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Analysis History</h2>
        {reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <details key={report.id} className="p-4 border rounded-lg">
                <summary className="font-semibold cursor-pointer">Report from {new Date(report.createdAt.seconds * 1000).toLocaleDateString()}</summary>
                <div className="mt-4">
                  <h4 className="font-bold">Prescription Given:</h4>
                  <pre className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap font-sans">{report.prescription}</pre>
                  <h4 className="font-bold mt-2">AI Analysis:</h4>
                  <pre className="text-sm bg-gray-50 p-2 rounded whitespace-pre-wrap font-sans">{report.report}</pre>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Your past analysis reports will appear here.</p>
        )}
        {/* Pagination Controls */}
        <div className="flex justify-between mt-6">
          <button onClick={() => fetchPrevPage(user!.uid)} disabled={isFirstPage} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button onClick={() => fetchNextPage(user!.uid)} disabled={isLastPage} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}