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
  const [showSuccessToast, setShowSuccessToast] = useState(false); 

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
    if (!prompt) return setError("What should I create for you?");
    setIsGenerating(true);
    setIsImageLoaded(false);
    setError(""); setImageUrl(""); setMintedTxHash(""); setStatus(""); setShowSuccessToast(false);

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
    if (!account) return setError("Connect your wallet to claim this art!");
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
            setShowSuccessToast(true); 
            setTimeout(() => setShowSuccessToast(false), 5000); 
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

  // NEW LOGIC: Only show as "Not Loading" when the generation is done AND the image is fully downloaded.
  const isActuallyLoading = isGenerating || (imageUrl !== "" && !isImageLoaded);

  return (
    <main className="min-h-[100dvh] w-full bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden flex flex-col relative">
      
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-[#0a0a0c] border border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)] rounded-2xl p-4 flex items-center gap-4 z-50 transition-all duration-500">
          <div className="bg-purple-500/20 p-2 rounded-full text-purple-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div>
            <h4 className="text-white font-black tracking-wide text-sm">Masterpiece Minted!</h4>
            <p className="text-gray-400 text-xs mt-0.5">Asset successfully secured to your wallet.</p>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-gray-600 hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* COMPACT NAV */}
      <nav className="w-full flex justify-between items-center p-4 lg:px-8 border-b border-gray-900/50 bg-black/50 backdrop-blur-md absolute top-0 z-40">
        <div className="font-black text-lg tracking-widest text-white flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-md"></div>
          <span className="hidden sm:inline">MINT ENGINE</span> <span className="text-purple-500">PRO</span>
        </div>
        <ConnectButton client={client} />
      </nav>

      {/* MAIN SPLIT CONTENT */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto w-full px-4 sm:px-6 gap-10 lg:gap-16 pt-28 pb-16 lg:pt-16">
        
        {/* LEFT SIDE */}
        <div className="flex-1 text-center lg:text-left space-y-6 w-full max-w-lg">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent leading-[1.1]">
            FORGE DIGITAL <br className="hidden sm:block"/> <span className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">ASSETS</span> WITH AI.
          </h1>
          <p className="text-gray-400 text-base leading-relaxed font-light px-2 lg:px-0">
            Don't just generate images. Mint Engine Pro transforms your ideas into permanent, high-fidelity digital assets on the Base blockchain. Own what you create.
          </p>

          <div className="space-y-4 pt-6 border-t border-gray-900 text-left">
            <div className="flex items-start gap-3">
              <div className="bg-purple-900/30 p-2.5 rounded-lg border border-purple-500/20 text-purple-400 mt-1 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">AI Prompt-Guard</h3>
                <p className="text-gray-500 text-xs mt-1">Our engine secretly upgrades your simple text into a complex, cinematic 8K prompt behind the scenes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-blue-900/30 p-2.5 rounded-lg border border-blue-500/20 text-blue-400 mt-1 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Base L2 Network</h3>
                <p className="text-gray-500 text-xs mt-1">Minting is lightning fast with near-zero gas fees. Secure your assets directly on Coinbase's Layer 2 blockchain.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full max-w-[380px] bg-[#0a0a0c] p-5 rounded-[28px] shadow-[0_0_80px_rgba(168,85,247,0.08)] border border-gray-800/80 relative">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-20 bg-purple-600/10 blur-[40px] pointer-events-none"></div>

          <div className="relative mb-5 w-full aspect-square rounded-2xl border border-gray-800 bg-[#0d0d12] overflow-hidden shadow-inner">
            
            {/* 1. Loading State (Now stays active until image is fully downloaded) */}
            {isActuallyLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-[#0d0d12] z-20">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-purple-400 font-medium tracking-wide text-xs animate-pulse">
                  {isGenerating ? loadingMessages[loadingStep] : "Downloading masterpiece..."}
                </p>
              </div>
            )}

            {/* 2. Empty State */}
            {!imageUrl && !isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#0d0d12] z-10">
                <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p className="text-gray-400 font-medium text-sm">Awaiting your vision</p>
                <p className="text-gray-600 text-[11px] mt-1">Enter a prompt to ignite the engine.</p>
              </div>
            )}

            {/* 3. Image Render & Overlay (Only visible when fully loaded) */}
            {imageUrl && (
              <div className={`absolute inset-0 z-30 transition-opacity duration-1000 ${isImageLoaded && !isActuallyLoading ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <img 
                  src={imageUrl} 
                  alt="Generated Art" 
                  className="w-full h-full object-cover"
                  onLoad={() => setIsImageLoaded(true)}
                />

                {isImageLoaded && !isActuallyLoading && (
                  <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
                    {!mintedTxHash ? (
                      <button 
                        onClick={handleMint}
                        disabled={isMinting}
                        className="w-full bg-white hover:bg-gray-200 text-black font-black py-3.5 rounded-xl transition-all active:scale-[0.98] text-sm shadow-2xl"
                      >
                        {isMinting ? status : "CLAIM AS NFT ($1.00)"}
                      </button>
                    ) : (
                      <div className="text-center py-2.5 bg-green-950/80 backdrop-blur-md rounded-xl border border-green-900/50">
                        <p className="text-green-400 font-black text-xs mb-0.5">✨ ASSET SECURED</p>
                        <a 
                          href={`https://sepolia.basescan.org/tx/${mintedTxHash}`}
                          target="_blank" 
                          className="text-[10px] text-green-300 hover:text-white underline"
                        >
                          Verify on Blockchain
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 mb-3 text-center text-xs font-bold bg-red-950/30 py-2 rounded-lg border border-red-900/50">{error}</p>}

          <div className="space-y-3 relative z-10">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A neon cyberpunk warrior..." 
              className="w-full bg-[#121217] border border-gray-800 rounded-xl p-3.5 focus:border-purple-500 outline-none transition-all text-sm placeholder:text-gray-600 shadow-inner"
            />

            <button 
              onClick={handleGenerate}
              disabled={isActuallyLoading || isMinting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 text-xs tracking-wide"
            >
              {isActuallyLoading ? "INITIALIZING..." : "GENERATE ARTWORK"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}