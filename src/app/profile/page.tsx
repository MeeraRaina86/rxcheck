// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Check for logged-in user
  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch existing profile data if it exists
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAge(data.age || '');
          setWeight(data.weight || '');
          setHeight(data.height || '');
          setConditions(data.conditions || '');
          setAllergies(data.allergies || '');
        }
      } else {
        // No user is signed in.
        // Optional: redirect to login page
        window.location.href = '/login';
      }
    });
  }, []);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatusMessage('You must be logged in to save a profile.');
      return;
    }

    try {
      // Use the user's UID as the document ID
      await setDoc(doc(db, 'profiles', user.uid), {
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        conditions: conditions,
        allergies: allergies,
        lastUpdated: new Date(),
      });
      setStatusMessage('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile: ', error);
      setStatusMessage('Failed to save profile.');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center">Your Health Profile</h1>
        <p className="text-sm text-center text-gray-500">
          Logged in as: {user.email}
        </p>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="age" className="block text-sm font-medium">Age</label>
              <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium">Weight (kg)</label>
              <input type="number" id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium">Height (cm)</label>
              <input type="number" id="height" value={height} onChange={(e) => setHeight(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            </div>
          </div>
          <div>
            <label htmlFor="conditions" className="block text-sm font-medium">Pre-existing Conditions</label>
            <input type="text" id="conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="e.g., Diabetes, Hypertension" className="w-full px-3 py-2 mt-1 border rounded-md" />
          </div>
          <div>
            <label htmlFor="allergies" className="block text-sm font-medium">Allergies</label>
            <input type="text" id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g., Penicillin, Peanuts" className="w-full px-3 py-2 mt-1 border rounded-md" />
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save Profile</button>
          </div>
          {statusMessage && <p className="text-sm text-center text-green-600">{statusMessage}</p>}
        </form>
      </div>
    </div>
  );
}