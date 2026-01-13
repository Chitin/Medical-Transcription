import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Step 1: Get the transcript from the request
    const { transcript } = await request.json();
    
    // Step 2: Create Gemini client
    const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });  // ← HERE!
    
    // Step 3: Create the prompt for Gemini
    const prompt = `You are an expert medical transcriptionist for a cardiology department. Convert this cardiac audio transcript into a structured CT CORONARY ANGIOGRAM report.

CRITICAL RULES:
1. ONLY include information that is EXPLICITLY mentioned in the transcript
2. For sections not mentioned, use clinically appropriate defaults:
   - If coronary findings not mentioned → "Normal"
   - If chambers not mentioned → "Normal in size. No thrombus"
   - If technique not specified → Use standard CT coronary protocol defaults
3. If patient details (name, age, doctor) are not mentioned → Leave blank or use placeholder
4. Use proper medical abbreviations and terminology
5. Maintain the exact format structure below

FORMAT:

DEPARTMENT OF RADIOLOGY & IMAGING
CT SCAN CORONARY ANGIOGRAM

NAME    : [from transcript or leave blank]     AGE/SEX : [from transcript or leave blank]
REF BY  : [from transcript or "DR. ________"]  DATE    : ${new Date().toLocaleDateString('en-GB')}
OP NO   : [from transcript or leave blank]

TECHNIQUE:
[If mentioned in transcript, use exact details. Otherwise use:]
- CT study of coronary arteries performed on multi-slice scanner
- Calcium score performed
- Non-ionic iodine contrast given intravenously

FINDINGS:
Calcium score: [EXACT number from transcript or "Not reported"]

CORONARY ARTERIES: [from transcript or "NORMAL ORIGINS"]
[from transcript or "RIGHT DOMINANT CIRCULATION"]

LMCA : [from transcript or "Normal"]
LAD  : [ONLY if specific findings mentioned, otherwise "Normal"]
D1   : [ONLY if mentioned, otherwise "Normal"]
LCX  : [ONLY if specific findings mentioned, otherwise "Normal"]
OM1  : [ONLY if mentioned, otherwise "Normal"]
OM2  : [ONLY if mentioned, otherwise omit this line entirely]
RCA  : [ONLY if specific findings mentioned, otherwise "Normal"]
PDA  : [ONLY if mentioned, otherwise omit]
PLVB : [ONLY if mentioned, otherwise omit]

AORTA: [If mentioned use exact description, otherwise "Normal caliber. No dissection. No aneurysm."]

VISUALIZED PULMONARY ARTERIES: [from transcript or "Appear normal"]
VISUALIZED PULMONARY VEINS: [from transcript or "Appear normal"]

CHAMBERS:
LA   : [from transcript or "Normal in size. No thrombus"]
LAA  : [ONLY if mentioned, otherwise omit]
LV   : [from transcript or "Normal in size. No thrombus"]
MYOCARDIUM : [from transcript or "Normal"]
VALVES     : [from transcript or "Normal"]
PERICARDIUM: [from transcript or "Normal"]

IMPRESSION:
[Summarize ONLY the key findings mentioned in transcript]
[If abnormalities found, list them clearly]
[If everything normal, write: "Normal coronary arteries. Calcium score: [number]."]

TRANSCRIPT TO ANALYZE:
${transcript}

Remember: Be conservative. Only report what is clearly stated. Use "Normal" as default for unmentioned findings.`;
    
    // Step 4: Send to Gemini and get response
    const result = await model.generateContent(prompt);
    const report = result.response.text();
    
    // Step 5: Return the report
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