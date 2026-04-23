import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(req: Request) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    const { prompt } = await req.json();

    const replicate = new Replicate({
      auth: token,
    });

    // We are calling Replicate's official, native Retro Diffusion engine.
    // This physically forces the AI to output a 128x128 retro game asset.
    const output = await replicate.run(
      "retro-diffusion/rd-fast",
      {
        input: {
          prompt: `${prompt}, classic cryptopunk avatar portrait, front facing, centered`,
          style: "retro",
          width: 128,
          height: 128,
          num_images: 1,
          remove_bg: false
        }
      }
    );

    // Replicate returns an array of image URLs. We grab the first one.
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