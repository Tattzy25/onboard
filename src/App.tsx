import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Heart, 
  Download, 
  Share2, 
  Settings2, 
  X, 
  Code,
  Check,
  Copy,
  Archive,
  UploadCloud
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // Minimal config that the artist can actually change
  const [config, setConfig] = useState({
    title: 'TaTTTy Trainer',
    version: 'v4.1',
    buttonText: 'Train My Model',
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedImage("https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2000&auto=format&fit=crop");
      setIsGenerating(false);
    }, 2500);
  };

  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}" width="100%" height="800px" frameborder="0" style="border-radius: 32px; overflow: hidden; border: 1px solid #eaeaea;"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      alert("Added to your gallery!");
    }
  };

  const handleShare = () => {
    alert("Share with a friend and get 10% off your next ink! Check out what I just did on TATTTY!");
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'tattoo-concept.jpg';
      link.click();
    } else {
      alert("Generate an image first to download!");
    }
  };

  if (!hasCompletedOnboarding) {
    return (
      <OnboardingView 
        onComplete={(modelName) => {
          setConfig({ ...config, title: modelName || 'TaTTTy Trainer' });
          setHasCompletedOnboarding(true);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 md:p-8 font-sans text-black relative overflow-hidden">
      
      {/* Main Generator UI */}
      <div className="max-w-[1200px] w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        
        {/* Left: Image Display */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[500px] aspect-square rounded-[32px] overflow-hidden bg-gray-200 shadow-2xl shadow-black/10 border-4 border-white">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100"
                >
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold tracking-[0.2em] text-gray-500 uppercase">Synthesizing Ink...</p>
                </motion.div>
              ) : (
                <motion.img 
                  key={generatedImage || "placeholder"}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  src={generatedImage || "https://images.unsplash.com/photo-1611501271407-f28c24cb9c1b?q=80&w=2000&auto=format&fit=crop"} 
                  alt="Tattoo Concept" 
                  className="object-cover w-full h-full"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center max-w-[500px] lg:max-w-none mx-auto lg:mx-0">
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-mono tracking-[0.2em] text-gray-600 uppercase">
                MEMBER ARTIST GEN {config.version}
              </p>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <span className="text-[9px] font-bold tracking-[0.2em] text-black uppercase">Rate</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <StarIcon key={star} className="w-3.5 h-3.5 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors" />
                  ))}
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none text-black">
              {config.title}
            </h1>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-3 uppercase">
                Concept Prompt
              </label>
              <textarea 
                style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                className="w-full p-5 rounded-2xl resize-none h-32 focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-sm leading-relaxed placeholder:text-gray-400 bg-white" 
                placeholder="Describe the tattoo concept... (e.g. Minimalist geometric phoenix with liquid chrome finish)"
              />
            </div>

            <ReferenceUpload />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-black text-white rounded-full py-5 font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/10 mb-8"
          >
            {isGenerating ? "GENERATING..." : config.buttonText}
          </button>

          <div className="flex items-center gap-4 justify-center lg:justify-start">
            <button onClick={handleLike} className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors group shadow-lg">
              <Heart className={cn("w-5 h-5 transition-transform", isLiked ? "fill-red-500 text-red-500" : "group-hover:scale-110")} />
            </button>
            <button onClick={handleDownload} className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors group shadow-lg">
              <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button onClick={handleShare} className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors group shadow-lg">
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

        </div>
      </div>

      {/* Floating Settings Button for the Artist */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-8 right-8 bg-white border border-gray-200 text-black p-4 rounded-full shadow-2xl hover:scale-105 transition-all z-40 group flex items-center gap-3 pr-6"
      >
        <div className="bg-black text-white p-2 rounded-full">
          <Settings2 className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase">Configure Widget</span>
      </button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 border-l border-gray-100 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-sm font-bold tracking-[0.2em] uppercase">Widget Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase">Model Title</label>
                  <input 
                    type="text" 
                    value={config.title}
                    onChange={(e) => setConfig({...config, title: e.target.value.toUpperCase()})}
                    className="w-full p-4 rounded-xl border border-gray-200 font-black text-xl tracking-tighter uppercase focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase">Button Text</label>
                  <input 
                    type="text" 
                    value={config.buttonText}
                    onChange={(e) => setConfig({...config, buttonText: e.target.value.toUpperCase()})}
                    className="w-full p-4 rounded-xl border border-gray-200 font-bold text-sm tracking-widest uppercase focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                      <Code className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold tracking-[0.2em] uppercase">Embed Code</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    Copy this iframe to embed the generator on your personal website, Webflow, or Shopify store.
                  </p>
                  
                  <div className="relative group">
                    <pre className="bg-gray-50 p-4 rounded-xl text-[10px] text-gray-600 font-mono overflow-x-auto border border-gray-200">
                      {`<iframe 
  src="${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  style="border-radius: 32px; border: 1px solid #eaeaea;"
></iframe>`}
                    </pre>
                    <button 
                      onClick={handleCopyEmbed}
                      className="absolute top-3 right-3 p-2 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components

function ReferenceUpload() {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  return (
    <div 
      {...getRootProps()} 
      style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
      className={cn(
        "rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-white",
        isDragActive ? "bg-gray-50" : "hover:bg-gray-50/50"
      )}
    >
      <input {...getInputProps()} />
      <Sparkles className={cn("w-5 h-5 mb-3 transition-colors", isDragActive ? "text-black" : "text-gray-800")} />
      <div className="font-bold text-[11px] tracking-[0.2em] uppercase mb-1 text-black">Upload Reference Image</div>
      <div className="text-[10px] text-gray-600 uppercase tracking-wider">Optional: Influence the LoRA model weights</div>
    </div>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function OnboardingView({ onComplete }: { onComplete: (modelName: string) => void }) {
  const [modelName, setModelName] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/zip': ['.zip'], 'application/x-zip-compressed': ['.zip'] },
    multiple: false,
    onDrop: (acceptedFiles: File[]) => setFiles(acceptedFiles)
  } as any);

  const handleCreate = () => {
    if (!modelName || !triggerWord || files.length === 0) {
      alert("Please fill in all fields and upload a zip file.");
      return;
    }
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      onComplete(modelName);
    }, 3000); // mock training time
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 md:p-8 font-sans text-black relative overflow-hidden">
      <div className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl shadow-black/10 border border-gray-100 p-8 md:p-12">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-mono tracking-[0.2em] text-gray-500 uppercase mb-4">
            Model Setup
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none text-black">
            Train New Model
          </h1>
        </div>

        <div className="space-y-8">
          {/* Zip Upload */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-3 uppercase">
              Dataset Archive (.zip)
            </label>
            <div 
              {...getRootProps()} 
              style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
              className={cn(
                "rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-white text-center",
                isDragActive ? "bg-gray-50" : "hover:bg-gray-50/50"
              )}
            >
              <input {...getInputProps()} />
              {files.length > 0 ? (
                <>
                  <Archive className="w-8 h-8 mb-3 text-black" />
                  <div className="font-bold text-[13px] tracking-wider uppercase mb-1 text-black truncate max-w-[200px] mx-auto">{files[0].name}</div>
                  <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Archive Ready</div>
                </>
              ) : (
                <>
                  <UploadCloud className={cn("w-8 h-8 mb-3 transition-colors", isDragActive ? "text-black" : "text-gray-400")} />
                  <div className="font-bold text-[11px] tracking-[0.2em] uppercase mb-1 text-black">Upload Zip Folder</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">30-50 High Resolution Images</div>
                </>
              )}
            </div>
          </div>

          {/* Trigger Word */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-3 uppercase">
              Trigger Word
            </label>
            <input 
              type="text"
              value={triggerWord}
              onChange={(e) => setTriggerWord(e.target.value)}
              style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
              className="w-full p-4 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-sm font-bold tracking-widest uppercase placeholder:text-gray-300 bg-white" 
              placeholder="E.G. MYSTYLE"
            />
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-3 uppercase">
              Model Name
            </label>
            <input 
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
              className="w-full p-4 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-sm font-bold tracking-widest uppercase placeholder:text-gray-300 bg-white" 
              placeholder="E.G. LIQUID CHROME GEN 1"
            />
          </div>

          <button 
            onClick={handleCreate}
            disabled={isTraining}
            className="w-full bg-black text-white rounded-xl py-5 font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/10 mt-4 relative overflow-hidden"
          >
            {isTraining ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                TRAINING MODEL...
              </span>
            ) : "CREATE MY MODEL"}
          </button>
        </div>
      </div>
    </div>
  );
}
