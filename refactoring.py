import os
import re

file_path = os.path.join("c:\\", "Users", "brand", "Downloads", "gemini-fuckup", "src", "App.tsx")
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add versionId state
if 'const [versionId, setVersionId]' not in code:
    code = code.replace(
        "const [userId, setUserId] = useState<string>('');",
        "const [userId, setUserId] = useState<string>('');\n  const [versionId, setVersionId] = useState<string>('');"
    )

# 2. Save versionId in handleTrain
if 'setVersionId(' not in code:
    code = code.replace(
        "// Set training status and advance to step 2",
        "// Save version ID from Dify\n      if (result?.data?.id) {\n        setVersionId(result.data.id);\n      } else if (result?.data?.version_id) {\n        setVersionId(result.data.version_id);\n      }\n      \n      // Set training status and advance to step 2"
    )

# 3. Clean up generic ugly styles
code = code.replace(
    "style={{ borderColor: zipValidation.status === 'error' ? '#dc2626' : '#000000', borderStyle: 'outset', borderWidth: '3px' }}",
    "className={cn(\"w-full max-w-[300px] min-h-[60px] rounded-xl p-4 flex flex-col items-center justify-center bg-white shadow-sm border transition-all hover:shadow-md\", zipValidation.status === 'error' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200')}"
)

code = code.replace(
    'className="w-full max-w-[300px] min-h-[60px] rounded-xl p-4 flex flex-col items-center justify-center bg-transparent text-center"',
    'className="text-center w-full"'
)

code = code.replace(
    "style={{ borderColor: '#000000', borderStyle: 'outset', borderWidth: '3px' }}",
    "className=\"w-full p-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-[0.2em] uppercase placeholder:text-gray-300\""
)

code = code.replace(
    "className={cn(\n                      'w-full max-w-[300px] h-[55px] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all bg-transparent text-center',",
    "className={cn(\n                      'w-full max-w-[300px] h-[55px] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all bg-white text-center shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300',"
)

code = code.replace(
    "className={cn(\n                    'w-full max-w-[300px] h-[55px] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all bg-transparent text-center mt-4',",
    "className={cn(\n                    'w-full max-w-[300px] h-[55px] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all bg-white text-center mt-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300',"
)

code = code.replace(
    'className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent"',
    ''
)
code = code.replace(
    'className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-medium tracking-wide placeholder:text-gray-300 bg-transparent resize-none"',
    'rows={4}'
)
code = code.replace(
    'className="w-full p-3 rounded-xl focus:ring-2 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-widest uppercase placeholder:text-gray-300 bg-transparent disabled:opacity-40"',
    'disabled={tags.length >= 3}\n                  className={cn("w-full p-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all text-black text-center font-bold tracking-[0.2em] uppercase placeholder:text-gray-300", tags.length >= 3 && "opacity-40")}'
)

code = code.replace(
    "disabled={tags.length >= 3}\n                  disabled={tags.length >= 3}",
    "disabled={tags.length >= 3}"
)

# 4. Dividers
code = code.replace(
    '<div className="hidden lg:block w-[3px] self-stretch border-l-[3px] border-black border-outset opacity-20 my-12" />',
    '<div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-gray-200 to-transparent my-12" />'
)

# 5. Remove third column in Step 1
split_token = "2. Brand & Train</h2>"
if split_token in code:
    parts = code.split(split_token)
    after = parts[1]
    str_to_cut = "CREATE MY MODEL\n                </button>\n              </div>\n            </div>"
    cut_idx = after.find(str_to_cut)
    if cut_idx != -1:
        cut_idx += len(str_to_cut)
        end_of_step1 = after.find("</div>\n        </div>\n      )}")
        if end_of_step1 != -1:
            retained_after = after[:cut_idx] + "\n" + after[end_of_step1:]
            code = parts[0] + split_token + retained_after

# 6. TerminalBlock
tb = """
function TerminalBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full bg-[#0a0a0a] rounded-[24px] p-0 shadow-2xl overflow-hidden border border-gray-800 relative flex flex-col", className)}>
      <div className="bg-[#1a1a1a] p-3 flex gap-2 w-full border-b border-gray-800">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
      </div>
      <div className="flex-1 p-5 overflow-auto relative">
        {children}
      </div>
    </div>
  );
}
"""
if "function TerminalBlock" not in code:
    code += "\n" + tb

# 7. Step 2 Replacements
step2_pattern = r"\{step === 2 && \([\s\S]*?\}\)"
step2_replacement = """{step === 2 && (
        <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-12 max-w-5xl mx-auto my-auto py-16 px-4 animate-in fade-in duration-500">
          <div className="w-full lg:flex-1 flex flex-col justify-center space-y-8 pl-8">
            <StatusItem text="Uploading Dataset..." delay={0} />
            <StatusItem text="Analyzing Style Patterns..." delay={1500} />
            <StatusItem text="Compiling Neural Network..." delay={3000} />
            <StatusItem text="Training Model Weights..." delay={4500} />
            <StatusItem text="Finalizing Model..." delay={6500} />
          </div>

          <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-gray-200 to-transparent my-12" />

          <div className="w-full lg:flex-1 flex flex-col justify-center my-auto">
            <TerminalBlock className="h-[350px]">
              <CodeScroller onComplete={handleTrainingComplete} />
            </TerminalBlock>
          </div>
        </div>
      )}"""
# pass the replacement via lambda to avoid escape character issues
code = re.sub(step2_pattern, lambda m: step2_replacement, code, count=1)

# Fix handleTrainingComplete
code = code.replace(
    "setModelStatus('online');",
    "setModelStatus('online');\n    setStep(3);"
)

# 8. Step 3 Replacements
step3_pattern = r"\{step === 3 && \([\s\S]*?\}\)"
step3_replacement = """{step === 3 && (
        <div className="flex-1 w-full my-auto flex flex-col items-center justify-center max-w-6xl mx-auto py-16 px-4">
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8 xl:gap-16 animate-in fade-in duration-500">
            <div className="w-full lg:flex-1 flex flex-col animate-in fade-in zoom-in duration-700">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Embed Anywhere</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-xs font-medium tracking-wide text-gray-600 leading-relaxed text-center mb-6">
                  Drop this code on your website and your clients can generate concepts in your style directly from your page.
                </p>
                <TerminalBlock className="min-h-[200px]">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all relative">
                    <span className="text-blue-400">{'<!--'} Provide your embed code below {'-->'}</span>\n
                    {embedCode}
                  </pre>
                  <button 
                    onClick={handleCopyEmbed}
                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </TerminalBlock>
                <div className="w-full mt-8 flex justify-center">
                  <button 
                    onClick={() => window.open(`https://example.com/artist/${(modelName || DEFAULT_MODEL_TITLE).toLowerCase().replace(new RegExp('\\\\s+', 'g'), '-')}`, '_blank')}
                    className="bg-black text-white px-12 py-4 rounded-xl font-black text-sm tracking-[0.2em] uppercase hover:bg-gray-900 active:scale-[0.98] transition-all shadow-xl shadow-black/10 border border-black w-full max-w-[300px]"
                  >
                    GO TO MY MODEL
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-px self-stretch bg-gradient-to-b from-transparent via-gray-200 to-transparent my-12" />

            <div className="w-full lg:flex-1 flex flex-col animate-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Installation Guide</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-full flex gap-2 flex-wrap justify-center mb-6">
                  {['shopify', 'squarespace', 'wix', 'wordpress'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setActivePlatform(platform)}
                      className={cn(
                        'px-4 py-2 rounded-full font-bold text-[10px] tracking-[0.2em] uppercase transition-all shadow-sm border',
                        activePlatform === platform ? 'bg-black text-white border-black' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200'
                      )}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner min-h-[220px]">
                  <div className="space-y-4">
                    {platformInstructions[activePlatform].map((instruction, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs font-medium text-gray-700 leading-relaxed">
                          {instruction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}"""
code = re.sub(step3_pattern, lambda m: step3_replacement, code, count=1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)
print("Refactoring complete.")
