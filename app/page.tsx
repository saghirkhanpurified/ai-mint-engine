"use client";

import { useState } from "react";
import { ConnectButton, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { createThirdwebClient, getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains"; // Changed from sepolia to baseSepolia
import { mintTo } from "thirdweb/extensions/erc721";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID as string,
});

export default function Home() {
  const account = useActiveAccount(); 
  const { mutate: sendTransaction, isPending: isMinting } = useSendTransaction();

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(""); 
  const [error, setError] = useState("");
  const [mintedTxHash, setMintedTxHash] = useState("");

  const handleGenerate = async () => {
    if (!prompt) return alert("Please describe your asset first!");
    setIsGenerating(true);
    setError("");
    setImageUrl(""); 
    setMintedTxHash("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Generation failed.");
      const data = await response.json();
      setImageUrl(data.imageUrl); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMint = async () => {
    if (!account) return alert("Please connect your wallet first!");
    
    // 1. Connect to your new Smart Contract on Base Sepolia
    const contract = getContract({
      client,
      chain: baseSepolia, // Changed from sepolia to baseSepolia
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
    });

    // 2. Prepare the Mint Transaction
    const transaction = mintTo({
      contract,
      to: account.address,
      nft: {
        name: "AI Mint Engine NFT",
        description: prompt,
        image: imageUrl, 
      },
    });

    // 3. Send to MetaMask!
    sendTransaction(transaction, {
      onSuccess: (result) => {
        setMintedTxHash(result.transactionHash);
        alert("Success! Your NFT is being forged on the Base blockchain.");
      },
      onError: (err) => {
        setError(err.message);
      }
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-20 px-4">
      <div className="absolute top-6 right-6">
        <ConnectButton client={client} />
      </div>

      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          AI MINT ENGINE
        </h1>
        <p className="text-gray-500">Generate art. Pin to IPFS. Mint to Base Blockchain.</p>
      </div>

      <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-800">
        {imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <img src={imageUrl} alt="Generated" className="w-full h-auto" />
            <div className="p-4 bg-gray-950 flex flex-col gap-3">
              {!mintedTxHash ? (
                <button 
                  onClick={handleMint}
                  disabled={isMinting}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-black py-4 rounded-xl transition-all"
                >
                  {isMinting ? "CHECK YOUR METAMASK..." : "🚀 MINT AS NFT"}
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-green-400 font-bold mb-2">✅ NFT MINTED!</p>
                  <a 
                    href={`https://sepolia.basescan.org/tx/${mintedTxHash}`} // Updated to Basescan
                    target="_blank" 
                    className="text-xs text-blue-400 underline"
                  >
                    View Transaction on Basescan
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A cyberpunk samurai in neon Tokyo..." 
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 focus:border-purple-500 outline-none"
        />

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || isMinting}
          className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-4 rounded-xl transition-all"
        >
          {isGenerating ? "FORGING ART..." : "GENERATE ARTWORK"}
        </button>
      </div>
    </main>
  );
}