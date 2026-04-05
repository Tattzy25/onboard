import React, { useState, useEffect, useMemo } from 'react';
import { UploadCloud, Archive, Check, Layers, Globe, Users, Copy, Share2, Download, X, Image as ImageIcon, Wand2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from './lib/utils';
import JSZip from 'jszip';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { SystemAlert } from "../components/ui/alert";
import { CopyIcon } from "../components/ui/copy";
import { DownloadIcon } from "../components/ui/download";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";

const platformInstructions: Record<string, string[]> = {
  shopify: [
    'Where: Online Store > Themes > Customize > (open theme) > Edit code OR Theme settings > Custom HTML section.',
    'Step 1: In Shopify admin, go to Online Store > Themes > Customize.',
    'Step 2: Open the page/section where you want the iframe. Click the block that allows HTML or select “Custom HTML” (or use Edit code → relevant template if no HTML block).',
    'Step 3: Paste the embed code.',
    'Step 4: Save and preview. If it’s blocked, use Edit code and paste into the template file inside the section you want.',
  ],
  squarespace: [
    'Where: Pages > Edit Page > Add Block > Code Block. (Need a plan that supports Code Block.)',
    'Step 1: Edit the page and click the + to add a block.',
    'Step 2: Choose "Code" block.',
    'Step 3: Paste the embed code.',
    'Step 4: Click Apply → Save page → Preview.',
  ],
  wix: [
    'Where: Editor > Add (+) > Embed > Embed a Widget > HTML iframe.',
    'Step 1: Open Wix Editor and the page you want.',
    'Step 2: Add > Embed > Embed a Widget > "HTML iframe" or "Custom Embeds" → Enter Code.',
    'Step 3: Paste the embed code.',
    'Step 4: Resize the frame on page, Save & Publish.',
  ],
  wordpress: [
    'Where: Page/Post editor → Add block → Custom HTML (or use theme editor if needed). Business plan required on wordpress.com for third‑party iframes.',
    'Step 1: Edit the page/post. Click + and choose "Custom HTML."',
    'Step 2: Paste the embed code.',
    'Step 3: Preview and Publish.',
  ],
};

const DEFAULT_MODEL_TITLE = 'tattzy25/tattty_4_all 1';

const systemToast = {
  error: (msg: string) => {
    toast.custom((t) => (
      <SystemAlert id={t.toString()} variant="error" title="Error" description={msg} isVisible={true} onClose={() => toast.dismiss(t)} />
    ));
  },
  success: (msg: string) => {
    toast.custom((t) => (
      <SystemAlert id={t.toString()} variant="success" title="Success" description={msg} isVisible={true} onClose={() => toast.dismiss(t)} />
    ));
  }
};

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
  const [userId, setUserId] = useState<string>('');
  const [versionId, setVersionId] = useState<string>('');
  const [embedRandom, setEmbedRandom] = useState<string>('');

  // Detect user ID from Shopify context
  useEffect(() => {
    const detectUserId = () => {
      // Check URL parameters
      const params = new URLSearchParams(window.location.search);
      const userIdParam = params.get('user_id');
      if (userIdParam) {
        setUserId(userIdParam);
        return;
      }

      // Check for Shopify customer ID
      const shopifyCustomer = (window as any).Shopify?.checkout?.customer?.id;
      if (shopifyCustomer) {
        setUserId(shopifyCustomer);
        return;
      }

      // Check for Shopify shop context
      const shopifyShop = (window as any).Shopify?.shop;
      if (shopifyShop) {
        setUserId(shopifyShop);
        return;
      }
    };

    detectUserId();
  }, []);

  async function uploadModel(
    userId: string,
    modelName: string,
    triggerWord: string,
    artistName: string,
    description: string,
    tagsArray: string[],
    coverImageFile: File | null,
    zipFile: File
  ) {
    const formData = new FormData();

    formData.append('user_id', 'owner123');
    formData.append('model_name', modelName);
    formData.append('trigger_word', triggerWord);
    formData.append('artist_name', artistName);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(tagsArray));

    if (coverImageFile) {
      formData.append('cover_image', coverImageFile);
    }

    formData.append('zipped_folder', zipFile);

    try {
      const response = await fetch('/api/build-model', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log('Upload success:', result);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error or server unreachable.';
      systemToast.error(`Upload failed: ${errorMsg}`);
      console.error('Upload failed:', error);
      throw error;
    }
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
      systemToast.error('Please upload a dataset archive (.zip file) first.');
      return;
    }

    if (!modelName.trim() && !triggerWord.trim()) {
      systemToast.error('Please enter a model name and trigger word.');
      return;
    }

    if (!modelName.trim()) {
      systemToast.error('Please enter a model name.');
      return;
    }

    if (!triggerWord.trim()) {
      systemToast.error('Please enter a trigger word.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload the model to the backend with all required data
      const result = await uploadModel(
        userId,
        modelName,
        triggerWord,
        artistName,
        description,
        tags,
        coverImage,
        files[0]
      );

      console.log('Model upload successful:', result);
      systemToast.success('Upload successful! Starting training...');

      // Extract version ID and Gen ID from API response
      const vid = result.data?.version_id || '';
      const genId = result.data?.gen_id || '';
      setVersionId(vid);
      setEmbedRandom(genId);

      // Set training status and advance to step 2
      setModelStatus('training');
      setStep(2);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Model upload failed:', error);
      setUploadError(errorMsg);
      alert(`Upload failed: ${errorMsg}`);
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
    setStep(3);
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

  const embedCode = `<iframe src="https://embed.tattty.com?${versionId}&${embedRandom}" />`;

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmbed = async () => {
    const shareUrl = `${window.location.origin}/embed/${(modelName || DEFAULT_MODEL_TITLE).toLowerCase().replace(/\s+/g, '-')}`;
    const shareText = "Yo check what i just came up on in TaTTTy.com app";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: modelName || DEFAULT_MODEL_TITLE,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          systemToast.error('Failed to share.');
        }
      }
    } else {
      // Fallback: Copy to clipboard if Web Share API is not available
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        systemToast.success('Share message copied to clipboard!');
      } catch (err) {
        systemToast.error('Failed to copy share message.');
      }
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
        const errorMsg = 'Invalid file format. Please upload a .zip folder.';
        systemToast.error(errorMsg);
        setZipValidation({ status: 'error', message: errorMsg, imageCount: 0 });
        setFiles([]);
        return;
      }

      const zip = await JSZip.loadAsync(file);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const imageFiles: JSZip.JSZipObject[] = [];
      let rejectedFiles: string[] = [];

      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        const ext = '.' + relativePath.split('.').pop()!.toLowerCase();
        if (imageExtensions.includes(ext)) {
          imageFiles.push(zipEntry);
        } else {
          rejectedFiles.push(relativePath);
        }
      });

      if (rejectedFiles.length > 0) {
        systemToast.error(`ZIP contains ${rejectedFiles.length} invalid files (videos/docs). Please include only images (.jpg, .png, .webp).`);
        setZipValidation({
          status: 'error',
          message: 'Only image files allowed.',
          imageCount: imageFiles.length,
        });
        setFiles([]);
        return;
      }

      if (imageFiles.length > 40) {
        systemToast.error(`ZIP contains too many images (${imageFiles.length}). Maximum 40 allowed.`);
        setZipValidation({
          status: 'error',
          message: 'Maximum 40 images allowed.',
          imageCount: imageFiles.length,
        });
        setFiles([]);
        return;
      }

      if (imageFiles.length < 20) {
        systemToast.error(`ZIP contains too few images (${imageFiles.length}). Please include at least 20 images.`);
        setZipValidation({
          status: 'error',
          message: 'Include at least 20 images.',
          imageCount: imageFiles.length,
        });
        setFiles([]);
        return;
      }

      // Check integrity of each image
      const details: { filename: string; width: number; height: number }[] = [];

      for (const imgFile of imageFiles) {
        const blob = await imgFile.async('blob');
        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const image = new Image();
            image.onload = () => {
              URL.revokeObjectURL(url);
              resolve(image);
            };
            image.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error(`"${imgFile.name}" is not a valid or corrupt image.`));
            };
            image.src = url;
          });

          details.push({ filename: imgFile.name, width: img.width, height: img.height });
        } catch (err) {
          systemToast.error(err instanceof Error ? err.message : 'Invalid image detected.');
          setZipValidation({
            status: 'error',
            message: 'Invalid image detected.',
            imageCount: imageFiles.length,
          });
          setFiles([]);
          return;
        }
      }

      setZipValidation({ status: 'valid', message: `${imageFiles.length} images validated.`, imageCount: imageFiles.length });
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


  return (
    <div className="min-h-screen bg-white text-black flex flex-col pt-[56px] md:pt-[76px]">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-gray-200 mx-auto">
        <Button
          variant="ghost"
          onClick={() => setStep(1)}
          className={cn('px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors', step === 1 ? 'bg-black text-white' : 'hover:bg-gray-100')}
        >
          Setup
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStep(2)}
          className={cn('px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors', step === 2 ? 'bg-black text-white' : 'hover:bg-gray-100')}
        >
          Training
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStep(3)}
          className={cn('px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors', step === 3 ? 'bg-black text-white' : 'hover:bg-gray-100')}
        >
          Completion
        </Button>
      </div>

      {step === 1 && (
        <div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col">
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 py-16 px-4 animate-in fade-in duration-500">
            <div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">1. Upload</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-[300px] flex flex-col gap-6">
                  
                  {/* ARTIST NAME */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Artist Name</label>
                    <Input
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      className="w-full h-auto p-3 rounded-xl focus-visible:ring-2 focus-visible:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest placeholder:text-gray-300 bg-transparent"
                      placeholder="e.g. jane doe"
                    />
                  </div>

                  {/* TAGS */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Tags (up to 3)</label>
                    <Input
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
                      className="w-full h-auto p-3 rounded-xl focus-visible:ring-2 focus-visible:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest placeholder:text-gray-300 bg-transparent disabled:opacity-40"
                      placeholder={tags.length >= 3 ? 'MAX 3 TAGS' : 'type a tag + press enter'}
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            onClick={() => removeTag(tag)}
                            className="flex items-center cursor-pointer gap-2 px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            title="Remove tag"
                          >
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{tag}</span>
                            <X className="w-3 h-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ZIPPED FOLDER UPLOAD */}
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">Zipped Folder</label>
                      <span className="relative inline-block cursor-help group">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 w-64 text-[11px] font-bold text-white bg-gray-900 rounded-lg whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                          Minimum 1024px x 1024px resolution. 20-30 images of your tattoo style.
                          <br/><br/>
                          Place your high-resolution images into one folder, then zip and compress it. Kept for 1 hour after training.
                        </span>
                      </span>
                    </div>
                    {files.length > 0 ? (
                      <div
                        style={{ borderColor: zipValidation.status === 'error' ? '#dc2626' : '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                        className="w-full min-h-[55px] rounded-xl p-3 flex flex-col items-center justify-center bg-transparent text-center"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Archive className="w-5 h-5 text-gray-700" />
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
                          <Button
                            type="button"
                            onClick={removeZipFile}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        {...getRootProps()}
                        style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                        className={cn(
                          'w-full h-[55px] rounded-xl p-3 flex items-center justify-center cursor-pointer transition-all bg-transparent text-center',
                          isDragActive ? 'bg-gray-200/50' : 'hover:bg-gray-200/30'
                        )}
                      >
                        <input {...getInputProps()} />
                        <UploadCloud className={cn('w-4 h-4 mr-2 transition-colors', isDragActive ? 'text-black' : 'text-gray-400')} />
                        <div className="font-bold text-xs tracking-[0.2em] uppercase text-black">UPLOAD ZIP</div>
                      </div>
                    )}
                  </div>

                  {/* ARTIST COVER IMAGE UPLOAD */}
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">Artist Cover Image</label>
                      <span className="relative inline-block cursor-help group">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 w-64 text-[11px] font-bold text-white bg-gray-900 rounded-lg whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                          Provide a cover image for your artist model. .PNG, .JPG, or .WEBP formats.
                        </span>
                      </span>
                    </div>
                    {coverImagePreview ? (
                      <div
                        style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                        className="w-full min-h-[55px] rounded-xl p-3 flex flex-col items-center justify-center bg-transparent text-center"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-bold text-xs tracking-wider uppercase text-black truncate">{coverImage?.name}</div>
                            <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Cover Ready</div>
                          </div>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCoverImage();
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        {...getCoverRootProps()}
                        style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                        className={cn(
                          'w-full h-[55px] rounded-xl p-3 flex items-center justify-center cursor-pointer transition-all bg-transparent text-center',
                          isCoverDragActive ? 'bg-gray-200/50' : 'hover:bg-gray-200/30'
                        )}
                      >
                        <input {...getCoverInputProps()} />
                        <ImageIcon className={cn('w-4 h-4 mr-2 transition-colors', isCoverDragActive ? 'text-black' : 'text-gray-400')} />
                        <div className="font-bold text-xs tracking-[0.2em] uppercase text-black">UPLOAD IMAGE</div>
                      </div>
                    )}
                  </div>
                </div>
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
                    <Input
                      type="text"
                      value={triggerWord}
                      onChange={(e) => setTriggerWord(e.target.value)}
                      style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      className="w-full h-auto p-3 rounded-xl focus-visible:ring-2 focus-visible:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest placeholder:text-gray-300 bg-transparent"
                      placeholder="e.g. mystyle"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Model Name</label>
                    <Input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      className="w-full h-auto p-3 rounded-xl focus-visible:ring-2 focus-visible:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest placeholder:text-gray-300 bg-transparent"
                      placeholder="e.g. tattzy25/tattty_4_all 1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">Description</label>
                      <span className="relative inline-block cursor-help group">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[9px] font-bold text-white bg-black rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          320 characters max
                        </span>
                      </span>
                    </div>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={320}
                      style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      className="w-full h-auto p-3 rounded-xl focus-visible:ring-2 focus-visible:ring-black/5 outline-none transition-all text-black text-center font-medium tracking-wide placeholder:text-gray-300 bg-transparent resize-y min-h-[100px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                      placeholder="A short description of your style / what clients can expect…"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex items-center justify-center">
                <Button
                  onClick={handleTrain}
                  disabled={isUploading}
                  className="w-full max-w-[300px] bg-black text-white rounded-xl py-4 font-bold text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      UPLOADING...
                    </span>
                  ) : (
                    'CREATE MY MODEL'
                  )}
                </Button>
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
                      <span className="text-xs font-bold tracking-widest uppercase">Copy Paste ANYWHERE</span>
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
        <div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="pb-8 mb-4">
            <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Training The Next Greatest Artist...</h2>
          </div>

          <div className="w-full max-w-[600px] bg-black rounded-[32px] p-0 h-[350px] shadow-2xl overflow-hidden border-[3px] border-outset border-gray-600 relative flex flex-col my-auto">
            <div className="bg-[#1a1a1a] p-4 flex gap-2 w-full border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex-1 p-4 overflow-hidden relative">
              <CodeScroller onComplete={handleTrainingComplete} />
            </div>
          </div>

        </div>
      )}

      {step === 3 && (
        <div className="flex-1 w-full flex flex-col pt-12 pb-[100px] h-full relative">
          
          {/* ISOLATED FIXED HEADERS AT THE TOP */}
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-1 xl:gap-1 px-4 mb-4 flex-shrink-0 animate-in fade-in duration-500">
            <div className="w-full lg:flex-1 lg:w-0">
              <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Drop It on ANYTHING</h2>
            </div>
            
            <div className="hidden lg:block w-[3px] opacity-0" />
            
            <div className="w-full lg:flex-1 lg:w-0">
              <h2 className="text-2xl font-['Rock_Salt'] text-black text-center mt-6 lg:mt-0">Copy Paste BASICS</h2>
            </div>
          </div>

          {/* SCROLLABLE BODY CONTENT */}
          <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch justify-center gap-1 xl:gap-1 px-4 overflow-y-auto animate-in fade-in duration-700">
            
            {/* LEFT BODY COLUMN (EMBED) */}
            <div className="w-full lg:flex-1 lg:w-0 flex flex-col items-center justify-start lg:justify-center pb-12 lg:pt-8">
              <div className="w-full max-w-[460px] flex flex-col items-center gap-4">
                <p className="text-[16px] font-['Roboto_Condensed',sans-serif] font-medium tracking-wide text-gray-600 leading-relaxed text-center">
                  Dont Even think twice just Copy Paste It anywhere, Your girlfriend's website your grandma's blog it doesn't matter.
                </p>
                <div className="w-full bg-black rounded-2xl p-0 h-auto min-h-[120px] shadow-2xl overflow-hidden border-[3px] border-outset border-gray-600 relative flex flex-col">
                  <div className="bg-[#1a1a1a] px-4 py-3 flex items-center gap-2 w-full border-b border-gray-800 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 text-[10px] font-mono text-gray-400 tracking-widest uppercase">embed.html</span>
                  </div>
                  <div className="flex-1 p-4 overflow-auto">
                    <pre className="font-mono text-[11px] text-[#00ff00] leading-relaxed whitespace-pre-wrap break-all">
{embedCode}
                    </pre>
                  </div>
                </div>
                  <div className="flex items-center justify-center gap-8 mt-2">
                    <div className="relative flex flex-col items-center gap-2">
                      <button
                        onClick={handleCopyEmbed}
                        className="p-2 text-black hover:text-gray-600 active:scale-[0.9] transition-all"
                        title="Copy Embed Code"
                      >
                        <CopyIcon size={28} />
                      </button>
                      {copied && (
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-green-600 animate-in fade-in slide-in-from-bottom-1">
                          Copied!
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleDownloadCode}
                      className="p-2 text-black hover:text-gray-600 active:scale-[0.9] transition-all"
                      title="Download Code"
                    >
                      <DownloadIcon size={28} />
                    </button>
                    <button
                      onClick={handleShareEmbed}
                      className="p-2 text-black hover:text-gray-600 active:scale-[0.9] transition-all"
                      title="Share Embed"
                    >
                      <Share2 className="w-7 h-7" />
                    </button>
                  </div>
                  
                  <div className="w-full flex justify-center text-gray-600 text-[14px] md:text-[16px] mt-4">
                    <div className="flex flex-col items-center text-center max-w-[460px]">
                      <span className="font-['Rock_Salt'] mb-1">Still Need Help ?? Hit us up @</span>
                      <a href="mailto:HelpMeCopyPaste@tattty.com" className="font-['Roboto_Condensed',sans-serif] font-bold text-black hover:underline">
                        HelpMeCopyPaste@tattty.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* SEPARATOR */}
              <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 mx-4" />

              {/* RIGHT BODY COLUMN (INSTALLATION) */}
              <div className="w-full lg:flex-1 lg:w-0 flex flex-col items-center justify-center pb-12 mt-8 lg:mt-0">
                <div className="w-full max-w-[500px] flex flex-col gap-4">
                  <Tabs value={activePlatform} onValueChange={setActivePlatform} className="w-full">
                    <TabsList className="w-full flex justify-center bg-transparent gap-2 h-auto p-0 mt-8">
                      {['shopify', 'squarespace', 'wix', 'wordpress'].map((platform) => (
                        <TabsTrigger
                          key={platform}
                          value={platform}
                          className={cn(
                            "px-4 py-2 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all border-none shadow-none bg-gray-100 text-gray-500 data-[active]:bg-black data-[active]:text-white hover:bg-gray-200",
                          )}
                        >
                          {platform}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="px-4 flex items-start mt-4 h-[250px]">
                      {['shopify', 'squarespace', 'wix', 'wordpress'].map((platform) => (
                        <TabsContent key={platform} value={platform} className="w-full m-0 border-none p-0 focus-visible:ring-0">
                          <div className="space-y-2 w-full">
                            {platformInstructions[platform].map((instruction, idx) => {
                              const displayInstruction = instruction
                                .replace('{{version=}}', `version=${versionId || 'VERSION_ID'}`)
                                .replace('{{gen_id}}', `gen_id=${embedRandom || 'GEN_ID'}`);
                              
                              return (
                                <p 
                                  key={idx} 
                                  className={cn(
                                    "font-['Roboto_Condensed',sans-serif] text-[14px] md:text-[16px] font-medium text-gray-700 leading-relaxed",
                                    instruction.startsWith('<iframe') && "font-mono bg-gray-100 p-2 rounded mt-1 break-all border border-gray-200"
                                  )}
                                >
                                  {displayInstruction}
                                </p>
                              );
                            })}
                          </div>
                        </TabsContent>
                      ))}
                    </div>
                  </Tabs>
                </div>
              </div>
            
          </div>

          {/* ISOLATED FIXED FOOTER AT THE BOTTOM */}
          <div className="fixed bottom-0 left-0 right-0 w-full py-6 flex justify-center bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-50">
            <Button className="pointer-events-auto bg-black text-white px-12 py-4 rounded-xl font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 border-4 border-black animate-in slide-in-from-bottom-8 duration-700 delay-500">
              GO TO MY MODEL
            </Button>
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
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
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

          <Badge variant="secondary" className={cn('px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase flex-shrink-0', statusClass)}>
            {statusLabel}
          </Badge>
        </div>

        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase bg-gray-100 text-gray-700"
              >
                {tag}
              </Badge>
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

// Training terminal simulation
const codeSnippets = [
  "> INITIALIZING TATTOO STYLE ENGINE...",
  "> LOADING IMAGE DATASET BLOCKS...",
  "> ALLOCATING VRAM TENSORS...",
  "import torch",
  "import torch.nn as nn",
  "from diffusers import StableDiffusionPipeline",
  "model = StableDiffusionPipeline.from_pretrained('base_model')",
  "model.to('cuda')",
  "> EXTRACTING STYLE FEATURES...",
  "Dataset size: 28 images. Resolution: 1024x1024",
  "> SETTING UP AdamW OPTIMIZER (lr=1e-5)...",
  "STARTING TRAINING LOOP...",
];

// Add generic loss lines
for (let i = 1; i <= 20; i++) {
  codeSnippets.push(`Epoch [${i}/20] | Loss: ${(Math.random() * 0.1 + 0.05).toFixed(4)} | Step: ${i * 40}`);
}

codeSnippets.push(
  "> WEIGHTS CONVERGED SUCCESSFULLY.",
  "> SAVING LoRA CHECKPOINTS...",
  "model.save_pretrained('./models/artist_style')",
  "> UPLOADING TO EDGE NETWORK...",
  "> OPTIMIZING WEBGL EMBED RENDERER...",
  "> DEPLOYMENT READY.",
  "status = 'ONLINE'"
);

function CodeScroller({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isSlowMode, setIsSlowMode] = useState(false);

  useEffect(() => {
    let currentIndex = 0;

    // Switch to slow mode after approx 3.5 seconds
    const slowModeTimer = setTimeout(() => {
      setIsSlowMode(true);
    }, 3500);

    const renderNextLine = () => {
      if (currentIndex < codeSnippets.length) {
        setLines(prev => [...prev, codeSnippets[currentIndex]]);
        currentIndex++;

        // Determine speed based on mode and progress
        let delay = 50; // default ultra fast

        if (isSlowMode) {
          // Slow down progressively more the closer we get to the end
          const remainingLines = codeSnippets.length - currentIndex;
          if (remainingLines < 5) {
            delay = 800 + Math.random() * 500; // last few lines are very slow
          } else {
            delay = 300 + Math.random() * 400; // somewhat slow
          }
        } else {
          // Fast mode - vary slightly
          delay = 20 + Math.random() * 40;
        }

        if (currentIndex < codeSnippets.length) {
          setTimeout(renderNextLine, delay);
        } else {
          setTimeout(onComplete, 1000);
        }
      }
    };

    const initialTimer = setTimeout(renderNextLine, 100);

    return () => {
      clearTimeout(slowModeTimer);
      clearTimeout(initialTimer);
    };
  }, [isSlowMode, onComplete]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto font-mono text-xs sm:text-sm text-[#00ff00] leading-relaxed pb-4 custom-scrollbar pr-2">
      {lines.map((line, i) => (
        <div key={i} className="mb-0.5 opacity-90 break-all">{line}</div>
      ))}
      <div className="inline-block w-2 h-[1em] bg-[#00ff00] animate-pulse ml-1 align-middle" />
    </div>
  );
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
