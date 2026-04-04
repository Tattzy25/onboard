import sys

with open('c:/Users/brand/Downloads/gemini-fuckup/src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '              <div className="flex flex-col items-center">\n                {/* ZIPPED FOLDER UPLOAD */}'
end_marker = '            </div>\n\n            <div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print('Could not find markers.')
    sys.exit(1)

new_col1 = '''              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-[300px] flex flex-col gap-6">
                  
                  {/* ARTIST NAME */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-[0.2em] text-black mb-2 uppercase text-center">Artist Name</label>
                    <Input
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}
                      className="w-full h-auto p-3 rounded-xl focus-visible:ring-2 focus-visible:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent"
                      placeholder="E.G. JANE DOE"
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
                      className="w-full h-auto p-3 rounded-xl focus-visible:ring-2 focus-visible:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent disabled:opacity-40"
                      placeholder={tags.length >= 3 ? 'MAX 3 TAGS' : 'TYPE A TAG + PRESS ENTER'}
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
'''

new_content = content[:start_idx] + new_col1 + content[end_idx:]

with open('c:/Users/brand/Downloads/gemini-fuckup/src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Done!')
