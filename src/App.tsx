import React, { useState, useEffect, useMemo } from 'react';
import { UploadCloud, Archive, Sparkles, Check, Layers, Globe, Users, Copy, Share2, Download, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from './lib/utils';

const platformInstructions: Record<string, string[]> = {
  shopify: [
    'Open your Shopify admin and go to Online Store > Themes.',
    'Click Customize, then add a Custom Liquid block where you want the generator to appear.',
    'Paste the embed code and save your theme changes.',
  ],
  squarespace: [
    'Edit the page where you want the generator to appear.',
    'Add a Code Block to the section.',
    'Paste the embed code, apply changes, and publish the page.',
  ],
  wix: [
    'Open the Wix Editor and choose the page for your generator.',
    'Add an Embed Code element from the Add panel.',
    'Paste the iframe code and resize the element to fit your layout.',
  ],
  wordpress: [
    'Open the page or post in the WordPress editor.',
    'Insert a Custom HTML block where the generator should appear.',
    'Paste the embed code and update or publish the page.',
  ],
};

const defaultConfig = {
  title: 'Chrome Gen 1',
};

export default function App() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [triggerWord, setTriggerWord] = useState('');
  const [modelName, setModelName] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState('shopify');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(defaultConfig);

  const handleTrain = () => {
    setStep(2);
  };

  const handleTrainingComplete = () => {};

  const handleGoToGenerator = () => {
    setStep(3);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedImage('https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2000&auto=format&fit=crop');
      setIsGenerating(false);
    }, 2500);
  };

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(`<iframe 
  src="${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  style="border-radius: 32px; border: 1px solid #eaeaea;"
></iframe>`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmbed = async () => {
    if (navigator.share) {
      await navigator.share({
        title: config.title,
        text: 'Embed this generator on your site',
        url: `${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}`,
      });
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([
      `<iframe 
  src="${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  style="border-radius: 32px; border: 1px solid #eaeaea;"
></iframe>`,
    ], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'embed-code.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxFiles: 1,
  });

  const embedCode = useMemo(
    () => `<iframe 
  src="${window.location.origin}/embed/${config.title.toLowerCase().replace(/\s+/g, '-')}" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  style="border-radius: 32px; border: 1px solid #eaeaea;"
></iframe>`,
    [config.title],
  );

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-black flex flex-col">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-gray-200 mx-auto">
        <button
          onClick={() => setStep(1)}
          className={cn('px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors', step === 1 ? 'bg-black text-white' : 'hover:bg-gray-100')}
        >
          Setup
        </button>
        <button
          onClick={() => setStep(2)}
          className={cn('px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors', step === 2 ? 'bg-black text-white' : 'hover:bg-gray-100')}
        >
          Training
        </button>
        <button
          onClick={() => setStep(3)}
          className={cn('px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors', step === 3 ? 'bg-black text-white' : 'hover:bg-gray-100')}
        >
          Completion
        </button>
      </div>

      {step === 1 && (
        <div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col">
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 py-16 px-4 animate-in fade-in duration-500">
            <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">1. Upload</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div
                  {...getRootProps()}
                  style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                  className={cn(
                    'w-full max-w-[300px] aspect-square rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-transparent text-center',
                    isDragActive ? 'bg-gray-200/50' : 'hover:bg-gray-200/30',
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
                      <UploadCloud className={cn('w-12 h-12 mb-4 transition-colors', isDragActive ? 'text-black' : 'text-gray-400')} />
                      <div className="font-bold text-sm tracking-[0.2em] uppercase mb-2 text-black">Dataset Archive</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">.ZIP (30-50 Images)</div>
                    </>
                  )}
                </div>
              </div>
              <div className="pt-4 flex items-center justify-center opacity-0 pointer-events-none">
                <div className="h-6"></div>
              </div>
            </div>

            <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

            <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">2. Brand & Train</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-[300px] flex flex-col gap-6">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Trigger Word</label>
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
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Model Name</label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent"
                      placeholder="E.G. CHROME GEN 1"
                    />
                  </div>
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

            <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">3. Then What?</h2>
              </div>
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
              <div className="pt-4 flex items-center justify-center opacity-0 pointer-events-none">
                <div className="h-6"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 max-w-7xl mx-auto my-auto py-16 px-4 animate-in fade-in duration-500">
          <div className="w-full lg:flex-1 lg:w-0 flex flex-col justify-center space-y-8">
            <StatusItem text="Uploading Dataset..." delay={0} />
            <StatusItem text="Analyzing Style Patterns..." delay={1500} />
            <StatusItem text="Compiling Neural Network..." delay={3000} />
            <StatusItem text="Training Model Weights..." delay={4500} />
            <StatusItem text="Finalizing Artist Card..." delay={6500} />
          </div>

          <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

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

          <div className="w-full lg:flex-1 lg:w-0 flex flex-col items-center justify-center">
            <ArtistCard modelName={modelName || config.title} triggerWord={triggerWord} files={files} isOnline={false} />
            <button
              onClick={handleGoToGenerator}
              className="mt-8 bg-black text-white px-8 py-4 rounded-xl font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 animate-in slide-in-from-bottom-4 duration-500 border-4 border-black"
            >
              CHECK OUT MY MODEL
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col">
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 py-16 px-4 animate-in fade-in duration-500">
            <div className="w-full lg:flex-1 lg:w-0 flex flex-col items-center justify-center animate-in slide-in-from-left-8 duration-700">
              <ArtistCard modelName={modelName || config.title} triggerWord={triggerWord} files={files} isOnline={true} />
            </div>

            <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

            <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Embed Anywhere</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-[300px] flex flex-col">
                  <p className="text-xs font-medium tracking-wide text-gray-600 leading-relaxed text-center mb-4">
                    Drop this on your website and your clients can generate concepts in your style directly on the bottom of it.
                  </p>
                  <div className="w-full relative group mb-4">
                    <pre className="bg-gray-50 p-4 rounded-xl text-[10px] text-gray-800 font-mono overflow-x-auto whitespace-pre-wrap w-full">
                      {embedCode}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex items-center justify-center gap-8">
                <button onClick={handleCopyEmbed} className="text-gray-400 hover:text-black transition-colors" title="Copy">
                  {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6" />}
                </button>
                <button onClick={handleShareEmbed} className="text-gray-400 hover:text-black transition-colors" title="Share">
                  <Share2 className="w-6 h-6" />
                </button>
                <button onClick={handleDownloadCode} className="text-gray-400 hover:text-black transition-colors" title="Download">
                  <Download className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

            <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Installation Guide</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-[300px] flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 w-full justify-center">
                    {['shopify', 'squarespace', 'wix', 'wordpress'].map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setActivePlatform(platform)}
                        className={cn(
                          'px-4 py-2 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all',
                          activePlatform === platform ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                        )}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                  <div className="min-h-[220px] px-4 flex items-center">
                    <div className="space-y-2 w-full">
                      {platformInstructions[activePlatform].map((instruction, idx) => (
                        <p key={idx} className="text-xs font-medium text-gray-700 leading-relaxed">
                          {instruction}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 opacity-0 pointer-events-none">
                <div className="h-6"></div>
              </div>
            </div>
          </div>

          <div className="w-full px-4 pt-4 pb-8 flex justify-center animate-in slide-in-from-bottom-8 duration-700 delay-500">
            <button className="bg-black text-white px-12 py-4 rounded-xl font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 border-4 border-black">
              GO TO MY MODEL
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 bg-black text-white rounded-full px-5 py-3 text-xs font-bold tracking-[0.2em] uppercase shadow-xl hover:bg-gray-900 transition-colors"
      >
        Settings
      </button>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 flex justify-end">
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 border-l border-gray-100 flex flex-col">
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
                  onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black/5 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArtistCard({ modelName, triggerWord, files, isOnline }: { modelName: string; triggerWord: string; files: File[]; isOnline: boolean }) {
  const previewImage = files[0] ? URL.createObjectURL(files[0]) : 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=800&auto=format&fit=crop';

  return (
    <div className="w-full max-w-[320px] rounded-[32px] bg-white shadow-2xl border border-gray-100 overflow-hidden">
      <div className="aspect-[4/5] bg-gray-100 overflow-hidden">
        <img src={previewImage} alt={modelName} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Artist Card</p>
            <h3 className="text-lg font-black uppercase">{modelName}</h3>
          </div>
          <div className={cn('px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase', isOnline ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
            {isOnline ? 'Online' : 'Training'}
          </div>
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-widest">Trigger: {triggerWord || 'STYLE'}</p>
      </div>
    </div>
  );
}

function CodeScroller({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 8000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return <div className="text-green-400 font-mono text-xs">Training model...</div>;
}

function StatusItem({ text, delay }: { text: string; delay: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={cn('flex items-center gap-4 transition-all duration-500', active ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-4')}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-[3px] transition-colors duration-500 flex-shrink-0', active ? 'border-black bg-black text-white' : 'border-gray-300 text-transparent')}>
        <Check className="w-4 h-4" strokeWidth={4} />
      </div>
      <span className="font-bold tracking-[0.2em] uppercase text-xs md:text-sm">{text}</span>
    </div>
  );
}
