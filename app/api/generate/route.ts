import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
      return NextResponse.json({ error: "Your Pinata JWT is missing!" }, { status: 400 });
    }

    // 1. Generate the Image
    const safePrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&nologo=true`;
    const imageRes = await fetch(url);
    if (!imageRes.ok) throw new Error("Failed to generate image.");

    // 2. Upload Image to IPFS
    const blob = await imageRes.blob();
    const formData = new FormData();
    formData.append("file", blob, "nft-artwork.jpg");

    const pinataImageRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${pinataJwt}` },
      body: formData,
    });

    if (!pinataImageRes.ok) throw new Error("Image IPFS upload failed");
    const imageData = await pinataImageRes.json();
    const imageGatewayUrl = `https://gateway.pinata.cloud/ipfs/${imageData.IpfsHash}`;
    const pureIpfsUrl = `ipfs://${imageData.IpfsHash}`; // The format Smart Contracts actually read

    // 3. Create the NFT "Certificate" (JSON Metadata)
    const nftMetadata = {
      name: "AI Mint Engine Asset",
      description: prompt,
      image: pureIpfsUrl, // Links the certificate to your exact image
      attributes: [
        { trait_type: "Creator", value: "AI Engine" },
        { trait_type: "Vibe", value: "Cyberpunk" }
      ]
    };

    // 4. Upload the Certificate to IPFS
    const pinataMetadataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({
        pinataContent: nftMetadata,
        pinataMetadata: { name: "nft-metadata.json" }
      }),
    });

    if (!pinataMetadataRes.ok) throw new Error("Metadata IPFS upload failed");
    const metadataData = await pinataMetadataRes.json();
    const metadataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${metadataData.IpfsHash}`;

    // Return BOTH permanent links to the website
    return NextResponse.json({ 
      imageUrl: imageGatewayUrl,
      metadataUrl: metadataGatewayUrl
    });

  } catch (error: any) {
    return NextResponse.json({ error: `Code Error: ${error.message}` }, { status: 500 });
  }
}