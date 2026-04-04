const fs = require('fs');

let content = fs.readFileSync('c:/Users/brand/Downloads/gemini-fuckup/src/App.tsx', 'utf-8');

// Update codeSnippets loop to a longer one
const oldSnippetLoop = `// Add generic loss lines
for (let i = 1; i <= 20; i++) {
  codeSnippets.push(\`Epoch [\${i}/20] | Loss: \${(Math.random() * 0.1 + 0.05).toFixed(4)} | Step: \${i * 40}\`);
}`;

const newSnippetLoop = `// Add generic loss lines
for (let i = 1; i <= 60; i++) {
  codeSnippets.push(\`Epoch [\${i}/60] | Loss: \${(Math.random() * 0.1 + 0.05).toFixed(4)} | Step: \${i * 40}\`);
}`;
content = content.replace(oldSnippetLoop, newSnippetLoop);

// Update CodeScroller slow mode logic to be 5 seconds instead of 3.5
const oldSlowModeTimer = `const slowModeTimer = setTimeout(() => {
      setIsSlowMode(true);
    }, 3500);`;
const newSlowModeTimer = `const slowModeTimer = setTimeout(() => {
      setIsSlowMode(true);
    }, 2500); // Wait 2.5s before hitting slow mode`;
content = content.replace(oldSlowModeTimer, newSlowModeTimer);

// Make the delay variables match the target
const oldDelays = `if (isSlowMode) {
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
        }`;

const newDelays = `if (isSlowMode) {
          // Slow down progressively more the closer we get to the end
          const remainingLines = codeSnippets.length - currentIndex;
          if (remainingLines < 8) {
            delay = 800 + Math.random() * 400; // last few lines are very slow (approx 5 sec total)
          } else {
            delay = 200 + Math.random() * 200; // somewhat slow transition
          }
        } else {
          // Fast mode - super fast
          delay = 10 + Math.random() * 20;
        }`;
content = content.replace(oldDelays, newDelays);

// Replace Step 2
// Replace the entire block starting exactly at:
//       {step === 2 && (
// up to the closing `</div>` of the step.
const step2Regex = /\{\s*step === 2 && \(\s*<div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">[\s\S]*?\s*\{\/\* TWO COLUMNS: EMBED & INSTALLATION \*\//g;

const step2New = `{step === 2 && (
        <div className="flex-1 w-full max-w-7xl mx-auto my-auto flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="pb-8 mb-4">
            <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Training The Next Greatest Artist...</h2>
          </div>
          
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[600px] bg-black rounded-[32px] p-0 h-[350px] shadow-2xl overflow-hidden border-[3px] border-outset border-gray-900 relative flex flex-col my-auto">
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
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 w-full my-auto flex flex-col items-center justify-center">
          {/* TWO COLUMNS: EMBED & INSTALLATION */`;

content = content.replace(step2Regex, step2New);


// Replace Step 3 First Column
const step3Col1Regex = /<div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700">[\s\S]*?(?:<\/div>\s*<\/div>\s*<\/div>|<div className="hidden lg:block w-\[3px\] self-stretch)/g;

const step3Col1New = `<div className="w-full lg:flex-1 lg:w-0 flex flex-col animate-in fade-in zoom-in duration-700">
              <div className="pb-4 mb-4">
                <h2 className="text-2xl font-['Rock_Salt'] text-black text-center">Embed Anywhere</h2>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-[500px] flex flex-col gap-4">
                  <p className="text-xs font-medium tracking-wide text-gray-600 leading-relaxed text-center">
                    Drop this on your website and your clients can generate concepts in your style directly on the bottom of it.
                  </p>
                  
                  <div className="w-full bg-black rounded-[24px] p-0 shadow-2xl overflow-hidden border-[3px] border-outset border-gray-900 relative flex flex-col">
                    <div className="bg-[#1a1a1a] p-4 flex gap-2 w-full border-b border-gray-800">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="p-6 relative">
                      <pre className="text-[10px] sm:text-xs text-[#00ff00] font-mono whitespace-pre-wrap break-all leading-relaxed">
                        {embedCode}
                      </pre>
                    </div>
                    <div className="bg-[#1a1a1a] border-t border-gray-800 p-3 flex justify-end gap-2">
                      <Button onClick={handleCopyEmbed} variant="ghost" className="text-white hover:bg-gray-800 hover:text-white uppercase tracking-widest text-[10px] font-bold h-8">
                        <Copy className="w-3 h-3 mr-2" /> Copy
                      </Button>
                      <Button onClick={handleShareEmbed} variant="ghost" className="text-white hover:bg-gray-800 hover:text-white uppercase tracking-widest text-[10px] font-bold h-8">
                        <Share2 className="w-3 h-3 mr-2" /> Share
                      </Button>
                      <Button onClick={handleDownloadCode} variant="ghost" className="text-white hover:bg-gray-800 hover:text-white uppercase tracking-widest text-[10px] font-bold h-8">
                        <Download className="w-3 h-3 mr-2" /> Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-[3px] self-stretch`;

content = content.replace(step3Col1Regex, step3Col1New);

// Write back
fs.writeFileSync('c:/Users/brand/Downloads/gemini-fuckup/src/App.tsx', content);
console.log('Update successful!');
