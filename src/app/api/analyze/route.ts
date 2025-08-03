// src/app/api/analyze/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // Import Firestore db
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // We now expect the userId to be passed in the request
    const { userProfile, prescription, labReport, userId } = await request.json();

    if (!userProfile || !prescription || !labReport || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an AI medical assistant named RxCheck. Analyze the user's prescription and lab report against their health profile.
      Provide a clear, easy-to-understand summary.
      Identify potential conflicts, mismatches, or concerns.
      Classify the overall situation using one of these three emojis at the very beginning of your report: ✅ Safe, ⚠️ Needs Review, or ❌ Critical Conflict.
      Here is the data:
      - User Profile: ${JSON.stringify(userProfile)}
      - Prescription: ${prescription}
      - Lab Report: ${labReport}
      Analyze the data and generate the report.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reportText = response.text();

    // Save the report to Firestore
    const reportsCollectionRef = collection(db, 'profiles', userId, 'reports');
    await addDoc(reportsCollectionRef, {
      prescription,
      labReport,
      report: reportText,
      createdAt: serverTimestamp(), // Adds a server-side timestamp
    });

    return NextResponse.json({ report: reportText });
  } catch (error) {
    console.error('Error in analysis API:', error);
    return NextResponse.json(
      { error: 'Failed to generate or save analysis.' },
      { status: 500 }
    );
  }
}