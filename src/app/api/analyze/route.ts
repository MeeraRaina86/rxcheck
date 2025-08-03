// src/app/api/analyze/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Get the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
console.log("Server API Key:", process.env.GEMINI_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userProfile, prescription, labReport } = await request.json();

    if (!userProfile || !prescription || !labReport) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // This is the structured prompt we designed
    const prompt = `
      You are an AI medical assistant named RxCheck. Your task is to analyze a user's prescription and lab report against their health profile.
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
    const text = response.text();

    return NextResponse.json({ report: text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis.' },
      { status: 500 }
    );
  }
}