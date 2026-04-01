import React, { useState, useEffect, useMemo } from 'react';
import { UploadCloud, Archive, Check, Layers, Globe, Users, Copy, Share2, Download, X, Image as ImageIcon, Wand2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from './lib/utils';
import JSZip from 'jszip';

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

const DEFAULT_MODEL_TITLE = 'Chrome Gen 1';

export default function App() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [zipValidation, setZipValidation] = useState<{ status: 'idle' | 'checking' | 'valid' | 'error'; message: string; imageCount: number }>({
    status: 'idle',
    message: '',
    imageCount: 0,
  });
  const [imageDetails, setImageDetails] = useState<{ filename: string; width: number; height: number }[]>([]);
  const [triggerWord, setTriggerWord] = useState('');
  const [promptText, setPromptText] = useState('');
  const [colorMode, setColorMode] = useState('color');
  const [styleInput, setStyleInput] = useState('');
  const [uploadedRef, setUploadedRef] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState('shopify');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [modelStatus, setModelStatus] = useState<'idle' | 'training' | 'online'>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadModel(userId: string, modelName: string, triggerWord: string, file: File) {
    const reader = new FileReader();
    reader.onload = async function(e) {
      const arrayBuffer = e.target?.result;
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer as ArrayBuffer)));
      
      try {
        const response = await fetch('https://jfegwh5hs7pmvgw6nn4ri5sn5a0lpluk.lambda-url.us-east-2.on.aws/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            model_name: modelName,
            trigger_word: triggerWord,
            filename: file.name,
            file_data: base64Data
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('Upload success:', result);
          return result;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const handleCoverImageDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setCoverImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  const handleTrain = async () => {
    // Validate required fields
    if (!files.length) {
      alert('Please upload a dataset archive (.zip file) first.');
      return;
    }
    
    if (!modelName.trim()) {
      alert('Please enter a model name.');
      return;
    }
    
    if (!triggerWord.trim()) {
      alert('Please enter a trigger word.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Upload the model to the backend
      const result = await uploadModel('user_123', modelName, triggerWord, files[0]);
      
      console.log('Model upload successful:', result);
      
      // Set training status and advance to step 2
      setModelStatus('training');
      setStep(2);
      
    } catch (error) {
      console.error('Model upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      alert('Failed to upload model. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value) return;

    setTags((prev) => {
      if (prev.length >= 3) return prev;
      if (prev.some((t) => t.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value];
    });
  };

  const removeTag = (value: string) => {
    setTags((prev) => prev.filter((t) => t !== value));
  };

  const handleTrainingComplete = () => {
    setModelStatus('online');
  };

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
  src="${window.location.origin}/embed/${(modelName || DEFAULT_MODEL_TITLE).toLowerCase().replace(/\s+/g, '-')}" 
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
        title: modelName || DEFAULT_MODEL_TITLE,
        text: 'Embed this generator on your site',
        url: `${window.location.origin}/embed/${(modelName || DEFAULT_MODEL_TITLE).toLowerCase().replace(/\s+/g, '-')}`,
      });
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([
      `<iframe 
  src="${window.location.origin}/embed/${(modelName || DEFAULT_MODEL_TITLE).toLowerCase().replace(/\s+/g, '-')}" 
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

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFiles([file]);
    setZipValidation({ status: 'checking', message: 'Checking contents...', imageCount: 0 });
    setImageDetails([]);

    try {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setZipValidation({ status: 'error', message: 'Please upload a ZIP file containing 20-30 high-resolution images.', imageCount: 0 });
        setFiles([]);
        return;
      }

      const zip = await JSZip.loadAsync(file);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const imageFiles: JSZip.JSZipObject[] = [];
      let nonImageFiles: string[] = [];
      let totalFiles = 0;

      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        totalFiles++;
        const ext = '.' + relativePath.split('.').pop()!.toLowerCase();
        if (imageExtensions.includes(ext)) {
          imageFiles.push(zipEntry);
        } else {
          nonImageFiles.push(relativePath);
        }
      });

      if (nonImageFiles.length > 0) {
        setZipValidation({
          status: 'error',
          message: 'ZIP contains non-image files. Only image files (.jpg, .png, .webp) allowed.',
          imageCount: imageFiles.length,
        });
        setFiles([]);
        return;
      }

      if (imageFiles.length < 20 || imageFiles.length > 30) {
        setZipValidation({
          status: 'error',
          message: `ZIP contains ${imageFiles.length} images. Please include exactly 20-30 high-resolution images.`,
          imageCount: imageFiles.length,
        });
        setFiles([]);
        return;
      }

      // Check resolution of each image
      const details: { filename: string; width: number; height: number }[] = [];
      const minResolution = 1024;

      for (const imgFile of imageFiles) {
        const blob = await imgFile.async('blob');
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const url = URL.createObjectURL(blob);
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error(`Failed to load ${imgFile.name}`));
          image.src = url;
        });

        if (img.width < minResolution || img.height < minResolution) {
          setZipValidation({
            status: 'error',
            message: `"${imgFile.name}" is too small (${img.width}x${img.height}). Minimum resolution: ${minResolution}x${minResolution}px.`,
            imageCount: imageFiles.length,
          });
          setFiles([]);
          return;
        }
        details.push({ filename: imgFile.name, width: img.width, height: img.height });
      }

      setZipValidation({ status: 'valid', message: `${imageFiles.length} high-resolution images validated.`, imageCount: imageFiles.length });
      setImageDetails(details);
    } catch (err) {
      setZipValidation({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to read ZIP file.',
        imageCount: 0,
      });
      setFiles([]);
    }
  };

  const removeZipFile = () => {
    setFiles([]);
    setZipValidation({ status: 'idle', message: '', imageCount: 0 });
    setImageDetails([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxFiles: 1,
  });

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({
    onDrop: handleCoverImageDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  const embedCode = useMemo(
    () => `<iframe 
  src="${window.location.origin}/embed/${(modelName || DEFAULT_MODEL_TITLE).toLowerCase().replace(/\s+/g, '-')}" 
  width="100%" 
  height="800px" 
  frameborder="0" 
  style="border-radius: 32px; border: 1px solid #eaeaea;"
></iframe>`,
    [modelName],
  );

  return (
    <div className="min-h-screen bg-white text-black flex flex-col pt-24 md:pt-28">
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
              <div className="flex flex-col items-center">
                {/* ZIPPED FOLDER UPLOAD */}
                {files.length > 0 ? (
                  <div
                    style={{ borderColor: zipValidation.status === 'error' ? '#dc2626' : '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                    className="w-full max-w-[300px] min-h-[120px] rounded-3xl p-4 flex flex-col items-center justify-center bg-transparent text-center"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Archive className="w-7 h-7 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-bold text-xs tracking-wider uppercase text-black truncate">{files[0]?.name}</div>
                        {zipValidation.status === 'valid' ? (
                          <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Folder Ready ({zipValidation.imageCount} images)</div>
                        ) : zipValidation.status === 'error' ? (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                            <div className="text-[10px] text-red-500 leading-tight">{zipValidation.message}</div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 border border-gray-400 rounded-full animate-spin" />
                            <div className="text-[10px] text-gray-500">Checking zip contents...</div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={removeZipFile}
                        className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                    className={cn(
                      'w-full max-w-[300px] h-[110px] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-transparent text-center',
                      isDragActive ? 'bg-gray-200/50' : 'hover:bg-gray-200/30',
                    )}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className={cn('w-8 h-8 mb-1 transition-colors', isDragActive ? 'text-black' : 'text-gray-400')} />
                    <div className="font-bold text-xs tracking-[0.2em] uppercase text-black">ZIPPED FOLDER</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">.ZIP (20-30 High-Res Images)</div>
                  </div>
                )}

                {/* COVER IMAGE UPLOAD */}
                <div
                  {...getCoverRootProps()}
                  style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                  className={cn(
                    'w-full max-w-[300px] h-[110px] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-transparent text-center mt-4',
                    isCoverDragActive ? 'bg-gray-200/50' : 'hover:bg-gray-200/30',
                  )}
                >
                  <input {...getCoverInputProps()} />
                  {coverImagePreview ? (
                    <>
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs tracking-wider uppercase text-black truncate">{coverImage.name}</div>
                          <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Cover Ready</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCoverImage();
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className={cn('w-8 h-8 mb-1 transition-colors', isCoverDragActive ? 'text-black' : 'text-gray-400')} />
                      <div className="font-bold text-xs tracking-[0.2em] uppercase text-black">MODEL COVER</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">.PNG, .JPG, .WEBP</div>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full max-w-[300px] mx-auto pt-4">
                <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Artist Name</label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                  className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent"
                  placeholder="E.G. JANE DOE"
                />
              </div>

              <div className="w-full max-w-[300px] mx-auto pt-3 flex flex-col gap-3">
                <label className="block text-[10px] font-bold tracking-[0.2em] text-black uppercase text-center">Tags (up to 3)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const next = tagInput.replace(/,/g, '').trim();
                      if (!next) return;
                      addTag(next);
                      setTagInput('');
                    }
                  }}
                  onBlur={() => {
                    const next = tagInput.replace(/,/g, '').trim();
                    if (!next) return;
                    addTag(next);
                    setTagInput('');
                  }}
                  disabled={tags.length >= 3}
                  style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                  className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent disabled:opacity-40"
                  placeholder={tags.length >= 3 ? 'MAX 3 TAGS' : 'TYPE A TAG + PRESS ENTER'}
                />

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        title="Remove tag"
                      >
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{tag}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
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
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-medium tracking-wide placeholder:text-gray-300 bg-transparent resize-none"
                      placeholder="A short description of your style / what clients can expect…"
                    />
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
                      <img
                        src="https://cdn.shopify.com/s/files/1/0649/4155/5787/files/out-0_6_e5098566-287d-4b06-8dab-0e3afc498bed.webp?v=1773995584"
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square rounded-xl bg-gray-200 overflow-hidden shadow-md">
                      <img
                        src="https://cdn.shopify.com/s/files/1/0649/4155/5787/files/2.png?v=1773705283"
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
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
            <ArtistCard
              modelName={modelName || DEFAULT_MODEL_TITLE}
              artistName={artistName}
              description={description}
              tags={tags}
              status={modelStatus}
            />
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
        <div className="flex-1 w-full my-auto flex flex-col">
          {/* BOTTOM THREE SECTIONS */}
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 mb-8 px-4 animate-in fade-in duration-500">
            <div className="w-full lg:flex-1 lg:w-0 flex flex-col items-center justify-center animate-in slide-in-from-left-8 duration-700">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Artist Card</h2>
              </div>
              <ArtistCard
                modelName={modelName || DEFAULT_MODEL_TITLE}
                artistName={artistName}
                description={description}
                tags={tags}
                status={modelStatus}
              />
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

          <div className="w-full px-4 pb-8 flex justify-center animate-in slide-in-from-bottom-8 duration-700 delay-500">
            <button className="bg-black text-white px-12 py-4 rounded-xl font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 border-4 border-black">
              GO TO MY MODEL
            </button>
          </div>

          {/* MAIN GENERATOR SECTION - NOW AT BOTTOM */}
          <div className="w-full animate-in fade-in duration-500 px-2.5 pb-5">
            <div
              style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
              className="w-full rounded-[40px] overflow-hidden bg-white shadow-2xl p-6 lg:p-8"
            >
              <div className="w-full flex flex-col lg:flex-row items-stretch gap-8 xl:gap-10">
                {/* LEFT - ARTIST CARD - Stretches to match render area height */}
                <div className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0 self-stretch animate-in slide-in-from-left-8 duration-700">
                  <div className="h-full">
                    <ArtistCard
                      modelName="Chrome Gen 1"
                      artistName="Jane Doe"
                      description="A bold fusion of cinematic noir photography and ethereal dreamscapes, blending stark contrasts of light and shadow with soft pastel gradients. Each piece captures fleeting moments of raw emotion suspended in time, drawing from the golden age of Hollywood glamour reimagined through a contemporary lens of digital surrealism."
                      tags={["cinematic", "dramatic", "surreal"]}
                      status="online"
                      showStars={true}
                    />
                  </div>
                </div>


                {/* MIDDLE - TRIGGER WORD, PROMPT, UPLOAD */}
                <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col animate-in fade-in duration-700 delay-150 fill-mode-both">
                  <div className="w-full flex flex-col gap-4 flex-1">
                    {/* Trigger Word */}
                    <div>
                      <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Trigger Word</label>
                      <div className="text-center py-2.5 px-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                        <span className="text-sm font-bold tracking-wider text-black">{triggerWord || '—'}</span>
                      </div>
                    </div>

                    {/* Prompt Input */}
                    <div>
                      <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Describe Your Style</label>
                      <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        rows={4}
                        style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                        className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-left font-medium placeholder:text-gray-300 bg-transparent resize-none text-sm"
                        placeholder="A cinematic portrait..."
                      />
                    </div>

                    {/* Color Mode + Style Row */}
                    <div className="flex items-center justify-between gap-6">
                      {/* Color Mode */}
                      <div className="flex flex-col items-center gap-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">Color Mode</label>
                        <div className="flex items-center gap-2">
                          {['color', 'black'].map((mode) => (
                            <label key={mode} className={cn(
                              'flex items-center gap-1.5 cursor-pointer px-4 py-2 rounded-full transition-all',
                              colorMode === mode ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            )}>
                              <input
                                type="radio"
                                name="colorMode"
                                value={mode}
                                checked={colorMode === mode}
                                onChange={() => setColorMode(mode)}
                                className="sr-only"
                              />
                              <span className="text-[10px] font-bold tracking-wider uppercase">{mode === 'black' ? 'B&W' : 'Color'}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Style Input */}
                      <div className="flex flex-col items-center gap-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">Style</label>
                        <input
                          type="text"
                          value={styleInput}
                          onChange={(e) => setStyleInput(e.target.value)}
                          style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                          className="w-44 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-xs font-medium placeholder:text-gray-300 bg-transparent"
                          placeholder="e.g. cinematic"
                        />
                      </div>
                    </div>

                    {/* Upload Reference - Compact like Step 1 */}
                    {uploadedRef ? (
                      <div
                        className="w-full min-h-[110px] rounded-3xl p-4 flex flex-col items-center justify-center bg-transparent text-center"
                        style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img src={URL.createObjectURL(uploadedRef)} alt="Reference" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-bold text-xs tracking-wider uppercase text-black truncate">{uploadedRef.name}</div>
                            <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Image Ready</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadedRef(null)}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => document.getElementById('upload-input')?.click()}
                        className="w-full h-[110px] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-transparent text-center hover:bg-gray-200/30"
                        style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      >
                        <UploadCloud className="w-8 h-8 mb-1 text-gray-400" />
                        <div className="font-bold text-xs tracking-[0.2em] uppercase text-black">REFERENCE IMAGE</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">.PNG, .JPG, .WEBP</div>
                      </button>
                    )}
                    <input id="upload-input" type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedRef(e.target.files[0]);
                      }
                    }} />

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1" />

                    {/* CREATE BUTTON - at bottom */}
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full bg-black text-white rounded-xl py-4 font-bold text-[10px] tracking-[0.25em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Wand2 className="w-5 h-5" />
                      {isGenerating ? 'CREATING...' : 'CREATE MY IMAGE'}
                    </button>
                  </div>
                </div>


                {/* RIGHT - RENDERS */}
                <div className="w-full lg:flex-1 animate-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
                  <div className="w-full flex flex-col h-full">
                    {/* Fixed height container for icons + image */}
                    <div className="w-full flex flex-col h-[500px]">
                      {/* Placeholder space for icons - always present */}
                      <div className={cn(
                        "flex items-center justify-center gap-3 transition-all duration-300",
                        generatedImage ? "h-12 mb-2" : "h-0 mb-0 overflow-hidden"
                      )}>
                        {generatedImage && (
                          <>
                            {/* Save to Profile */}
                            <button
                              className="group relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-500"
                              title="Save to Profile"
                              onClick={() => {}}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Save to Profile</span>
                            </button>
                            {/* Download */}
                            <button
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = generatedImage;
                                a.download = 'generated-image.png';
                                a.click();
                              }}
                              className="group relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
                              title="Download"
                            >
                              <Download className="w-6 h-6" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Download</span>
                            </button>
                            {/* Share */}
                            <button
                              onClick={handleShareEmbed}
                              className="group relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
                              title="Share"
                            >
                              <Share2 className="w-6 h-6" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Share</span>
                            </button>
                            {/* Upload to Community Gallery */}
                            <button
                              onClick={() => document.getElementById('upload-input')?.click()}
                              className="group relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
                              title="Upload to Community Gallery"
                            >
                              <UploadCloud className="w-6 h-6" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Upload to Gallery</span>
                            </button>
                          </>
                        )}
                      </div>
                      {/* Image / Placeholder - 1:1 Aspect Ratio */}
                      <div className="flex-1 min-h-0 flex flex-col items-center">
                        {generatedImage ? (
                          <div className="w-full aspect-square max-h-full rounded-3xl overflow-hidden shadow-lg bg-gray-100">
                            <img src={generatedImage} alt="Generated result" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full aspect-square max-h-full rounded-3xl overflow-hidden shadow-lg bg-gray-50 flex items-center justify-center">
                            {isGenerating ? (
                              <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-bold tracking-[0.2em] uppercase text-gray-500">Creating Magic...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <Wand2 className="w-20 h-20 text-gray-200" />
                                <p className="text-xs font-bold tracking-[0.15em] uppercase text-gray-400 text-center">Your image here</p>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Edit Image Button - Below Image, Center Aligned */}
                        {generatedImage && (
                          <button
                            className="mt-3 bg-black text-white rounded-full px-4 py-2.5 font-bold text-[10px] tracking-wider uppercase hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center gap-2"
                            onClick={async () => {
                              try {
                                // Fetch the generated image and convert to File
                                const response = await fetch(generatedImage);
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const file = new File([blob], 'generated-image.png', { type: 'image/png' });
                                  setUploadedRef(file);
                                } else {
                                  // Fallback for CORS issues
                                  const file = new File([''], `${generatedImage}`, { type: 'image/png' });
                                  setUploadedRef(file);
                                }
                                setGeneratedImage('');
                              } catch {
                                setGeneratedImage('');
                              }
                            }}
                          >
                            Edit Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ArtistCard({
  modelName,
  artistName,
  tags,
  description,
  status,
  showStars,
}: {
  modelName: string;
  artistName: string;
  tags: string[];
  description: string;
  status: 'idle' | 'training' | 'online';
  showStars?: boolean;
}) {
  const statusLabel = status === 'online' ? 'Online' : status === 'training' ? 'Training' : 'Offline';
  const statusClass =
    status === 'online'
      ? 'bg-green-100 text-green-700'
      : status === 'training'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-gray-100 text-gray-600';

  const visibleTags = (tags || [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="w-full max-w-[320px] rounded-[32px] bg-white shadow-2xl border border-gray-100 overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Star Rating - Above Model Label */}
        {showStars && (
          <div className="flex items-center justify-center gap-1 pb-2">
            {[1,2,3,4,5].map((star) => (
              <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            ))}
          </div>
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Model</p>
            <h3 className="text-lg font-black uppercase truncate">{modelName}</h3>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mt-2">Artist</p>
            <p className="text-sm font-black uppercase truncate">{artistName || '—'}</p>
          </div>

          <div className={cn('px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase flex-shrink-0', statusClass)}>
            {statusLabel}
          </div>
        </div>

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Description</p>
          <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
            {description?.length ? description : '—'}
          </pre>
        </div>
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
