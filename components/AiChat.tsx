
import React, { useState, useRef, useEffect } from 'react';
// FIX: Import Chat type for stateful chat sessions.
import { Chat } from '@google/genai';
import * as geminiService from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/fileUtils';
import { ChatModel, ChatMessage } from '../types';
import Spinner from './common/Spinner';
import { Volume2Icon } from './common/Icon';

// FIX: Moved modelOptions outside component for use in useEffect.
const modelOptions = [
    { key: ChatModel.FLASH_LITE, label: "Speedy (Flash Lite)" },
    { key: ChatModel.FLASH, label: "Balanced (Flash)" },
    { key: ChatModel.PRO_THINKING, label: "Advanced (Pro + Thinking)" }
];

const AiChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [model, setModel] = useState<ChatModel>(ChatModel.FLASH_LITE);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // FIX: Use a ref to store the stateful chat instance.
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // FIX: Create a new chat session when the model changes and reset history.
    useEffect(() => {
        const useThinking = model === ChatModel.PRO_THINKING;
        chatRef.current = geminiService.createChat(model, useThinking);
        const modelName = modelOptions.find(opt => opt.key === model)?.label || 'the selected';
        setMessages([
            { role: 'model', text: `Hello! The ${modelName} model is ready. How can I assist you?` }
        ]);
    }, [model]);

    const playAudio = async (base64Audio: string) => {
        if (!audioContextRef.current) {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
    };

    // FIX: Updated handleSubmit to use the stateful chat instance.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage = input;
        const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMessage }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError('');

        try {
            const response = await chatRef.current.sendMessage({ message: userMessage });
            
            setMessages(prev => [...prev, { role: 'model', text: response.text }]);

            if (ttsEnabled) {
                const speechResponse = await geminiService.generateSpeech(response.text);
                const audioPart = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
                if (audioPart) {
                    await playAudio(audioPart.data);
                }
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred.');
            setMessages(prev => [...prev, { role: 'model', text: `Sorry, I encountered an error: ${err.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto p-4">
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-800/50 rounded-xl shadow-lg">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                             {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0"></div>}
                            <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0"></div>
                            <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200">
                                <Spinner size="sm" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-xl shadow-lg">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                         <label htmlFor="model-select" className="text-sm font-medium text-gray-300">Model:</label>
                         <select id="model-select" value={model} onChange={(e) => setModel(e.target.value as ChatModel)} className="bg-gray-700 text-white text-sm rounded-md p-1 border-gray-600 focus:ring-blue-500 focus:border-blue-500">
                             {modelOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                         </select>
                    </div>
                     <button onClick={() => setTtsEnabled(!ttsEnabled)} className={`p-2 rounded-full transition-colors ${ttsEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`} title="Enable Text-to-Speech">
                         <Volume2Icon className="h-5 w-5"/>
                     </button>
                 </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiChat;
