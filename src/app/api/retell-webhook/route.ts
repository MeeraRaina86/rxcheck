// src/app/api/retell-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Receive webhook data from Retell
    const callData = await request.json();

    // We will only take action on the 'call_ended' event
    if (callData.event === 'call_ended') {
      const transcript = callData.transcript;
      const callId = callData.call_id;
      
      // We can pass the 'user_id' in the metadata when creating the call
      // to know which user's data to save.
      const userId = callData.metadata?.user_id; 

      if (!transcript || !callId) {
        console.error('Webhook received without transcript or Call ID.');
        // Inform Retell that the webhook was received, but the data was incomplete
        return NextResponse.json({ status: 'error', message: 'Missing transcript or call_id' }, { status: 400 });
      }

      // 1. Generate a summary of the call using Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const summaryPrompt = `Summarize the following conversation between an AI medical assistant and a user. Identify the key symptoms discussed and the user's main concerns. Transcript: "${transcript}"`;
      
      const result = await model.generateContent(summaryPrompt);
      const detailed_call_summary = await result.response.text();

      // 2. Save the full analysis object to Firestore
      // This requires a user ID.
      if (userId) {
        const logRef = doc(db, 'profiles', userId, 'call_logs', callId);
        await setDoc(logRef, {
          callId: callId,
          transcript: transcript,
          summary: detailed_call_summary,
          callEndTime: new Date(callData.end_timestamp),
          duration: callData.call_duration,
          //... any other data that Retell sends can be saved here
        });
         console.log('Post-call analysis saved for user:', userId, 'and call:', callId);
      } else {
        console.warn('Post-call analysis not saved: No user_id was found in webhook metadata.');
      }
    }

    // Inform Retell that the webhook was received successfully
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Error handling Retell webhook:', error);
    // This will catch errors if the Google AI is still down
    if (error.message.includes('503')) {
        return NextResponse.json({ error: 'Gemini model is overloaded, could not generate summary.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}