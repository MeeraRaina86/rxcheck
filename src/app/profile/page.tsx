// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const countryCodes = [
  { name: 'India', code: '+91' },
  { name: 'USA', code: '+1' },
  { name: 'UK', code: '+44' },
  { name: 'Australia', code: '+61' },
];

// --- NEW: Function to calculate age from DOB ---
const calculateAge = (dateString: string): number | null => {
  if (!dateString) return null;
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  // --- UPDATED: Form state with new fields ---
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [localPhoneNumber, setLocalPhoneNumber] = useState('');
  const [callConsent, setCallConsent] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // --- UPDATED: Populate new fields from database ---
          setDateOfBirth(data.dateOfBirth || '');
          setWeight(data.weight || '');
          setHeight(data.height || '');
          setConditions(data.conditions || '');
          setAllergies(data.allergies || '');
          setFamilyHistory(data.familyHistory || '');
          setCallConsent(data.callConsent || false);

          const fullPhoneNumber = data.phoneNumber || '';
          const foundCode = countryCodes.find(c => fullPhoneNumber.startsWith(c.code));
          if (foundCode) {
            setCountryCode(foundCode.code);
            setLocalPhoneNumber(fullPhoneNumber.substring(foundCode.code.length));
          } else {
            setLocalPhoneNumber(fullPhoneNumber);
          }
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Save profile data
  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatusMessage('You must be logged in to save a profile.');
      return;
    }

    const fullPhoneNumber = callConsent ? `${countryCode}${localPhoneNumber}` : '';
    // --- NEW: Calculate age before saving ---
    const age = calculateAge(dateOfBirth);

    try {
      // --- UPDATED: Save new fields to database ---
      await setDoc(doc(db, 'profiles', user.uid), {
        dateOfBirth: dateOfBirth,
        age: age,
        weight: Number(weight),
        height: Number(height),
        conditions: conditions,
        allergies: allergies,
        familyHistory: familyHistory,
        phoneNumber: fullPhoneNumber,
        callConsent: callConsent,
        lastUpdated: new Date(),
      }, { merge: true });
      setStatusMessage('Profile saved successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (error) {
      console.error('Error saving profile: ', error);
      setStatusMessage('Failed to save profile.');
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">Your Health Profile</h1>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Personal Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* --- NEW: Date of Birth Input --- */}
              <div>
                <label htmlFor="dob" className="block text-sm font-medium">Date of Birth</label>
                <input type="date" id="dob" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
              </div>
              {/* --- NEW: Age Display (Read-only) --- */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium">Age (auto-calculated)</label>
                <input type="text" id="age" value={calculateAge(dateOfBirth) || ''} readOnly className="w-full px-3 py-2 mt-1 border rounded-md bg-gray-100" />
              </div>
              {/* --- NEW: Weight Input --- */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium">Weight (in kg)</label>
                <input type="number" id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g., 70" required className="w-full px-3 py-2 mt-1 border rounded-md" />
              </div>
              {/* --- NEW: Height Input --- */}
              <div>
                <label htmlFor="height" className="block text-sm font-medium">Height (in cm)</label>
                <input type="number" id="height" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g., 175" required className="w-full px-3 py-2 mt-1 border rounded-md" />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="conditions" className="block text-sm font-medium">Your Pre-existing Conditions</label>
              <input type="text" id="conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="e.g., Diabetes, Hypertension" className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
            <div className="mt-4">
              <label htmlFor="allergies" className="block text-sm font-medium">Your Allergies</label>
              <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g., Penicillin, Peanuts" className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
          </fieldset>
          
          {/* ... Communication Preferences and Family History are unchanged ... */}
          
          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save Profile</button>
          </div>
          {statusMessage && <p className="text-sm text-center text-green-600">{statusMessage}</p>}
        </form>
      </div>
    </div>
  );
}