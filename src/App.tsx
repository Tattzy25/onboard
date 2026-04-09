import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Archive,
  Check,
  Layers,
  Globe,
  Users,
  Share2,
  X,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from './lib/utils';
import JSZip from 'jszip';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { SystemAlert } from '../components/ui/alert';
import { CopyIcon } from '../components/ui/copy';
import { DownloadIcon } from '../components/ui/download';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';

const systemToast = {
  error: (msg: string) => {
    toast.custom((t) => (
      <SystemAlert
        id={t.toString()}
        variant="error"
        title="Error"
        description={msg}
        isVisible={true}
        onClose={() => toast.dismiss(t)}
      />
    ));
  },
  success: (msg: string) => {
    toast.custom((t) => (
      <SystemAlert
        id={t.toString()}
        variant="success"
        title="Success"
        description={msg}
        isVisible={true}
        onClose={() => toast.dismiss(t)}
      />
    ));
  },
};

export default function App() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [zipValidation, setZipValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'error';
    message: string;
    imageCount: number;
  }>({
    status: 'idle',
    message: '',
    imageCount: 0,
  });
  const [imageDetails, setImageDetails] = useState<
    { filename: string; width: number; height: number }[]
  >([]);
  const [triggerWord, setTriggerWord] = useState('');
  const [modelName, setModelName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

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
    try {
      const formData = new FormData();
      formData.append('zip', zipFile);
      if (coverImageFile) {
        formData.append('cover', coverImageFile);
      }
      formData.append('userId', userId);
      formData.append('modelName', modelName);
      formData.append('triggerWord', triggerWord);
      formData.append('artistName', artistName);
      formData.append('description', description);
      formData.append('tags', JSON.stringify(tagsArray));

      const response = await fetch('/api/submit-model', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error body');
        throw new Error(`Server Error: Status ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Upload success:', result);
      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Network error or server unreachable.';
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
      await uploadModel(
        userId,
        modelName,
        triggerWord,
        artistName,
        description,
        tags,
        coverImage,
        files[0]
      );

      systemToast.success('Upload successful! Starting training...');
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
        systemToast.error(
          `ZIP contains ${rejectedFiles.length} invalid files (videos/docs). Please include only images (.jpg, .png, .webp).`
        );
        setZipValidation({
          status: 'error',
          message: 'Only image files allowed.',
          imageCount: imageFiles.length,
        });
        setFiles([]);
        return;
      }

      if (imageFiles.length > 40) {
        systemToast.error(
          `ZIP contains too many images (${imageFiles.length}). Maximum 40 allowed.`
        );
        setZipValidation({
          status: 'error',
          message: 'Maximum 40 images allowed.',
          imageCount: imageFiles.length,
        });
        setFiles([]);
        return;
      }

      if (imageFiles.length < 20) {
        systemToast.error(
          `ZIP contains too few images (${imageFiles.length}). Please include at least 20 images.`
        );
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

      setZipValidation({
        status: 'valid',
        message: `${imageFiles.length} images validated.`,
        imageCount: imageFiles.length,
      });
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

  const {
    getRootProps: getCoverRootProps,
    getInputProps: getCoverInputProps,
    isDragActive: isCoverDragActive,
  } = useDropzone({
    onDrop: handleCoverImageDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-white text-black flex flex-col overflow-x-hidden w-full max-w-[100vw]">
      {step === 1 && (
        <div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col overflow-x-hidden">
          <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-8 xl:gap-12 py-8 px-4 animate-in fade-in duration-500">
            <div className="w-full md:flex-1 md:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">1. Upload</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-8 md:px-0">
                <div className="w-full max-w-full sm:max-w-[400px] md:max-w-[320px] xl:max-w-[380px] flex flex-col gap-6">
                  {/* ARTIST NAME */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">
                      Artist Name
                    </label>
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
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">
                      Tags (up to 3)
                    </label>
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
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                              {tag}
                            </span>
                            <X className="w-3 h-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ZIPPED FOLDER UPLOAD */}
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">
                        Zipped Folder
                      </label>
                      <span className="relative inline-block cursor-help group">
                        <svg
                          className="w-3 h-3 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 w-64 text-[11px] font-bold text-white bg-gray-900 rounded-lg whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                          Minimum 1024px x 1024px resolution. 20-30 images of your tattoo style.
                          <br />
                          <br />
                          Place your high-resolution images into one folder, then zip and compress
                          it. Kept for 1 hour after training.
                        </span>
                      </span>
                    </div>
                    {files.length > 0 ? (
                      <div
                        style={{
                          borderColor: zipValidation.status === 'error' ? '#dc2626' : '#000000',
                          borderStyle: 'outset',
                          borderWidth: '3px',
                        }}
                        className="w-full min-h-[55px] rounded-xl p-3 flex flex-col items-center justify-center bg-transparent text-center"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Archive className="w-5 h-5 text-gray-700" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-bold text-xs tracking-wider uppercase text-black truncate">
                              {files[0]?.name}
                            </div>
                            {zipValidation.status === 'valid' ? (
                              <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">
                                Folder Ready ({zipValidation.imageCount} images)
                              </div>
                            ) : zipValidation.status === 'error' ? (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                                <div className="text-[10px] text-red-500 leading-tight">
                                  {zipValidation.message}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-2 h-2 border border-gray-400 rounded-full animate-spin" />
                                <div className="text-[10px] text-gray-500">
                                  Checking zip contents...
                                </div>
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
                        style={{
                          borderColor: '#000000',
                          borderStyle: 'outset',
                          borderWidth: '3px',
                        }}
                        className={cn(
                          'w-full min-h-[64px] rounded-xl p-4 flex items-center justify-center cursor-pointer transition-all bg-transparent text-center active:scale-95 touch-manipulation',
                          isDragActive ? 'bg-gray-200/50' : 'hover:bg-gray-200/30'
                        )}
                      >
                        <input {...getInputProps()} />
                        <UploadCloud
                          className={cn(
                            'w-5 h-5 mr-3 transition-colors',
                            isDragActive ? 'text-black' : 'text-gray-400'
                          )}
                        />
                        <div className="font-bold text-sm tracking-[0.2em] uppercase text-black">
                          UPLOAD ZIP
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ARTIST COVER IMAGE UPLOAD */}
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <label className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">
                        Artist Cover Image
                      </label>
                      <span className="relative inline-block cursor-help group">
                        <svg
                          className="w-3 h-3 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 w-64 text-[11px] font-bold text-white bg-gray-900 rounded-lg whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center leading-relaxed">
                          Provide a cover image for your artist model. .PNG, .JPG, or .WEBP formats.
                        </span>
                      </span>
                    </div>
                    {coverImagePreview ? (
                      <div
                        style={{
                          borderColor: '#000000',
                          borderStyle: 'outset',
                          borderWidth: '3px',
                        }}
                        className="w-full min-h-[55px] rounded-xl p-3 flex flex-col items-center justify-center bg-transparent text-center"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={coverImagePreview}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-bold text-xs tracking-wider uppercase text-black truncate">
                              {coverImage?.name}
                            </div>
                            <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">
                              Cover Ready
                            </div>
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
                        style={{
                          borderColor: '#000000',
                          borderStyle: 'outset',
                          borderWidth: '3px',
                        }}
                        className={cn(
                          'w-full min-h-[64px] rounded-xl p-4 flex items-center justify-center cursor-pointer transition-all bg-transparent text-center active:scale-95 touch-manipulation',
                          isCoverDragActive ? 'bg-gray-200/50' : 'hover:bg-gray-200/30'
                        )}
                      >
                        <input {...getCoverInputProps()} />
                        <ImageIcon
                          className={cn(
                            'w-5 h-5 mr-3 transition-colors',
                            isCoverDragActive ? 'text-black' : 'text-gray-400'
                          )}
                        />
                        <div className="font-bold text-sm tracking-[0.2em] uppercase text-black">
                          UPLOAD IMAGE
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

            <div className="w-full md:flex-1 md:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">
                  2. Brand & Train
                </h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-8 md:px-0">
                <div className="w-full max-w-full sm:max-w-[400px] md:max-w-[320px] xl:max-w-[380px] flex flex-col gap-6">
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">
                      Trigger Word
                    </label>
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
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">
                      Model Name
                    </label>
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
                      <label className="text-[10px] font-bold tracking-[0.2em] text-black uppercase">
                        Description
                      </label>
                      <span className="relative inline-block cursor-help group">
                        <svg
                          className="w-3 h-3 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
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
              <div className="pt-4 flex items-center justify-center w-full px-4 sm:px-8 md:px-0">
                <Button
                  onClick={handleTrain}
                  disabled={isUploading}
                  className="w-full max-w-full sm:max-w-[400px] md:max-w-[320px] xl:max-w-[380px] bg-black text-white rounded-xl py-4 font-bold text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      UPLOADING...
                    </span>
                  ) : (
                    'TRAIN MY MODEL'
                  )}
                </Button>
              </div>
            </div>

            <div className="hidden md:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />

            <div className="w-full md:flex-1 md:w-0 flex flex-col animate-in fade-in zoom-in duration-700 delay-150 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">
                  3. Then What?
                </h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-8 md:px-0">
                <div className="w-full max-w-full sm:max-w-[400px] md:max-w-[320px] xl:max-w-[380px]">
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">
                        Model Goes Live
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">
                        Generate Images
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">
                        Copy Paste ANYWHERE
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3 h-3" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase">
                        Share With Clients
                      </span>
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
    </div>
  );
}
