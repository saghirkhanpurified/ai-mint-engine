import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(req: Request) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    const { prompt } = await req.json();

    const replicate = new Replicate({
      auth: token,
    });

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

    // --- THE UNPACKER FIX ---
    // We explicitly open the Replicate FileObject and extract only the raw string URL
    let finalImageUrl = "";
    const rawResult = Array.isArray(output) ? output[0] : output;

    if (typeof rawResult === 'string') {
        finalImageUrl = rawResult;
    } else if (typeof rawResult === 'object' && rawResult !== null) {
        // Newer versions of Replicate use a .url() function for FileObjects
        if (typeof rawResult.url === 'function') {
            finalImageUrl = rawResult.url().toString();
        } else if (rawResult.url) {
            finalImageUrl = rawResult.url;
        } else {
            finalImageUrl = String(rawResult);
        }
    }

    return NextResponse.json({ imageUrl: finalImageUrl });

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "The Forge overloaded. Try again." },
      { status: 500 }
    );
  }
}