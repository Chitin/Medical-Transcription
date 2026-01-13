import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Step 1: Get the transcript from the request
    const { transcript } = await request.json();
    
    // Step 2: Calculate date before the prompt
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    // Step 3: Create Gemini client
    const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Step 4: Create the prompt for Gemini
    const prompt = `You are an expert medical transcriptionist specializing in cardiac CT reports. Your job is to extract ALL findings from the audio transcript and format them into a structured report.

CRITICAL INSTRUCTIONS:
1. READ THE ENTIRE TRANSCRIPT CAREFULLY - do not miss any findings
2. Extract EVERY vessel mentioned and its specific findings
3. If a vessel has abnormalities (stenosis, plaque, occlusion), YOU MUST include it
4. Pay special attention to: LAD, LCX, RCA, and all their branches
5. Extract exact percentages when mentioned (e.g., "50% stenosis", "60% stenosis")
6. Note specific details like "calcified plaque", "non-calcified plaque", "occlusion"

CRITICAL VESSEL ASSIGNMENT RULES:
- Vessels are typically described in this order: LMCA to LAD to D1 to LCX to OM1/OM2 to RCA to PDA
- If you see findings like "calcified plaque" or "stenosis" WITHOUT a clear vessel name before it:
  * Look at what vessels have already been described
  * The finding belongs to the NEXT vessel in the sequence
  * Example: "LAD 50% stenosis. LCX normal. Calcified plaque 60% stenosis" means the "calcified plaque" finding belongs to RCA (next vessel after LCX)
- NEVER assign findings to the wrong vessel
- When in doubt, use the sequential order of vessels

FORMAT STRUCTURE:

DEPARTMENT OF RADIOLOGY & IMAGING
CT SCAN CORONARY ANGIOGRAM

NAME    : extract if mentioned, otherwise leave blank
AGE/SEX : extract if mentioned, otherwise leave blank
REF BY  : extract if mentioned, otherwise "DR. ________"
DATE    : ${currentDate}
OP NO   : extract patient ID/number if mentioned, otherwise leave blank

TECHNIQUE:
If specific technique mentioned, use it. Otherwise use default:
- CT study of coronary arteries performed on multi-slice scanner
- Calcium score performed
- Non-ionic iodine contrast given intravenously

FINDINGS:
Calcium score: EXACT number from transcript - CRITICAL, never miss this

CORONARY ARTERIES: extract if mentioned, otherwise "NORMAL ORIGINS"
Extract dominance: "RIGHT DOMINANT CIRCULATION" or "LEFT DOMINANT CIRCULATION" or "CO-DOMINANT"

LMCA : extract findings - if abnormal findings mentioned, include them; if not mentioned or "normal", write "Normal"
LAD  : CRITICAL - extract ALL findings including stenosis %, plaque type, location
D1   : extract if mentioned, otherwise "Normal"
LCX  : CRITICAL - extract ALL findings including stenosis %, plaque type, location
OM1  : extract if mentioned, otherwise "Normal"
OM2  : only include if mentioned
RCA  : CRITICAL - extract ALL findings including stenosis %, plaque type, occlusion, location. Remember: findings after LCX often belong here
PDA  : only include if mentioned
PLVB : only include if mentioned

AORTA: if mentioned use exact description, otherwise "Normal caliber. No dissection. No aneurysm."

VISUALIZED PULMONARY ARTERIES: from transcript or "Appear normal"
VISUALIZED PULMONARY VEINS: from transcript or "Appear normal"

CHAMBERS:
LA   : from transcript or "Normal in size. No thrombus"
LAA  : only if mentioned
LV   : from transcript or "Normal in size. No thrombus"
MYOCARDIUM : from transcript or "Normal"
VALVES     : from transcript or "Normal"
PERICARDIUM: from transcript or "Normal"

IMPRESSION:
Create a numbered list summarizing EVERY finding.
Include: dominance, calcium score, and ALL vessel abnormalities.
If CAD-RADS score mentioned, include it.
Format example:
1. Dominance type circulation
2. Calcium score: number
3. LAD: finding if abnormal
4. LCX: finding if abnormal
5. RCA: finding if abnormal
6. CAD-RADS: score if mentioned

TRANSCRIPT TO ANALYZE:
${transcript}

REMINDER: 
- Do NOT skip any vessel findings
- If findings appear after "LCX: Normal", they likely belong to RCA
- Use the sequential order: LMCA to LAD to LCX to RCA to assign ambiguous findings
- Extract EVERYTHING accurately`;
    
    // Step 5: Send to Gemini and get response
    const result = await model.generateContent(prompt);
    const report = result.response.text();
    
    // Step 6: Return the report
    return new Response(JSON.stringify({ report }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(JSON.stringify({ error: 'Report generation failed' }), {
      status: 500
    });
  }
};