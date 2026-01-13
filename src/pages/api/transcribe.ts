import type { APIRoute } from 'astro';
import { createClient } from '@deepgram/sdk';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file' }), { 
        status: 400 
      });
    }

    const deepgram = createClient(import.meta.env.DEEPGRAM_API_KEY);
    
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-3-medical',
        smart_format: true,
        punctuate: true,
      }
    );
    
    const transcript = result.results.channels[0].alternatives[0].transcript;
    
    return new Response(JSON.stringify({ transcript }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Transcription failed' }), { 
      status: 500 
    });
  }
};