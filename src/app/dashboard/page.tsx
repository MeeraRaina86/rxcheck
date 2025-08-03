// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, orderBy, query, onSnapshot } from 'firebase/firestore'; // Import onSnapshot
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch Profile
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data() as UserProfile);
        } else {
          router.push('/profile');
          return; // Stop if no profile
        }

        // --- REAL-TIME LISTENER FOR REPORTS ---
        const reportsQuery = query(
          collection(db, 'profiles', currentUser.uid, 'reports'),
          orderBy('createdAt', 'desc')
        );

        // onSnapshot returns an unsubscribe function we can use for cleanup
        const unsubscribeReports = onSnapshot(reportsQuery, (querySnapshot) => {
          const reportsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Report[];
          setReports(reportsData);
          setLoading(false);
        });

        // Cleanup the reports listener when the component unmounts
        return () => unsubscribeReports();

      } else {
        router.push('/login');
      }
    });

    // Cleanup the auth listener when the component unmounts
    return () => unsubscribeAuth();
  }, [router]);

  if (loading) {
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
          <p><strong>Age:</strong> {userProfile?.age} years</p>
          <p><strong>Weight:</strong> {userProfile?.weight} kg</p>
          <p><strong>Height:</strong> {userProfile?.height} cm</p>
          <p className="col-span-2"><strong>Your Conditions:</strong> {userProfile?.conditions}</p>
          <p className="col-span-2"><strong>Your Allergies:</strong> {userProfile?.allergies}</p>
          <p className="col-span-2"><strong>Family History:</strong> {userProfile?.familyHistory || 'Not provided'}</p>
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
                <summary className="font-semibold cursor-pointer">
                  Report from {new Date(report.createdAt.seconds * 1000).toLocaleDateString()}
                </summary>
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
          <p className="text-gray-500">Your past analysis reports will appear here. After your first analysis, the history will show up automatically.</p>
        )}
      </div>
    </div>
  );
}