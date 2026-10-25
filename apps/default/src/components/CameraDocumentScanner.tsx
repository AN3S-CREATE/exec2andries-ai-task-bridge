import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, RotateCw, Zap, FileText, Loader2, AlertCircle } from 'lucide-react';

interface CameraDocumentScannerProps {
  onScanComplete: (extractedText: string) => void;
  onClose: () => void;
}

export const CameraDocumentScanner: React.FC<CameraDocumentScannerProps> = ({ onScanComplete, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage(imageData);
        stopCamera();
        processImage(imageData);
      }
    }
  }, [stopCamera]);

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setError('');

    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Create FormData for OCR processing
      const formData = new FormData();
      formData.append('image', blob, 'document.jpg');

      // Call OCR API (using a free OCR service or Taskade's AI)
      // For now, we'll use browser's experimental OCR or fall back to manual input
      const text = await performOCR(blob);
      
      if (text) {
        setExtractedText(text);
      } else {
        setError('No text detected. Please try again with better lighting.');
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setError('Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const performOCR = async (blob: Blob): Promise<string> => {
    try {
      // Option 1: Use Tesseract.js (client-side OCR)
      // For production, we'd use: const { createWorker } = await import('tesseract.js');
      // For now, simulate OCR with AI-powered text extraction
      
      // Option 2: Call Taskade AI to extract text from image
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      const base64Image = await base64Promise;
      
      // Simulate OCR response (in production, call actual OCR API)
      // This would be replaced with actual Taskade AI call
      return simulateOCR(base64Image);
    } catch (err) {
      throw new Error('OCR processing failed');
    }
  };

  const simulateOCR = (imageData: string): string => {
    // Placeholder - in production this calls Taskade AI or OCR service
    // For demo purposes, return sample extracted text
    return 'Extracted text from document will appear here after AI processing';
  };

  const handleConfirm = () => {
    if (extractedText) {
      onScanComplete(extractedText);
      onClose();
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setExtractedText('');
    setError('');
    startCamera();
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-6 w-6 text-cyan-400" />
            <h3 className="text-white font-semibold">Document Scanner</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 bg-gray-800/50 rounded-full hover:bg-gray-700/50 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Camera View or Captured Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Scanning Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-cyan-400 rounded-xl w-[90%] h-[70%] shadow-2xl">
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl"></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-32 left-0 right-0 text-center px-4">
              <div className="bg-black/70 rounded-xl p-4 mx-auto max-w-md">
                <p className="text-white text-sm">
                  Position document within frame<br />
                  Ensure good lighting and focus
                </p>
              </div>
            </div>

            {/* Capture Button */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <button
                onClick={capturePhoto}
                disabled={!isScanning}
                className="relative bg-gradient-to-r from-cyan-500 to-purple-500 p-1 rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-black p-6 rounded-full">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <img
              src={capturedImage}
              alt="Captured document"
              className="w-full h-full object-contain"
            />
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                <Loader2 className="h-16 w-16 text-cyan-400 animate-spin mb-4" />
                <p className="text-white text-lg">Processing document...</p>
                <p className="text-gray-400 text-sm mt-2">AI is extracting text</p>
              </div>
            )}

            {/* Extracted Text Display */}
            {extractedText && !isProcessing && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-6 max-h-[60%] overflow-y-auto">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-cyan-400" />
                    <h4 className="text-white font-semibold">Extracted Text:</h4>
                  </div>
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="w-full bg-transparent text-white text-sm leading-relaxed resize-none focus:outline-none min-h-[120px]"
                      placeholder="Extracted text will appear here..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={retake}
                    className="flex items-center justify-center space-x-2 bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                  >
                    <RotateCw className="h-5 w-5" />
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all"
                  >
                    <Check className="h-5 w-5" />
                    <span>Use Text</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && !isProcessing && (
              <div className="absolute bottom-8 left-4 right-4">
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button
                      onClick={retake}
                      className="mt-2 text-xs text-red-300 underline hover:text-red-200"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};