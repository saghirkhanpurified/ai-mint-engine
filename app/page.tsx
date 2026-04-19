"use client";

import { useState, useEffect } from "react";
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
  const [loadingStep, setLoadingStep] = useState(0);
  const [imageUrl, setImageUrl] = useState(""); 
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [error, setError] = useState("");
  const [mintedTxHash, setMintedTxHash] = useState("");
  const [status, setStatus] = useState("");

  const loadingMessages = [
    "Analyzing vision...",
    "Rendering high-res pixels...",
    "Applying cinematic lighting...",
    "Finalizing masterpiece..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2500); 
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt) return alert("What should I create for you?");
    setIsGenerating(true);
    setIsImageLoaded(false);
    setError(""); setImageUrl(""); setMintedTxHash(""); setStatus("");

    // --- PROMPT GUARD: The Clean Luxury Guard ---
    const masterpiecePrompt = `${prompt}, clean high-end digital art, masterpiece, striking contrast, hyper-detailed, clear focal point, 8k resolution, award-winning composition`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: masterpiecePrompt }), 
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
    <main className="min-h-screen bg-black text-white flex flex-col items-center py-20 px-4 font-sans selection:bg-purple-500/30">
      {/* Navigation */}
      <div className="absolute top-6 right-6">
        <ConnectButton client={client} />
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mb-12">
        <h1 className="text-7xl font-black mb-4 tracking-tighter bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          MINT ENGINE <span className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">PRO</span>
        </h1>
        <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
          High-Fidelity AI • Base Layer 2 • Instant Ownership
        </p>
      </div>

      {/* Main App Container - Lightened the background slightly to separate from pure black */}
      <div className="bg-[#0f0f13] p-8 md:p-10 rounded-[40px] shadow-[0_0_80px_rgba(168,85,247,0.07)] w-full max-w-xl border border-gray-800 relative overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-purple-600/10 blur-[60px] pointer-events-none"></div>

        {/* Image Display Area */}
        <div className="relative mb-8 group min-h-[300px] flex flex-col justify-center">
          
          {/* 1. Loading State */}
          {isGenerating && (
            <div className="aspect-square w-full bg-[#16161d] rounded-3xl border border-gray-700 flex flex-col items-center justify-center space-y-6 shadow-inner">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-purple-400 font-medium tracking-wide animate-pulse">
                {loadingMessages[loadingStep]}
              </p>
            </div>
          )}

          {/* 2. Image Render & Mint Button State */}
          {imageUrl && !isGenerating && (
            <div className="rounded-3xl overflow-hidden border border-gray-700 shadow-2xl bg-[#0a0a0a]">
              <img 
                src={imageUrl} 
                alt="Generated Art" 
                className={`w-full h-auto object-cover transition-opacity duration-1000 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setIsImageLoaded(true)}
              />

              {isImageLoaded && (
                <div className="p-6 bg-[#0f0f13] border-t border-gray-800">
                  {!mintedTxHash ? (
                    <button 
                      onClick={handleMint}
                      disabled={isMinting}
                      className="w-full bg-white hover:bg-gray-200 text-black font-black py-5 rounded-2xl transition-all active:scale-[0.98] text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      {isMinting ? status : "CLAIM AS NFT ($1.00)"}
                    </button>
                  ) : (
                    <div className="text-center py-4 bg-green-950/30 rounded-2xl border border-green-900/50">
                      <p className="text-green-400 font-black text-lg mb-2">✨ ASSET SECURED</p>
                      <a 
                        href={`https://sepolia.basescan.org/tx/${mintedTxHash}`}
                        target="_blank" 
                        className="text-sm text-green-300 hover:text-white underline transition-colors"
                      >
                        Verify on Blockchain
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Empty State - FIXED VISIBILITY */}
          {!imageUrl && !isGenerating && (
            <div className="aspect-square w-full bg-gradient-to-br from-[#16161d] to-[#0a0a0a] rounded-3xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-center p-6 shadow-inner">
              <span className="text-5xl mb-4 opacity-40">🖼️</span>
              <p className="text-gray-400 font-medium text-lg">Awaiting your vision</p>
              <p className="text-gray-600 text-sm mt-2">Enter a prompt below to ignite the engine.</p>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 mb-6 text-center text-sm font-bold bg-red-950/30 py-3 rounded-xl border border-red-900/50">{error}</p>}

        {/* Input Area - Brightened slightly */}
        <div className="space-y-4 relative z-10">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A neon warrior, A crystal dragon..." 
            className="w-full bg-[#16161d] border border-gray-700 rounded-2xl p-5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-lg placeholder:text-gray-500 shadow-inner"
          />

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isMinting}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "INITIALIZING ENGINE..." : "GENERATE ARTWORK"}
          </button>
        </div>
      </div>

      <footer className="mt-12 text-gray-600 text-xs flex gap-6 tracking-widest font-semibold">
        <p>POWERED BY BASE</p>
        <p>10% ROYALTIES</p>
        <p>V 1.2.1</p>
      </footer>
    </main>
  );
}