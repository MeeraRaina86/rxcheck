// src/app/api/symptom-analyzer/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, orderBy, query } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// This function now returns a more detailed object
async function createRetellWebCall(agentId: string, userId: string): Promise<{ callData: any; error: string | null }> {
  const retellApiKey = process.env.RETELL_API_KEY;

  if (!retellApiKey) {
    return { callData: null, error: 'Retell API Key is not defined in environment variables.' };
  }

  try {
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${retellApiKey}` },
      body: JSON.stringify({ agent_id: agentId, metadata: { user_id: userId } }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Important: We are now returning the specific error from Retell
      return { callData: null, error: `Retell API Error (${response.status}): ${errorText}` };
    }

    const callData = await response.json();
    return { callData: callData, error: null };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { callData: null, error: `Failed to initiate Retell call: ${errorMessage}` };
  }
}

export async function POST(request: NextRequest) {
  // ... (The main POST function logic remains largely the same, but we adjust how we call and handle the result)
  const { userId, symptoms } = await request.json();

  // We can skip the AI and profile logic for now to speed up debugging
  // Just focus on the call
  
  const agentId = process.env.RETELL_AGENT_ID;
  if (!agentId) {
    return NextResponse.json({ error: "Retell Agent ID is not configured." }, { status: 500 });
  }

  const { callData, error } = await createRetellWebCall(agentId, userId);
  
  if (error) {
    // Send the specific backend error to the frontend
    return NextResponse.json({ analysis: null, callData: null, error: error });
  }

  return NextResponse.json({ analysis: "Debugging call... analysis skipped.", callData: callData, error: null });
}