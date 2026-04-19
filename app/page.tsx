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
    "Rendering pixels...",
    "Applying lighting...",
    "Finalizing..."
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

    // --- PROMPT GUARD ---
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
    <main className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden flex flex-col">
      
      {/* Top Navigation Bar */}
      <nav className="w-full flex justify-between items-center p-6 border-b border-gray-900/50 bg-black/50 backdrop-blur-md fixed top-0 z-50">
        <div className="font-black text-xl tracking-widest text-white flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-md"></div>
          MINT ENGINE <span className="text-purple-500">PRO</span>
        </div>
        <ConnectButton client={client} />
      </nav>

      {/* Main Split Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto w-full px-6 pt-28 pb-12 gap-12 lg:gap-20">
        
        {/* LEFT SIDE: The Marketing Pitch */}
        <div className="flex-1 text-left space-y-8 w-full max-w-xl">
          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent leading-[1.1]">
            FORGE DIGITAL <br/> <span className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">ASSETS</span> WITH AI.
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed font-light">
            Don't just generate images. Mint Engine Pro transforms your ideas into permanent, high-fidelity digital assets on the Base blockchain. Own what you create.
          </p>

          <div className="space-y-6 pt-4 border-t border-gray-900">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="bg-purple-900/30 p-3 rounded-xl border border-purple-500/20 text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">AI Prompt-Guard</h3>
                <p className="text-gray-500 text-sm mt-1">Our engine secretly upgrades your simple text into a complex, cinematic 8K prompt behind the scenes.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="bg-blue-900/30 p-3 rounded-xl border border-blue-500/20 text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Base L2 Network</h3>
                <p className="text-gray-500 text-sm mt-1">Minting is lightning fast with near-zero gas fees. Secure your assets directly on Coinbase's Layer 2 blockchain.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: The Minting Tool (Compacted & Centered) */}
        <div className="w-full max-w-md bg-[#0a0a0c] p-6 rounded-[32px] shadow-[0_0_80px_rgba(168,85,247,0.08)] border border-gray-800/80 relative">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-purple-600/10 blur-[50px] pointer-events-none"></div>

          {/* Image Display Area (Shorter height) */}
          <div className="relative mb-6 group min-h-[260px] flex flex-col justify-center">
            
            {/* 1. Loading State */}
            {isGenerating && (
              <div className="absolute inset-0 w-full h-full bg-[#121217] rounded-2xl border border-gray-800 flex flex-col items-center justify-center space-y-4 shadow-inner">
                <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-purple-400 font-medium tracking-wide text-sm animate-pulse">
                  {loadingMessages[loadingStep]}
                </p>
              </div>
            )}

            {/* 2. Image Render & Mint Button State */}
            {imageUrl && !isGenerating && (
              <div className="rounded-2xl overflow-hidden border border-gray-700 shadow-2xl bg-[#0a0a0a] relative flex flex-col h-full">
                <img 
                  src={imageUrl} 
                  alt="Generated Art" 
                  className={`w-full aspect-square object-cover transition-opacity duration-1000 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setIsImageLoaded(true)}
                />

                {isImageLoaded && (
                  <div className="p-4 bg-[#0a0a0c] border-t border-gray-800 z-10">
                    {!mintedTxHash ? (
                      <button 
                        onClick={handleMint}
                        disabled={isMinting}
                        className="w-full bg-white hover:bg-gray-200 text-black font-black py-4 rounded-xl transition-all active:scale-[0.98] text-base"
                      >
                        {isMinting ? status : "CLAIM AS NFT ($1.00)"}
                      </button>
                    ) : (
                      <div className="text-center py-3 bg-green-950/30 rounded-xl border border-green-900/50">
                        <p className="text-green-400 font-black text-sm mb-1">✨ ASSET SECURED</p>
                        <a 
                          href={`https://sepolia.basescan.org/tx/${mintedTxHash}`}
                          target="_blank" 
                          className="text-xs text-green-300 hover:text-white underline"
                        >
                          Verify on Blockchain
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Empty State (SLEEK SVG ICON) */}
            {!imageUrl && !isGenerating && (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#121217] to-[#0a0a0c] rounded-2xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-6 shadow-inner">
                <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p className="text-gray-400 font-medium text-base">Awaiting your vision</p>
                <p className="text-gray-600 text-xs mt-2">Enter a prompt to ignite the engine.</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 mb-4 text-center text-xs font-bold bg-red-950/30 py-2 rounded-lg border border-red-900/50">{error}</p>}

          {/* Input Area (Compacted) */}
          <div className="space-y-3 relative z-10">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A neon cyberpunk warrior..." 
              className="w-full bg-[#121217] border border-gray-800 rounded-xl p-4 focus:border-purple-500 outline-none transition-all text-base placeholder:text-gray-600 shadow-inner"
            />

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || isMinting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 text-sm"
            >
              {isGenerating ? "INITIALIZING..." : "GENERATE ARTWORK"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}