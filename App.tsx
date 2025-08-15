
import React, { useState, useCallback, useMemo } from 'react';
import { Mode } from './types';
import { generateCaption, generateImagePrompt } from './services/geminiService';
import { UploadIcon, CopyIcon, CheckIcon } from './components/icons';

interface ImageFile {
  base64: string;
  name: string;
  type: string;
}

// Helper components defined outside the main component to prevent re-creation on re-renders.

const ModeSelector: React.FC<{ selectedMode: Mode; onSelectMode: (mode: Mode) => void }> = ({ selectedMode, onSelectMode }) => (
  <div className="flex bg-gray-800 p-1 rounded-lg">
    {Object.values(Mode).map((mode) => (
      <button
        key={mode}
        onClick={() => onSelectMode(mode)}
        className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
          selectedMode === mode
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-transparent text-gray-300 hover:bg-gray-700'
        }`}
      >
        {mode}
      </button>
    ))}
  </div>
);

const ImageUploader: React.FC<{ onImageUpload: (file: ImageFile) => void; image: ImageFile | null }> = ({ onImageUpload, image }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onImageUpload({ base64: base64String, name: file.name, type: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="image-upload"
        className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
      >
        {image ? (
          <img src={`data:${image.type};base64,${image.base64}`} alt="preview" className="object-contain h-full w-full p-2" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
            <UploadIcon className="w-10 h-10 mb-3" />
            <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </label>
      {image && <p className="text-xs text-center text-gray-400 mt-2 truncate">Uploaded: {image.name}</p>}
    </div>
  );
};

const OutputDisplay: React.FC<{ output: string; isLoading: boolean; mode: Mode }> = ({ output, isLoading, mode }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const placeholderText = `Your generated ${mode === Mode.Captioner ? 'caption' : 'prompt'} will appear here.`;

    return (
        <div className="relative w-full min-h-[12rem] bg-gray-800 rounded-lg p-4 text-gray-300 border border-gray-700">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                </div>
            ) : (
                <>
                    {output ? (
                        <p className="whitespace-pre-wrap font-mono text-sm">{output}</p>
                    ) : (
                        <p className="text-gray-500">{placeholderText}</p>
                    )}
                    {output && (
                         <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                            {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5 text-gray-400" />}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};


export default function App() {
  const [mode, setMode] = useState<Mode>(Mode.Captioner);
  const [image, setImage] = useState<ImageFile | null>(null);
  const [triggerWord, setTriggerWord] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((file: ImageFile) => {
    setImage(file);
    setOutput('');
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!image) {
      setError('Please upload an image first.');
      return;
    }
    if (mode === Mode.Captioner && !triggerWord.trim()) {
      setError('Please enter a trigger word for the captioner.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutput('');

    try {
      let result;
      if (mode === Mode.Captioner) {
        result = await generateCaption(image.base64, image.type, triggerWord);
      } else {
        result = await generateImagePrompt(image.base64, image.type);
      }
      setOutput(result);
    } catch (e) {
      setError((e as Error).message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [image, mode, triggerWord]);

  const isButtonDisabled = useMemo(() => {
    if (isLoading) return true;
    if (!image) return true;
    if (mode === Mode.Captioner && !triggerWord.trim()) return true;
    return false;
  }, [isLoading, image, mode, triggerWord]);
  
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setOutput('');
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <main className="w-full max-w-2xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            AI Image Analyst
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Generate fine-tuning captions or detailed image prompts with Gemini.
          </p>
        </header>

        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl border border-gray-700 space-y-6">
          <ModeSelector selectedMode={mode} onSelectMode={handleModeChange} />

          <div className="space-y-4">
            <ImageUploader onImageUpload={handleImageUpload} image={image} />
            {mode === Mode.Captioner && (
              <div>
                <label htmlFor="trigger-word" className="block text-sm font-medium text-gray-300 mb-1">
                  Trigger Word
                </label>
                <input
                  id="trigger-word"
                  type="text"
                  value={triggerWord}
                  onChange={(e) => setTriggerWord(e.target.value)}
                  placeholder="e.g., myuniquestyle, char-groot"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                 <p className="text-xs text-gray-500 mt-1">A unique word to associate with the image's style or subject.</p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Generating...' : `Generate ${mode}`}
          </button>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </div>
        
        <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Output</h2>
            <OutputDisplay output={output} isLoading={isLoading} mode={mode} />
        </div>
      </main>
       <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
}
