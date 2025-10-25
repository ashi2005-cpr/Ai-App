
import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { FileData, AspectRatio } from '../types';
import Spinner from './common/Spinner';
import FileUpload from './common/FileUpload';
import { ImageIcon, ScanIcon, BrushIcon, CombineIcon } from './common/Icon';

type ImageMode = 'generate' | 'analyze' | 'edit' | 'merge';

const ImageStudio: React.FC = () => {
    const [mode, setMode] = useState<ImageMode>('generate');
    const [prompt, setPrompt] = useState('');
    const [image1, setImage1] = useState<FileData | null>(null);
    const [image2, setImage2] = useState<FileData | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ text?: string; imageUrl?: string }>({});

    const resetState = () => {
        setPrompt('');
        setImage1(null);
        setImage2(null);
        setError('');
        setResult({});
    };

    const handleModeChange = (newMode: ImageMode) => {
        setMode(newMode);
        resetState();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitDisabled) return;

        setIsLoading(true);
        setError('');
        setResult({});

        try {
            switch (mode) {
                case 'generate':
                    if (!prompt) {
                        setError('A prompt is required for image generation.');
                        setIsLoading(false);
                        return;
                    }
                    const base64Image = await geminiService.generateImage(prompt, aspectRatio);
                    setResult({ imageUrl: `data:image/jpeg;base64,${base64Image}` });
                    break;

                case 'analyze':
                    if (!image1) {
                        setError('An image is required for analysis.');
                        setIsLoading(false);
                        return;
                    }
                    const analyzeResponse = await geminiService.analyzeImage(prompt || 'Describe this image.', image1);
                    setResult({ text: analyzeResponse.text });
                    break;
                
                case 'edit':
                    if (!image1 || !prompt) {
                        setError('An image and a prompt are required for editing.');
                        setIsLoading(false);
                        return;
                    }
                    const editResponse = await geminiService.editImage(prompt, image1);
                    const editedImagePart = editResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    if (editedImagePart?.inlineData) {
                        setResult({ imageUrl: `data:${editedImagePart.inlineData.mimeType};base64,${editedImagePart.inlineData.data}` });
                    } else {
                        throw new Error('Image editing did not return an image.');
                    }
                    break;
                
                case 'merge':
                     if (!image1 || !image2 || !prompt) {
                        setError('Two images and a prompt are required for merging.');
                        setIsLoading(false);
                        return;
                    }
                    const mergeResponse = await geminiService.mergeImages(prompt, image1, image2);
                    const mergedImagePart = mergeResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    if (mergedImagePart?.inlineData) {
                        setResult({ imageUrl: `data:${mergedImagePart.inlineData.mimeType};base64,${mergedImagePart.inlineData.data}` });
                    } else {
                         throw new Error('Image merging did not return an image.');
                    }
                    break;
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const isSubmitDisabled = isLoading ||
        (mode === 'generate' && !prompt) ||
        (mode === 'analyze' && !image1) ||
        (mode === 'edit' && (!image1 || !prompt)) ||
        (mode === 'merge' && (!image1 || !image2 || !prompt));
    
    const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    
    const modes = [
        { key: 'generate', label: 'Generate', icon: <ImageIcon className="h-5 w-5 mr-2" /> },
        { key: 'analyze', label: 'Analyze', icon: <ScanIcon className="h-5 w-5 mr-2" /> },
        { key: 'edit', label: 'Edit', icon: <BrushIcon className="h-5 w-5 mr-2" /> },
        { key: 'merge', label: 'Merge', icon: <CombineIcon className="h-5 w-5 mr-2" /> }
    ];

    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 md:p-8">
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg flex flex-col">
                 <div className="flex items-center border-b border-gray-700 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-white">Image Studio</h2>
                </div>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                    {modes.map(m => (
                        <button
                            key={m.key}
                            onClick={() => handleModeChange(m.key as ImageMode)}
                            className={`flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${mode === m.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          {m.icon}
                          {m.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {mode !== 'generate' && (
                        <FileUpload label={mode === 'merge' ? "Upload Image 1" : "Upload Image"} accept="image/*" onFileUpload={setImage1} />
                    )}
                    {mode === 'merge' && (
                        <FileUpload label="Upload Image 2" accept="image/*" onFileUpload={setImage2} />
                    )}
                    
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
                        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={
                            mode === 'generate' ? "e.g., A photorealistic image of a cat in a spacesuit on Mars.\nA logo for a coffee shop called 'The Daily Grind', minimalist and modern.\nAn oil painting of a sun-drenched Italian coastline." :
                            mode === 'edit' ? "e.g., Make the cat's spacesuit red" :
                            mode === 'merge' ? "e.g., Combine these two images into a surreal landscape" :
                            "e.g., Describe this image in detail (optional for analysis)"
                        } className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md p-2 h-24 text-white" />
                    </div>

                    {mode === 'generate' && (
                        <div>
                            <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300">Aspect Ratio</label>
                            <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md p-2 text-white">
                                {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Spinner size="sm" /> : `Run ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
                    </button>
                </form>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center min-h-[400px]">
                {isLoading && (
                    <div className="text-center">
                        <Spinner size="lg" />
                        <p className="mt-4 text-lg text-gray-300">Processing...</p>
                    </div>
                )}
                {error && <p className="text-red-400 text-center">{error}</p>}
                {!isLoading && !error && result.imageUrl && (
                    <img src={result.imageUrl} alt="Generated result" className="max-w-full max-h-[80vh] rounded-lg" />
                )}
                {!isLoading && !error && result.text && (
                    <div className="prose prose-invert text-gray-200 p-4 bg-gray-900 rounded-md overflow-y-auto max-h-[80vh]">
                        <p>{result.text}</p>
                    </div>
                )}
                 {!isLoading && !error && !result.imageUrl && !result.text && (
                     <div className="text-center text-gray-500">
                        <ImageIcon className="h-16 w-16 mx-auto mb-4"/>
                        <p>Your generated content will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageStudio;