// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// --- NEW: List of country codes ---
const countryCodes = [
  { name: 'India', code: '+91' },
  { name: 'USA', code: '+1' },
  { name: 'UK', code: '+44' },
  { name: 'Australia', code: '+61' },
  // Aap yahan aur bhi desh add kar sakti hain
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  // Form state
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  
  // --- UPDATED: Phone number state separated ---
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
          setAge(data.age || '');
          setWeight(data.weight || '');
          setHeight(data.height || '');
          setConditions(data.conditions || '');
          setAllergies(data.allergies || '');
          setFamilyHistory(data.familyHistory || '');
          setCallConsent(data.callConsent || false);

          // --- UPDATED: Logic to split full phone number ---
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

    // --- UPDATED: Combine country code and local number ---
    const fullPhoneNumber = callConsent ? `${countryCode}${localPhoneNumber}` : '';

    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        age: Number(age),
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
    return (
      <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">Your Health Profile</h1>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* ... Personal Details and other fields ... */}
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Personal Details</legend>
             <div className="mt-4">
              <label htmlFor="conditions" className="block text-sm font-medium">Your Pre-existing Conditions</label>
              <input type="text" id="conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="e.g., Diabetes, Hypertension" className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
            <div className="mt-4">
              <label htmlFor="allergies" className="block text-sm font-medium">Your Allergies</label>
              <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g., Penicillin, Peanuts" className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
          </fieldset>
          
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Communication Preferences</legend>
            <div className="mt-2 space-y-4">
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input
                            id="callConsent"
                            name="callConsent"
                            type="checkbox"
                            checked={callConsent}
                            onChange={(e) => setCallConsent(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="callConsent" className="font-medium text-gray-900">
                            Receive a call for analysis
                        </label>
                        <p className="text-gray-500">I consent to receive an automated call from RxCheck to discuss my symptom analysis if it is deemed important.</p>
                    </div>
                </div>
                 
                {/* --- UPDATED: Phone number input with dropdown --- */}
                {callConsent && (
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium">Phone Number</label>
                        <div className="flex mt-1">
                            <select
                                name="countryCode"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-l-md"
                            >
                                {countryCodes.map(country => (
                                    <option key={country.name} value={country.code}>
                                        {country.name} ({country.code})
                                    </option>
                                ))}
                            </select>
                            <input 
                                type="tel" 
                                id="phoneNumber" 
                                value={localPhoneNumber} 
                                onChange={(e) => setLocalPhoneNumber(e.target.value)} 
                                placeholder="Your phone number" 
                                required={callConsent}
                                className="w-full px-3 py-2 border border-l-0 border-gray-300 rounded-r-md" 
                            />
                        </div>
                    </div>
                )}
            </div>
          </fieldset>
          
          {/* ... Family History field ... */}
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Family &amp; Genetic History</legend>
            <div className="mt-2">
              <label htmlFor="familyHistory" className="block text-sm font-medium">Parent&apos;s Conditions / Genetic History</label>
              <textarea id="familyHistory" value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} rows={4} placeholder="e.g., Father - Heart Disease, Mother - Diabetes Type 1" className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
          </fieldset>
          
          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save Profile</button>
          </div>
          {statusMessage && <p className="text-sm text-center text-green-600">{statusMessage}</p>}
        </form>
      </div>
    </div>
  );
}