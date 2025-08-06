// src/app/api/symptom-analyzer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// This function creates a Retell web call and returns a detailed result object
async function createRetellWebCall(agentId: string, userId: string): Promise<{ callData: any; error: string | null }> {
  const retellApiKey = process.env.RETELL_API_KEY;

  if (!retellApiKey) {
    const errorMsg = "Server Configuration Error: RETELL_API_KEY is missing in Vercel environment variables.";
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

    const responseBody = await response.text();
    if (!response.ok) {
      const errorMsg = `Retell API Error (Status: ${response.status}): ${responseBody}`;
      console.error(`[Vercel Log] ${errorMsg}`);
      return { callData: null, error: errorMsg };
    }

    console.log("[Vercel Log] Successfully created Retell web call.");
    return { callData: JSON.parse(responseBody), error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown exception occurred';
    const errorMsg = `[Vercel Log] Network Error in createRetellWebCall: ${errorMessage}`;
    console.error(errorMsg);
    return { callData: null, error: errorMsg };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Client Error: User ID is required.' }, { status: 400 });
    }

    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    const userProfile = profileSnap.data();

    const agentId = process.env.RETELL_AGENT_ID;
    if (!agentId) {
        return NextResponse.json({ error: "Server Configuration Error: RETELL_AGENT_ID is missing." }, { status: 500 });
    }

    // --- WORKAROUND ---
    // We are now checking for call consent and then immediately trying to place a call, skipping the Google AI analysis.
    if (userProfile.callConsent) {
        console.log("[Vercel Log] User has consent. Bypassing Google AI and attempting to create call.");
        const { callData, error } = await createRetellWebCall(agentId, userId);
        
        if (error) {
            return NextResponse.json({ analysis: "Could not place call.", callData: null, error: error });
        }
        
        return NextResponse.json({ analysis: "Call is being placed...", callData: callData, error: null });
    } else {
        return NextResponse.json({ analysis: "User has not consented to calls.", callData: null, error: null });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    console.error('[Vercel Log] Critical error in POST handler:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}