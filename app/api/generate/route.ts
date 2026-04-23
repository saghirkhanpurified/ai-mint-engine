import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(req: Request) {
  try {
    // --- DIAGNOSTIC LOGS ---
    console.log("--- INITIATING FORGE ---");
    const token = process.env.REPLICATE_API_TOKEN;
    
    // This will print whether the token is missing, or if it exists, the first 4 letters of it.
    if (!token) {
      console.log("CRITICAL ERROR: SERVER SEES NO TOKEN! IT IS UNDEFINED.");
    } else {
      console.log(`SUCCESS: Server found a token starting with: ${token.substring(0, 4)}...`);
    }

    const { prompt } = await req.json();

    const replicate = new Replicate({
      auth: token,
    });

    const output = await replicate.run(
      "nerijs/pixel-art-xl:latest",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 25,
          guidance_scale: 7.5,
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "The Forge overloaded. Try again." },
      { status: 500 }
    );
  }
}