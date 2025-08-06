'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, orderBy, query, limit, startAfter, DocumentData, endBefore, limitToLast, QuerySnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type UserProfile = {
  age: number; 
  weight: number; 
  height: number; 
  conditions: string; 
  allergies: string; 
  familyHistory?: string;
  dateOfBirth?: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 5; 
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(false);

  const updatePageState = useCallback((documentSnapshots: QuerySnapshot<DocumentData>) => {
    if (!documentSnapshots.empty) {
      const reportsData = documentSnapshots.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as Report[];
      setReports(reportsData);
      setFirstVisible(documentSnapshots.docs[0]);
      setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
      setIsLastPage(documentSnapshots.docs.length < reportsPerPage);
    } else {
      setReports([]);
      setIsLastPage(true);
    }
    setLoading(false);
  }, []);

  const fetchFirstPage = useCallback(async (userId: string) => {
    setLoading(true);
    const reportsQuery = query(collection(db, 'profiles', userId, 'reports'), orderBy('createdAt', 'desc'), limit(reportsPerPage));
    const documentSnapshots = await getDocs(reportsQuery);
    updatePageState(documentSnapshots);
    setIsFirstPage(true);
    setCurrentPage(1);
  }, [updatePageState]);

  const fetchNextPage = useCallback(async (userId: string) => {
    if (!lastVisible) return;
    setLoading(true);
    const reportsQuery = query(collection(db, 'profiles', userId, 'reports'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(reportsPerPage));
    const documentSnapshots = await getDocs(reportsQuery);
    updatePageState(documentSnapshots);
    setIsFirstPage(false);
    setCurrentPage(prev => prev + 1);
  }, [lastVisible, updatePageState]);

  const fetchPrevPage = useCallback(async (userId: string) => {
    if (!firstVisible) return;
    setLoading(true);
    const reportsQuery = query(collection(db, 'profiles', userId, 'reports'), orderBy('createdAt', 'desc'), endBefore(firstVisible), limitToLast(reportsPerPage));
    const documentSnapshots = await getDocs(reportsQuery);
    updatePageState(documentSnapshots);
    setIsFirstPage(currentPage === 2);
    setCurrentPage(prev => prev - 1);
  }, [firstVisible, updatePageState, currentPage]);
  
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profileRef = doc(db, 'profiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
            setUserProfile(profileSnap.data() as UserProfile);
            fetchFirstPage(currentUser.uid);
        } else {
            router.push('/profile');
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router, fetchFirstPage]);

  const filteredReports = useMemo(() => {
    if (!searchTerm) {
      return reports;
    }
    return reports.filter(report => 
      report.prescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.report.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  if (loading || !userProfile) {
    return <div className="text-center p-10">Loading Dashboard...</div>;
  }

  const firstItemNumber = (currentPage - 1) * reportsPerPage + 1;
  const lastItemNumber = firstItemNumber + filteredReports.length - 1;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Health Profile</h2>
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
        {/* ... Analysis History JSX with filter and pagination ... */}
      </div>
    </div>
  );
}