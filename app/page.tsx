"use client";

import { useState } from "react";
import { ConnectButton, useActiveAccount, useSendBatchTransaction } from "thirdweb/react";
import { createThirdwebClient, getContract, prepareTransaction, toWei } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { mintTo } from "thirdweb/extensions/erc721";

// --- YOUR BUSINESS SETTINGS ---
const MY_WALLET_ADDRESS = "0xc70C4b47C5Be4a510c645A3cdEaD2368F5Df0c6D"; 
const MINT_FEE_USD = "0.00045"; // Approx $1.00 in ETH
// ------------------------------

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID as string,
});

export default function Home() {
  const account = useActiveAccount(); 
  const { mutate: sendBatch, isPending: isMinting } = useSendBatchTransaction();

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(""); 
  const [error, setError] = useState("");
  const [mintedTxHash, setMintedTxHash] = useState("");

  const handleGenerate = async () => {
    if (!prompt) return alert("Please describe your asset first!");
    setIsGenerating(true);
    setError(""); setImageUrl(""); setMintedTxHash("");

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
    
    const contract = getContract({
      client,
      chain: baseSepolia,
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
    });

    // 1. Prepare the $1.00 Payment to YOU
    const paymentTx = prepareTransaction({
      to: MY_WALLET_ADDRESS,
      chain: baseSepolia,
      client: client,
      value: toWei(MINT_FEE_USD),
    });

    // 2. Prepare the NFT Mint
    const mintTx = mintTo({
      contract,
      to: account.address,
      nft: {
        name: "AI Mint Engine NFT",
        description: prompt,
        image: imageUrl, 
      },
    });

    // 3. Send BOTH at once (The Earning Step)
    sendBatch([paymentTx, mintTx], {
      onSuccess: (result) => {
        setMintedTxHash(result.transactionHash);
        alert(`Success! You earned $1.00 and the user got their NFT on Base!`);
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
        <p className="text-gray-500 font-bold">The future of digital ownership starts here.</p>
      </div>

      <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-800">
        {imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <img src={imageUrl} alt="Generated" className="w-full h-auto" />
            <div className="p-4 bg-gray-950">
              {!mintedTxHash ? (
                <button 
                  onClick={handleMint}
                  disabled={isMinting}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-black py-4 rounded-xl transition-all"
                >
                  {isMinting ? "CONFIRMING PAYMENT..." : "🚀 MINT & PAY $1.00"}
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-green-400 font-bold mb-2">✅ TRANSACTION SUCCESSFUL!</p>
                  <a 
                    href={`https://sepolia.basescan.org/tx/${mintedTxHash}`}
                    target="_blank" 
                    className="text-xs text-blue-400 underline"
                  >
                    View on Basescan
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 mb-4 text-center text-sm">{error}</p>}

        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to create..." 
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