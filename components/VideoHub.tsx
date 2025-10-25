
import React, { useState, useEffect, useCallback } from 'react';
import { Operation } from '@google/genai';
import * as geminiService from '../services/geminiService';
import { FileData } from '../types';
import { extractVideoFrames } from '../utils/fileUtils';
import Spinner from './common/Spinner';
import FileUpload from './common/FileUpload';
import { useVeoApiKey } from '../hooks/useVeoApiKey';
import { ScanIcon, VideoIcon } from './common/Icon';

type VideoMode = 'generate' | 'analyze';

const VEO_GENERATION_MESSAGES = [
    "Warming up the digital director's chair...",
    "Choreographing pixels into motion...",
    "Storyboarding your vision...",
    "Rendering scenes, this may take a moment...",
    "Applying final touches to your masterpiece...",
];

const VideoHub: React.FC = () => {
    const [mode, setMode] = useState<VideoMode>('generate');
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<FileData | null>(null);
    const [videoFile, setVideoFile] = useState<FileData | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [result, setResult] = useState<{ text?: string; videoUrl?: string }>({});

    const { hasKey, isChecking, selectKey, handleApiError } = useVeoApiKey();

    const resetState = () => {
        setPrompt('');
        setImage(null);
        setVideoFile(null);
        setError('');
        setResult({});
    };

    const handleModeChange = (newMode: VideoMode) => {
        setMode(newMode);
        resetState();
    };

    const pollOperation = useCallback(async (operation: Operation) => {
        let currentOperation = operation;
        let messageIndex = 0;

        const updateMessage = () => {
            setLoadingMessage(VEO_GENERATION_MESSAGES[messageIndex % VEO_GENERATION_MESSAGES.length]);
            messageIndex++;
        };
        updateMessage();
        const intervalId = setInterval(updateMessage, 5000);

        while (!currentOperation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            try {
                 currentOperation = await geminiService.checkVideoOperation(currentOperation);
            } catch(err: any) {
                 if(err.message?.includes("Requested entity was not found.")){
                    handleApiError();
                    throw new Error("API Key is invalid or not found. Please select a valid key.");
                }
                throw err;
            }
        }
        clearInterval(intervalId);
        return currentOperation;
    }, [handleApiError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setResult({});
        setLoadingMessage('');

        try {
            if (mode === 'generate') {
                if (!prompt && !image) {
                    setError('A prompt or an image is required for video generation.');
                    return;
                }
                const initialOperation = await geminiService.generateVideo(prompt, aspectRatio, image);
                const finalOperation = await pollOperation(initialOperation);
                const videoUrl = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
                if (videoUrl && process.env.API_KEY) {
                    setResult({ videoUrl: `${videoUrl}&key=${process.env.API_KEY}` });
                } else {
                     throw new Error('Video generation finished, but no video URL was returned.');
                }

            } else if (mode === 'analyze') {
                if (!videoFile) {
                    setError('A video file is required for analysis.');
                    return;
                }
                setLoadingMessage('Extracting frames from video...');
                // The raw file object is needed here, which we don't store. This is a simplification.
                // In a real app, we'd manage the File object itself.
                const fileInput = document.getElementById('file-input-Upload Video') as HTMLInputElement;
                if (!fileInput.files || fileInput.files.length === 0) {
                     throw new Error("Could not find the uploaded video file to process.");
                }
                const frames = await extractVideoFrames(fileInput.files[0], 16, 1);
                setLoadingMessage('Analyzing video frames with Gemini...');
                const response = await geminiService.analyzeVideo(prompt || 'Summarize this video.', frames);
                setResult({ text: response.text });
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const isSubmitDisabled = isLoading || (mode === 'generate' && (!prompt && !image)) || (mode === 'analyze' && !videoFile);

    if (isChecking) {
        return <div className="flex items-center justify-center h-full"><Spinner /></div>;
    }
    
    const renderApiKeyPrompt = () => (
        <div className="text-center p-8 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-2">API Key Required for Veo</h3>
            <p className="text-gray-400 mb-4">Video generation requires a valid API key. Please select one to continue.</p>
            <p className="text-xs text-gray-500 mb-4">A link to the billing documentation can be found <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">here</a>.</p>
            <button onClick={selectKey} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                Select API Key
            </button>
        </div>
    );
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 md:p-8">
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg flex flex-col">
                <div className="flex items-center border-b border-gray-700 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-white">Video Hub</h2>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-6">
                    {['generate', 'analyze'].map(m => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m as VideoMode)}
                            className={`flex items-center justify-center p-2 rounded-md text-sm font-semibold transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                          {m === 'generate' ? <VideoIcon className="h-5 w-5 mr-2" /> : <ScanIcon className="h-5 w-5 mr-2" />}
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>

                { (mode === 'generate' && !hasKey) ? renderApiKeyPrompt() : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                       {mode === 'generate' && (
                        <>
                            <FileUpload label="Upload Starting Image (optional)" accept="image/*" onFileUpload={setImage} />
                             <div>
                                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
                                <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A neon hologram of a cat driving" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md p-2 h-24 text-white" />
                            </div>
                            <div>
                                <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300">Aspect Ratio</label>
                                <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md p-2 text-white">
                                    <option value="16:9">16:9 (Landscape)</option>
                                    <option value="9:16">9:16 (Portrait)</option>
                                </select>
                            </div>
                        </>
                       )}
                       {mode === 'analyze' && (
                        <>
                            <FileUpload label="Upload Video" accept="video/*" onFileUpload={setVideoFile} />
                             <div>
                                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Analysis Prompt (optional)</label>
                                <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., What are the key objects in this video?" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md p-2 h-24 text-white" />
                            </div>
                        </>
                       )}

                        <button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Spinner size="sm" /> : `Run ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
                        </button>
                    </form>
                )}
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-lg flex flex-col items-center justify-center min-h-[400px]">
                {isLoading && (
                    <div className="text-center">
                        <Spinner size="lg" />
                        <p className="mt-4 text-lg text-gray-300">{loadingMessage}</p>
                    </div>
                )}
                {error && <p className="text-red-400 text-center">{error}</p>}
                {!isLoading && !error && result.videoUrl && (
                    <video src={result.videoUrl} controls autoPlay loop className="max-w-full max-h-[80vh] rounded-lg" />
                )}
                {!isLoading && !error && result.text && (
                    <div className="prose prose-invert text-gray-200 p-4 bg-gray-900 rounded-md overflow-y-auto max-h-[80vh]">
                        <p>{result.text}</p>
                    </div>
                )}
                 {!isLoading && !error && !result.videoUrl && !result.text && (
                     <div className="text-center text-gray-500">
                        <VideoIcon className="h-16 w-16 mx-auto mb-4"/>
                        <p>Your generated content will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoHub;
