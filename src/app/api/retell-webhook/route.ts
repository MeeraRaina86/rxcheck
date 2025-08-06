// src/app/api/retell-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const callData = await request.json();

    if (callData.event === 'call_ended') {
      const transcript = callData.transcript;
      const callId = callData.call_id;
      const userId = callData.metadata?.user_id; 

      if (!transcript || !callId) {
        console.error('Webhook received without transcript or Call ID.');
        return NextResponse.json({ status: 'error', message: 'Missing transcript or call_id' }, { status: 400 });
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const summaryPrompt = `Summarize the following conversation between an AI medical assistant and a user. Identify the key symptoms discussed and the user's main concerns. Transcript: "${transcript}"`;
      
      const result = await model.generateContent(summaryPrompt);
      const detailed_call_summary = result.response.text();

      if (userId) {
        const logRef = doc(db, 'profiles', userId, 'call_logs', callId);
        await setDoc(logRef, {
          callId: callId,
          transcript: transcript,
          summary: detailed_call_summary,
          callEndTime: new Date(callData.end_timestamp),
          duration: callData.call_duration,
        });
         console.log('Post-call analysis saved for user:', userId, 'and call:', callId);
      } else {
        console.warn('Post-call analysis not saved: No user_id was found in webhook metadata.');
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Error handling Retell webhook:', error);
    // We must first check if 'error' is an instance of 'Error' before accessing '.message'
    if (error instanceof Error && error.message.includes('503')) {
        return NextResponse.json({ error: 'Gemini model is overloaded, could not generate summary.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}