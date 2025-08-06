// src/app/api/symptom-analyzer/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, orderBy, query } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function createRetellWebCall(agentId: string, userId: string): Promise<{ callData: Record<string, unknown> | null; error: string | null }> {
  const retellApiKey = process.env.RETELL_API_KEY;

  if (!retellApiKey) {
    const errorMsg = "Server Error: RETELL_API_KEY is not configured.";
    console.error(errorMsg);
    return { callData: null, error: errorMsg };
  }
  
  try {
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${retellApiKey}`,
      },
      body: JSON.stringify({
        agent_id: agentId,
        metadata: { user_id: userId },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Retell API Error (${response.status}): ${errorText}`;
      console.error(errorMsg);
      return { callData: null, error: errorMsg };
    }

    const callData = await response.json();
    return { callData: callData, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorMsg = `Network Error: Failed to connect to Retell API. ${errorMessage}`;
    console.error(errorMsg);
    return { callData: null, error: errorMsg };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, symptoms } = await request.json();

    // --- NEW SECURITY CHECK ---
    // If no user ID is provided in the request, reject it as unauthorized.
    if (!userId) {
      return NextResponse.json({ error: 'Authentication failed: User ID is missing.' }, { status: 401 });
    }

    if (!symptoms) {
      return NextResponse.json({ error: 'Client Error: Symptoms are required.' }, { status: 400 });
    }

    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    const userProfile = profileSnap.data();

    const reportsQuery = query(collection(db, 'profiles', userId, 'reports'), orderBy('createdAt', 'desc'));
    const reportsSnap = await getDocs(reportsQuery);
    const history = reportsSnap.docs.map((doc) => doc.data());

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an advanced AI medical assistant named RxCheck... [Your Prompt Here] ...
    `;

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    const shouldCallUser = userProfile.callConsent && (analysisText.startsWith('⚠️') || analysisText.startsWith('❌'));

    if (shouldCallUser) {
      const agentId = process.env.RETELL_AGENT_ID;
      if (!agentId) {
        return NextResponse.json({ error: "Server Error: RETELL_AGENT_ID is not configured." }, { status: 500 });
      }
      
      const { callData, error } = await createRetellWebCall(agentId, userId);

      if (error) {
        return NextResponse.json({ analysis: analysisText, callData: null, error: error });
      }
      
      return NextResponse.json({ analysis: analysisText, callData: callData, error: null });

    } else {
      return NextResponse.json({ analysis: analysisText, callData: null, error: null });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error('Error in symptom analysis API:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}