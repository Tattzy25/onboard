import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  Layers,
  Globe,
  Users
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  // We use step state to show 1=Setup, 2=Training, 3=Completion
  const [step, setStep] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activePlatform, setActivePlatform] = useState('shopify');

  // Training state
  const [modelName, setModelName] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [hasTrained, setHasTrained] = useState(false);
  
  // Minimal config
  const [config, setConfig] = useState({
    title: 'TaTTTy Trainer',
    version: 'v4.1',
    buttonText: 'Generate Ink',
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/zip': ['.zip'], 'application/x-zip-compressed': ['.zip'] },
    multiple: false,
    onDrop: (acceptedFiles: File[]) => setFiles(acceptedFiles)
  } as any);

      const handleTrain = () => {
        if (!modelName || !triggerWord || files.length === 0) {
          alert("Please fill in all fields and upload a zip file.");
          return;
        }
        setStep(2);
        setHasTrained(false);
      };

      const handleTrainingComplete = () => {
        setConfig({ ...config, title: modelName.toUpperCase() });
        setHasTrained(true);
      };

      const handleGoToGenerator = () => {
        setStep(3);
      };

      const handleGenerate = () => {
    // In preview mode we just let it generate regardless of hasTrained
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

  const handleShareEmbed = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out my Tattoo Generator',
        url: `${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}`
      }).catch(console.error);
    }
  };

  const handleDownloadCode = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}" width="100%" height="800px" frameborder="0" style="border-radius: 32px; overflow: hidden; border: 1px solid #eaeaea;"></iframe>`;
    const element = document.createElement("a");
    const file = new Blob([embedCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "embed-code.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const platformInstructions: Record<string, string[]> = {
    shopify: [
      "1. Go to Online Store > Themes in your Shopify admin.",
      "2. Click 'Customize' on your current theme.",
      "3. Add a 'Custom Liquid' or 'Custom HTML' section where you want the generator.",
      "4. Paste your embed code into the custom code field and click Save."
    ],
    squarespace: [
      "1. Edit the page where you want to add the generator.",
      "2. Add a new Block and select 'Code'.",
      "3. Ensure the code block is set to HTML.",
      "4. Paste your embed code into the block and click Apply/Save."
    ],
    wix: [
      "1. In the Wix Editor, click Add (+) on the left menu.",
      "2. Select 'Embed Code' and then 'Embed HTML'.",
      "3. Click 'Enter Code' and paste your embed code.",
      "4. Resize the embed box to fit the generator properly."
    ],
    wordpress: [
      "1. Edit your page or post.",
      "2. Add a 'Custom HTML' block (Gutenberg) or switch to the Text editor (Classic).",
      "3. Paste your embed code directly into the HTML field.",
      "4. Update or Publish your page."
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex p-4 md:p-8 font-sans text-black relative overflow-hidden gap-8 flex-col lg:flex-row items-stretch">
      
      {/* DEVELOPMENT STATE NAVIGATION (For Testing/Preview) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-gray-200 mx-auto">
         <button 
           onClick={() => setStep(1)} 
           className={cn("px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors", step === 1 ? "bg-black text-white" : "hover:bg-gray-100")}
         >
           Setup
         </button>
         <button 
           onClick={() => setStep(2)} 
           className={cn("px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors", step === 2 ? "bg-black text-white" : "hover:bg-gray-100")}
         >
           Training
         </button>
         <button 
           onClick={() => setStep(3)} 
           className={cn("px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors", step === 3 ? "bg-black text-white" : "hover:bg-gray-100")}
         >
           Completion
         </button>
      </div>

      {/* STEP 1: SETUP */}
      {step === 1 && (
        <div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col">
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 py-16 px-4 animate-in fade-in duration-500">
          
          {/* Column 1: UPLOAD */}
          <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
            {/* Header */}
            <div className="pb-4 mb-4">
              <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">1. Upload</h2>
            </div>
            
            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div 
                {...getRootProps()} 
                style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                className={cn(
                  "w-full max-w-[300px] aspect-square rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-transparent text-center",
                  isDragActive ? "bg-gray-200/50" : "hover:bg-gray-200/30"
                )}
              >
                <input {...getInputProps()} />
                {files.length > 0 ? (
                  <>
                    <Archive className="w-12 h-12 mb-4 text-black" />
                    <div className="font-bold text-sm tracking-wider uppercase mb-2 text-black truncate max-w-[200px] mx-auto">{files[0].name}</div>
                    <div className="text-xs text-green-600 uppercase tracking-wider font-bold">Archive Ready</div>
                  </>
                ) : (
                  <>
                    <UploadCloud className={cn("w-12 h-12 mb-4 transition-colors", isDragActive ? "text-black" : "text-gray-400")} />
                    <div className="font-bold text-sm tracking-[0.2em] uppercase mb-2 text-black">Dataset Archive</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">.ZIP (30-50 Images)</div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 flex items-center justify-center opacity-0 pointer-events-none">
              <div className="h-6"></div>
            </div>
          </div>

          <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

          {/* Column 2: BRAND IT & TRAIN IT */}
          <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
            {/* Header */}
            <div className="pb-4 mb-4">
              <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">2. Brand & Train</h2>
            </div>
            
            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-[300px] flex flex-col gap-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">
                    Trigger Word
                  </label>
                  <input 
                    type="text"
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                    className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent" 
                    placeholder="E.G. MYSTYLE"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">
                    Model Name
                  </label>
                  <input 
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                    className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent" 
                    placeholder="E.G. CHROME GEN 1"
                  />
                </div>

                {/* Cool Artist Card Preview */}
                <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xl flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-gray-400" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-[9px] font-bold tracking-widest text-green-500 uppercase mb-0.5">Card Preview</p>
                      <p className="text-xs font-black uppercase truncate">{modelName || 'MY MODEL'}</p>
                      <p className="text-[10px] text-gray-400 uppercase truncate">Trigger: {triggerWord || 'STYLE'}</p>
                   </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 flex items-center justify-center">
              <button 
                onClick={handleTrain}
                className="w-full max-w-[300px] bg-black text-white rounded-xl py-4 font-bold text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10"
              >
                CREATE MY MODEL
              </button>
            </div>
          </div>

          <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

          {/* Column 3: THEN WHAT? */}
          <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
            {/* Header */}
            <div className="pb-4 mb-4">
              <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">3. Then What?</h2>
            </div>
            
            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-[300px]">
                
                <div className="space-y-4 mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                         <Check className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">Model Goes Live</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                         <Layers className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">Generate Images</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                         <Globe className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">Embed On Site</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
                         <Users className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">Share With Clients</span>
                   </div>
                </div>

                {/* 2 Image Squares side by side */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="aspect-square rounded-xl bg-gray-200 overflow-hidden shadow-md">
                      <img src="https://images.unsplash.com/photo-1611501271407-f28c24cb9c1b?q=80&w=400&auto=format&fit=crop" alt="preview" className="w-full h-full object-cover" />
                   </div>
                   <div className="aspect-square rounded-xl bg-gray-200 overflow-hidden shadow-md">
                      <img src="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=400&auto=format&fit=crop" alt="preview" className="w-full h-full object-cover" />
                   </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 flex items-center justify-center opacity-0 pointer-events-none">
              <div className="h-6"></div>
            </div>
          </div>

          </div>
        </div>
      )}

      {/* STEP 2: LOADING */}
      {step === 2 && (
        <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 max-w-7xl mx-auto my-auto py-16 px-4 animate-in fade-in duration-500">
          
          {/* Column 1: Status Updates */}
          <div className="w-full lg:flex-1 lg:w-0 flex flex-col justify-center space-y-8">
            <StatusItem text="Uploading Dataset..." delay={0} />
            <StatusItem text="Analyzing Style Patterns..." delay={1500} />
            <StatusItem text="Compiling Neural Network..." delay={3000} />
            <StatusItem text="Training Model Weights..." delay={4500} />
            <StatusItem text="Finalizing Artist Card..." delay={6500} />
          </div>

          <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

          {/* Column 2: Code Scroller */}
          <div className="w-full lg:flex-1 lg:w-0 bg-black rounded-[32px] p-0 h-[350px] shadow-2xl overflow-hidden border-[3px] border-outset border-gray-600 relative flex flex-col my-auto">
            <div className="bg-[#1a1a1a] p-4 flex gap-2 w-full border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex-1 p-4 overflow-hidden relative">
              <CodeScroller onComplete={handleTrainingComplete} />
            </div>
          </div>

          <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

          {/* Column 3: Artist Card Display */}
          <div className="w-full lg:flex-1 lg:w-0 flex flex-col items-center justify-center animate-in slide-in-from-right-8 duration-700">
            <ArtistCard modelName={modelName} triggerWord={triggerWord} files={files} isOnline={hasTrained} />
            
            {hasTrained && (
              <button 
                onClick={handleGoToGenerator}
                className="mt-8 bg-black text-white px-8 py-4 rounded-xl font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 animate-in slide-in-from-bottom-4 duration-500 border-4 border-black"
              >
                CHECK OUT MY MODEL
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: GENERATOR REVEAL */}
      {step === 3 && (
        <div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col">
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 py-16 px-4 animate-in fade-in duration-500">
            
            {/* Column 1: Artist Card */}
            <div className="w-full lg:flex-1 lg:w-0 flex flex-col items-center justify-center animate-in slide-in-from-left-8 duration-700">
              <ArtistCard modelName={modelName || config.title} triggerWord={triggerWord} files={files} isOnline={true} />
            </div>

            <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

            {/* Column 2: Embed Code */}
            <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              {/* Header */}
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Embed Anywhere</h2>
              </div>
              
              {/* Body */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-xs font-medium tracking-wide text-gray-600 leading-relaxed text-center mb-4">
                  Drop this on your website and your clients can generate concepts in your style directly on the bottom of it.
                </p>
                <div className="w-full relative group mb-4">
                  <pre 
                    className="bg-gray-50 p-4 rounded-xl text-[10px] text-gray-800 font-mono overflow-x-auto whitespace-pre-wrap w-full"
                  >
                    {`<iframe 
  src="${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  style="border-radius: 32px; border: 1px solid #eaeaea;"
></iframe>`}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 flex items-center justify-center gap-8">
                <button 
                  onClick={handleCopyEmbed}
                  className="text-gray-400 hover:text-black transition-colors"
                  title="Copy"
                >
                  {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
                </button>
                <button 
                  onClick={handleShareEmbed}
                  className="text-gray-400 hover:text-black transition-colors"
                  title="Share"
                >
                  <Share2 className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleDownloadCode}
                  className="text-gray-400 hover:text-black transition-colors"
                  title="Download"
                >
                  <Download className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

            {/* Column 3: Installation Guide */}
            <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
              {/* Header */}
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Installation Guide</h2>
              </div>
              
              {/* Body */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 w-full justify-center">
                  {['shopify', 'squarespace', 'wix', 'wordpress'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setActivePlatform(platform)}
                      className={cn(
                        "px-4 py-2 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all",
                        activePlatform === platform 
                          ? "bg-black text-white" 
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {platform}
                    </button>
                  ))}
                </div>

                {/* Instructions Content */}
                <div className="flex-1 px-4">
                  <div className="space-y-2">
                    {platformInstructions[activePlatform].map((instruction, idx) => (
                      <p key={idx} className="text-xs font-medium text-gray-700 leading-relaxed">
                        {instruction}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 opacity-0 pointer-events-none">
                <div className="h-6"></div>
              </div>
            </div>

          </div>

          {/* Action Button Below Columns */}
          <div className="w-full px-4 pt-4 pb-8 flex justify-center animate-in slide-in-from-bottom-8 duration-700 delay-500">
            <button 
               className="bg-black text-white px-12 py-4 rounded-xl font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 border-4 border-black"
            >
               GO TO MY MODEL
            </button>
          </div>
        </div>
      )}

      {/* Floating Settings Button */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-white border border-gray-200 text-black p-3 lg:p-4 rounded-full shadow-2xl hover:scale-105 transition-all z-40 group flex items-center gap-3 pr-5 lg:pr-6 animate-in slide-in-from-bottom-12 duration-700 delay-500 fill-mode-both"
          >
            <div className="bg-black text-white p-2 rounded-full">
              <Settings2 className="w-4 h-4 lg:w-5 lg:h-5 group-hover:rotate-90 transition-transform duration-500" />
            </div>
            <span className="text-[10px] lg:text-xs font-bold tracking-widest uppercase">Configure Widget</span>
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

// --- Sub-components ---

function ArtistCard({ modelName, triggerWord, files, isOnline }: any) {
  return (
    <div className="w-full max-w-[400px] flex-shrink-0 bg-white rounded-[32px] shadow-2xl shadow-black/10 border border-gray-100 p-8 flex flex-col h-fit my-auto transition-all duration-500 mx-auto">
      <div className="mb-8 text-center">
        <p className="text-[11px] font-mono tracking-[0.2em] text-gray-500 uppercase mb-2">
          Artist Card
        </p>
        <h1 className="text-2xl font-['Rock_Salt'] text-black break-words">
          {modelName || 'MY MODEL'}
        </h1>
      </div>

      <div className="space-y-6 flex-1">
         <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
           <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Trigger Word</p>
           <p className="text-lg font-black uppercase break-words">{triggerWord || 'STYLE'}</p>
         </div>
         
         <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
           <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Dataset</p>
           <div className="flex items-center justify-center gap-2">
             <Archive className="w-4 h-4 text-gray-600" />
             <p className="text-sm font-bold uppercase truncate max-w-[150px]">{files?.[0]?.name || 'dataset.zip'}</p>
           </div>
         </div>

         <div className={cn("flex items-center justify-between px-5 py-4 text-white rounded-2xl shadow-lg mt-4 transition-colors duration-1000", isOnline ? "bg-black" : "bg-gray-400")}>
            <span className="text-[10px] font-bold tracking-widest uppercase">Status</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-400 animate-pulse" : "bg-red-500")} />
              <span className={cn("text-xs font-black", isOnline ? "text-green-400" : "text-red-500")}>
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatusItem({ text, delay }: { text: string, delay: number }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={cn("flex items-center gap-4 transition-all duration-500", active ? "opacity-100 translate-x-0" : "opacity-30 -translate-x-4")}>
       <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-[3px] transition-colors duration-500 flex-shrink-0", active ? "border-black bg-black text-white" : "border-gray-300 text-transparent")}>
          <Check className="w-4 h-4" strokeWidth={4} />
       </div>
       <span className="font-bold tracking-[0.2em] uppercase text-xs md:text-sm">{text}</span>
    </div>
  );
}

function CodeScroller({ onComplete }: { onComplete: () => void }) {
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFinished, setIsFinished] = useState(false);

  const codeSnippets = [
    "function initGenerator() {\n",
    "  const stream = new DataStream();\n",
    "  await stream.connect({ id: '0xFF12' });\n",
    "  renderLayer('vector_main');\n",
    "  while(compiling) {\n",
    "    process.stdout.write('...');\n",
    "    optimize(0.42);\n",
    "  }\n",
    "  return success;\n",
    "}\n",
    "// Processing metadata...\n",
    "const schema = { type: 'object', props: [] };\n",
    "fetch('/api/v2/generate').then(r => r.json());\n",
    "// Model compiled successfully.\n",
    "// Saving final weights...\n",
    "// Done.\n\n",
    "// MODEL ONLINE.\n"
  ];

  useEffect(() => {
    if (isFinished) return;

    let lineIndex = 0;
    let charIndex = 0;
    let currentContent = "";
    
    const typeCode = () => {
      if (lineIndex < codeSnippets.length) {
        let currentLine = codeSnippets[lineIndex];
        
        currentContent += currentLine.charAt(charIndex);
        setContent(currentContent);
        charIndex++;

        if (charIndex >= currentLine.length) {
          lineIndex++;
          charIndex = 0;
        }

        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        if (lineIndex >= codeSnippets.length) {
          setIsFinished(true);
          onComplete();
          return;
        }

        timeoutId = setTimeout(typeCode, 15);
      }
    };

    let timeoutId = setTimeout(typeCode, 15);
    return () => clearTimeout(timeoutId);
  }, [onComplete, isFinished]);

  return (
    <div 
      ref={scrollRef} 
      className="h-full overflow-hidden whitespace-pre-wrap break-all font-mono text-[12px] md:text-[14px] text-[#a6e22e] leading-relaxed"
    >
      {content}
      <span className="inline-block w-2 h-4 bg-[#f8f8f2] ml-1 animate-[blink_0.8s_infinite]" />
    </div>
  );
}

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
        "rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-white",
        isDragActive ? "bg-gray-50" : "hover:bg-gray-50/50"
      )}
    >
      <input {...getInputProps()} />
      <Sparkles className={cn("w-4 h-4 mb-2 transition-colors", isDragActive ? "text-black" : "text-gray-800")} />
      <div className="font-bold text-[10px] tracking-[0.2em] uppercase mb-1 text-black">Upload Reference</div>
      <div className="text-[9px] text-gray-600 uppercase tracking-wider">Influence LoRA weights</div>
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
