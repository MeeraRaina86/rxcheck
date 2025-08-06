// src/app/api/debug-env/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  const retellApiKey = process.env.RETELL_API_KEY;
  const retellAgentId = process.env.RETELL_AGENT_ID;

  // This will log to your server's terminal, not the browser console.
  console.log("[DEBUG] Is RETELL_API_KEY present on server?", !!retellApiKey);
  console.log("[DEBUG] Is RETELL_AGENT_ID present on server?", !!retellAgentId);

  return NextResponse.json({
    retellApiKeyExists: !!retellApiKey,
    retellAgentIdExists: !!retellAgentId,
  });
}