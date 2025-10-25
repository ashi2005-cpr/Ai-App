
import { FileData } from '../types';

export const fileToGenerativePart = async (file: File): Promise<FileData> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    base64: await base64EncodedDataPromise,
    mimeType: file.type,
    name: file.name
  };
};

export const extractVideoFrames = (
  videoFile: File,
  maxFrames: number,
  intervalSeconds: number
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        return reject(new Error('Could not get canvas context.'));
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const frames: string[] = [];
      let currentTime = 0;
      const duration = video.duration;

      video.onseeked = () => {
        if (frames.length >= maxFrames || currentTime > duration) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        frames.push(dataUrl.split(',')[1]);

        currentTime += intervalSeconds;
        if (currentTime <= duration) {
          video.currentTime = currentTime;
        } else {
           URL.revokeObjectURL(video.src);
           resolve(frames);
        }
      };

      video.currentTime = 0;
    };
    video.onerror = (e) => {
      reject(e);
    };
  });
};

// Audio decoding utilities
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
