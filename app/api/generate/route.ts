import { NextResponse } from "next/server";
import Replicate from "replicate";

// Initialize the Replicate client with your new API token
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // We are calling a specialized Pixel Art LoRA model here.
    // This model physically does not know how to paint; it only knows how to build pixel grids.
    const output = await replicate.run(
      "nerijs/pixel-art-xl:latest", // This is a specific community-trained Pixel Art model
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

    // Replicate returns an array of URLs. We grab the first one.
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