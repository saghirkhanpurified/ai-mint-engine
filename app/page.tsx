"use client";

import { useState } from "react";
import { ConnectButton, useActiveAccount, useSendTransaction } from "thirdweb/react";
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
  const { mutate: sendTransaction, isPending: isMinting } = useSendTransaction();

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(""); 
  const [error, setError] = useState("");
  const [mintedTxHash, setMintedTxHash] = useState("");
  const [status, setStatus] = useState("");

  const handleGenerate = async () => {
    if (!prompt) return alert("What should I create for you?");
    setIsGenerating(true);
    setError(""); setImageUrl(""); setMintedTxHash(""); setStatus("");

    // --- PROMPT GUARD: The Fine Art Gallery ---
    const masterpiecePrompt = `${prompt}, abstract geometric algorithm art, minimalist vector style, mathematical perfection, high-end modern art museum piece, masterpiece, 8k resolution, trending on ArtBlocks`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: masterpiecePrompt }), // Sending the enhanced prompt
      });
      if (!response.ok) throw new Error("The Forge is busy. Try again!");
      const data = await response.json();
      setImageUrl(data.imageUrl); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMint = async () => {
    if (!account) return alert("Connect your wallet to claim this art!");
    setError("");
    setStatus("Processing $1.00 Payment...");
    
    const contract = getContract({
      client,
      chain: baseSepolia,
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
    });

    const paymentTx = prepareTransaction({
      to: MY_WALLET_ADDRESS,
      chain: baseSepolia,
      client: client,
      value: toWei(MINT_FEE_USD),
    });

    sendTransaction(paymentTx, {
      onSuccess: () => {
        setStatus("Payment Verified! Minting NFT...");
        
        const mintTx = mintTo({
          contract,
          to: account.address,
          nft: {
            name: "AI Engine Masterpiece",
            description: `A unique creation based on: ${prompt}`,
            image: imageUrl, 
          },
        });

        sendTransaction(mintTx, {
          onSuccess: (result) => {
            setMintedTxHash(result.transactionHash);
            setStatus("");
            alert(`Victory! You've earned $1.00 and created a Masterpiece.`);
          },
          onError: (err) => {
            setError("Payment received, but minting failed. Check your dashboard.");
            console.error(err);
          }
        });
      },
      onError: (err) => {
        setError("Payment cancelled. The forge remains cold.");
        setStatus("");
        console.error(err);
      }
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-20 px-4 font-sans">
      {/* Navigation */}
      <div className="absolute top-6 right-6">
        <ConnectButton client={client} />
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-7xl font-black mb-4 tracking-tighter bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          MINT ENGINE <span className="text-purple-500">PRO</span>
        </h1>
        <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
          High-Fidelity AI • Base Layer 2 • Instant Ownership
        </p>
      </div>

      {/* Main App Container */}
      <div className="bg-[#0a0a0a] p-10 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,1)] w-full max-w-xl border border-gray-800/50">
        
        {/* Image Display Area */}
        <div className="relative mb-10 group">
          {imageUrl ? (
            <div className="rounded-3xl overflow-hidden border-2 border-purple-500/30 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
              <img src={imageUrl} alt="Generated Art" className="w-full h-auto" />
              <div className="p-6 bg-gray-950/80 backdrop-blur-md">
                {!mintedTxHash ? (
                  <button 
                    onClick={handleMint}
                    disabled={isMinting}
                    className="w-full bg-white hover:bg-purple-100 text-black font-black py-5 rounded-2xl transition-all active:scale-95 text-lg"
                  >
                    {isMinting ? status : "CLAIM AS NFT ($1.00)"}
                  </button>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-green-400 font-black text-xl mb-3">✨ COLLECTION UPDATED</p>
                    <a 
                      href={`https://sepolia.basescan.org/tx/${mintedTxHash}`}
                      target="_blank" 
                      className="text-sm text-gray-400 hover:text-white underline transition-colors"
                    >
                      Verify on Basescan
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-800 flex items-center justify-center text-gray-700 italic">
              {isGenerating ? "The AI is painting..." : "Your masterpiece will appear here"}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 mb-6 text-center text-sm font-bold bg-red-950/20 py-3 rounded-xl border border-red-900/50">{error}</p>}

        {/* Input Area */}
        <div className="space-y-4">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your vision..." 
            className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-5 focus:border-purple-500 outline-none transition-all text-lg placeholder:text-gray-700"
          />

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isMinting}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-black py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {isGenerating ? "FORGING..." : "GENERATE ARTWORK"}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-12 text-gray-600 text-xs flex gap-6">
        <p>POWERED BY BASE</p>
        <p>10% SECONDARY ROYALTIES</p>
        <p>© 2026 MINT ENGINE</p>
      </footer>
    </main>
  );
}