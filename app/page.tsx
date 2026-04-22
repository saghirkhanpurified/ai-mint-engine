"use client";

import { useState, useEffect } from "react";
import { ConnectButton, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { createThirdwebClient, getContract, prepareTransaction, toWei } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { mintTo } from "thirdweb/extensions/erc721";

// --- SETTINGS ---
const MY_WALLET_ADDRESS = "0xc70C4b47C5Be4a510c645A3cdEaD2368F5Df0c6D"; 
const MINT_FEE_ETH = "0.00005"; // Lowered to roughly $0.15 to cover AI API costs
const client = createThirdwebClient({ clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID as string });
const LOADING_MSGS = ["Analyzing vision...", "Rendering pixels...", "Applying lighting...", "Finalizing..."];

export default function Home() {
  const account = useActiveAccount(); 
  const { mutate: sendTx, isPending: isMinting } = useSendTransaction();

  // Unified States
  const [prompt, setPrompt] = useState("");
  const [imgUrl, setImgUrl] = useState(""); 
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [showToast, setShowToast] = useState(false); 

  // Loading Text Animation
  useEffect(() => {
    const int = isGenerating ? setInterval(() => setLoadStep(p => (p + 1) % 4), 2500) : undefined;
    if (!isGenerating) setLoadStep(0);
    return () => clearInterval(int);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt) return setError("What should I create for you?");
    setIsGenerating(true); setIsLoaded(false); setError(""); setImgUrl(""); setTxHash(""); setShowToast(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: `${prompt}, clean high-end digital art, masterpiece, striking contrast, hyper-detailed, clear focal point, 8k resolution, award-winning composition` }), 
      });
      if (!res.ok) throw new Error("The Forge is busy. Try again!");
      setImgUrl((await res.json()).imageUrl); 
    } catch (err: any) { setError(err.message); } 
    finally { setIsGenerating(false); }
  };

  const handleMint = async () => {
    if (!account) return setError("Connect your wallet first!");
    setError(""); setStatus("Step 1 of 2: Processing Base Fee...");
    
    const contract = getContract({ client, chain: baseSepolia, address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string });

    sendTx(prepareTransaction({ to: MY_WALLET_ADDRESS, chain: baseSepolia, client, value: toWei(MINT_FEE_ETH) }), {
      onSuccess: () => {
        setStatus("Step 2 of 2: Forging Genesis NFT...");
        sendTx(mintTo({ contract, to: account.address, nft: { name: "Mint Engine Genesis", description: prompt, image: imgUrl } }), {
          onSuccess: (res) => {
            setTxHash(res.transactionHash); setStatus(""); setShowToast(true); 
            setTimeout(() => setShowToast(false), 5000); 
          },
          onError: () => setError("Minting failed. Check dashboard.")
        });
      },
      onError: () => { setError("Payment cancelled."); setStatus(""); }
    });
  };

  const isWorking = isGenerating || (imgUrl !== "" && !isLoaded);

  return (
    <main className="min-h-[100dvh] w-full bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden flex flex-col relative">
      <Toast show={showToast} onClose={() => setShowToast(false)} />
      <NavBar />

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto w-full px-4 sm:px-6 gap-10 lg:gap-16 pt-28 pb-16 lg:pt-16">
        <MarketingPitch />

        {/* APP CONTAINER */}
        <div className="w-full max-w-[380px] bg-[#0a0a0c] p-5 rounded-[28px] shadow-[0_0_80px_rgba(168,85,247,0.08)] border border-gray-800/80 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-20 bg-purple-600/10 blur-[40px] pointer-events-none" />

          <div className="relative mb-5 w-full aspect-square rounded-2xl border border-gray-800 bg-[#0d0d12] overflow-hidden shadow-inner">
            
            {isWorking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-[#0d0d12] z-20">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-purple-400 font-medium text-xs animate-pulse">
                  {isGenerating ? LOADING_MSGS[loadStep] : "Downloading masterpiece..."}
                </p>
              </div>
            )}

            {!imgUrl && !isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#0d0d12] z-10">
                <span className="text-4xl mb-3 opacity-60 grayscale">🖼️</span>
                <p className="text-gray-400 font-medium text-sm">Awaiting your vision</p>
                <p className="text-gray-600 text-[11px] mt-1">Enter a prompt to ignite the engine.</p>
              </div>
            )}

            {imgUrl && (
              <div className={`absolute inset-0 z-30 transition-opacity duration-1000 ${isLoaded && !isWorking ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <img src={imgUrl} alt="Art" className="w-full h-full object-cover" onLoad={() => setIsLoaded(true)} />

                {isLoaded && !isWorking && (
                  <div className="absolute bottom-0 w-full p-3 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
                    {!txHash ? (
                      <button onClick={handleMint} disabled={isMinting} className="w-full bg-white hover:bg-gray-200 text-black font-black py-3.5 rounded-xl transition-all active:scale-[0.98] text-sm shadow-2xl">
                        {isMinting ? status : "MINT GENESIS PASS (~$0.15)"}
                      </button>
                    ) : (
                      <div className="text-center py-2.5 bg-green-950/80 backdrop-blur-md rounded-xl border border-green-900/50">
                        <p className="text-green-400 font-black text-xs mb-0.5">✨ GENESIS SECURED</p>
                        <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" className="text-[10px] text-green-300 underline">Verify on Blockchain</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 mb-3 text-center text-xs font-bold bg-red-950/30 py-2 rounded-lg border border-red-900/50">{error}</p>}

          <div className="space-y-3 relative z-10">
            <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. A neon warrior..." className="w-full bg-[#121217] border border-gray-800 rounded-xl p-3.5 focus:border-purple-500 outline-none text-sm shadow-inner" />
            <button onClick={handleGenerate} disabled={isWorking || isMinting} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-xs tracking-wide">
              {isWorking ? "INITIALIZING..." : "GENERATE ARTWORK"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}

// ==========================================
// --- EXTRACTED MINI UI COMPONENTS BELOW ---
// ==========================================

function NavBar() {
  return (
    <nav className="w-full flex justify-between items-center p-4 lg:px-8 border-b border-gray-900/50 bg-black/50 backdrop-blur-md absolute top-0 z-40">
      <div className="font-black text-lg tracking-widest text-white flex items-center gap-2">
        <div className="w-5 h-5 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-md" />
        <span className="hidden sm:inline">MINT ENGINE</span> <span className="text-purple-500">PRO</span>
      </div>
      <ConnectButton client={client} />
    </nav>
  );
}

function Toast({ show, onClose }: { show: boolean, onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 bg-[#0a0a0c] border border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)] rounded-2xl p-4 flex items-center gap-4 z-50 transition-all duration-500">
      <div className="bg-purple-500/20 p-2 rounded-full text-purple-400">✨</div>
      <div>
        <h4 className="text-white font-black text-sm">Genesis Minted!</h4>
        <p className="text-gray-400 text-xs mt-0.5">Asset successfully secured to your wallet.</p>
      </div>
      <button onClick={onClose} className="text-gray-600 hover:text-white ml-4">✕</button>
    </div>
  );
}

function MarketingPitch() {
  return (
    <div className="flex-1 text-center lg:text-left space-y-6 w-full max-w-lg">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent leading-[1.1]">
        CO-CREATE THE <br className="hidden sm:block"/> <span className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">GENESIS</span> COLLECTION.
      </h1>
      <p className="text-gray-400 text-base leading-relaxed px-2 lg:px-0">
        Don't just generate images. Help us build the largest community-driven AI art collection on the Base network. Mint your masterpiece at-cost and become a founding member of our ecosystem.
      </p>
      <div className="space-y-4 pt-6 border-t border-gray-900 text-left">
        <Feature icon="👑" title="Genesis Founder Status" desc="Your NFT is your verifiable pass. Early minters will secure future ecosystem rewards." />
        <Feature icon="⚡" title="At-Cost AI Generation" desc="We dropped the fees. Pay only the base cost to power the AI and secure it on-chain." />
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-purple-900/30 p-2.5 rounded-lg border border-purple-500/20 text-purple-400 mt-1 shrink-0">{icon}</div>
      <div>
        <h3 className="text-white font-bold text-base">{title}</h3>
        <p className="text-gray-500 text-xs mt-1">{desc}</p>
      </div>
    </div>
  );
}