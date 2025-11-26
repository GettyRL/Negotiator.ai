import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, Video, Radio, XOctagon } from 'lucide-react';

// Audio helpers
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const len = int16.buffer.byteLength;
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const WarRoomLive: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [logs, setLogs] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
         if (videoRef.current) {
             videoRef.current.srcObject = stream;
             videoRef.current.play();
         }
      });
      
    return () => {
        inputContextRef.current?.close();
        outputContextRef.current?.close();
    }
  }, []);

  const connect = async () => {
    if (!process.env.API_KEY) return;
    setStatus('CONNECTING');
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    inputContextRef.current = inputAudioContext;
    outputContextRef.current = outputAudioContext;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                setStatus('CONNECTED');
                setLogs(p => [...p, ">> UPLINK ESTABLISHED. BAD COP ONLINE."]);
                
                const source = inputAudioContext.createMediaStreamSource(stream);
                const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const blob = createBlob(inputData);
                    sessionPromise.then(session => session.sendRealtimeInput({ media: blob }));
                };
                
                source.connect(processor);
                processor.connect(inputAudioContext.destination);

                if (videoRef.current && canvasRef.current) {
                     const ctx = canvasRef.current.getContext('2d');
                     setInterval(() => {
                         if (!videoRef.current || !ctx) return;
                         canvasRef.current.width = videoRef.current.videoWidth;
                         canvasRef.current.height = videoRef.current.videoHeight;
                         ctx.drawImage(videoRef.current, 0, 0);
                         const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                         sessionPromise.then(session => session.sendRealtimeInput({ 
                             media: { mimeType: 'image/jpeg', data: base64 } 
                         }));
                     }, 1000); 
                }
            },
            onmessage: async (msg: LiveServerMessage) => {
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    const audioCtx = outputContextRef.current!;
                    const buffer = await decodeAudioData(decode(audioData), audioCtx);
                    const source = audioCtx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioCtx.destination);
                    const startTime = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
                    source.start(startTime);
                    nextStartTimeRef.current = startTime + buffer.duration;
                }
                if (msg.serverContent?.turnComplete) {
                    setLogs(p => [...p, ">> INCOMING TRANSMISSION..."]);
                }
            },
            onclose: () => {
                setStatus('DISCONNECTED');
                setLogs(p => [...p, ">> DISCONNECTED."]);
            },
            onerror: (err) => {
                console.error(err);
                setLogs(p => [...p, ">> ERROR: SIGNAL INTERRUPTED"]);
            }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: "You are a tough, cynical procurement negotiation coach. The user is about to enter a negotiation. Look at them (via camera) and listen to their pitch. Critique their confidence, posture, and arguments ruthlessly but helpfully.",
        }
    });
    
    sessionPromiseRef.current = sessionPromise;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 font-mono">
      <div className="w-full max-w-5xl h-[80vh] bg-cyber-dark border-2 border-neon-pink/30 relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(236,72,153,0.1)]">
        
        {/* HUD Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{
                 backgroundImage: `linear-gradient(rgba(236,72,153,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(236,72,153,0.2) 1px, transparent 1px)`,
                 backgroundSize: '50px 50px'
             }}>
        </div>

        {/* Header */}
        <div className="bg-black/80 border-b border-neon-pink/30 p-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold text-neon-pink tracking-[0.2em] flex items-center gap-2">
                <Radio className="animate-pulse" />
                WAR ROOM // COACHING LINK
            </h2>
            <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-xs text-neon-pink">
                    <span className="w-2 h-2 bg-neon-pink rounded-full"></span>
                    {status}
                 </div>
                 <button onClick={onClose} className="hover:text-white text-gray-500"><XOctagon /></button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10">
            
            {/* Video Feed */}
            <div className="flex-1 relative bg-black border border-gray-800">
                <video ref={videoRef} className="w-full h-full object-cover opacity-80" muted playsInline autoPlay />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* HUD Elements */}
                <div className="absolute top-4 left-4 text-xs text-neon-cyan font-mono border border-neon-cyan px-2 bg-black/50">CAM_01</div>
                <div className="absolute bottom-4 right-4 text-xs text-neon-cyan font-mono border border-neon-cyan px-2 bg-black/50">1080p_60</div>
                <div className="absolute inset-0 border-[20px] border-transparent border-t-neon-pink/20 border-b-neon-pink/20 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-neon-pink/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                    <div className="w-1 h-1 bg-neon-pink"></div>
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="w-80 flex flex-col gap-4">
                <div className="bg-black/50 border border-neon-pink/30 p-4 flex-1 overflow-y-auto font-mono text-xs">
                    <div className="text-gray-500 border-b border-gray-800 mb-2 pb-1">TRANSCRIPT_LOG</div>
                    {logs.map((log, i) => (
                        <div key={i} className="mb-2 text-neon-green font-bold opacity-80">> {log}</div>
                    ))}
                    {status === 'CONNECTING' && <div className="text-neon-amber animate-pulse">>> ENCRYPTING CONNECTION...</div>}
                </div>

                <div className="bg-black/50 border border-gray-800 p-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>MIC INPUT</span>
                        <span>100%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1 mb-4"><div className="w-full h-full bg-neon-green animate-pulse"></div></div>
                    
                    {status === 'DISCONNECTED' ? (
                        <button onClick={connect} className="w-full bg-neon-pink text-black font-bold py-3 hover:bg-white transition-colors flex items-center justify-center gap-2">
                            <Mic size={16} /> INITIALIZE
                        </button>
                    ) : (
                        <button onClick={onClose} className="w-full border border-red-500 text-red-500 font-bold py-3 hover:bg-red-500 hover:text-white transition-colors">
                            TERMINATE
                        </button>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};