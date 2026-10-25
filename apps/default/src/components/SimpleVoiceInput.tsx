import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, AlertCircle, Brain, Play, Pause } from 'lucide-react';

interface SimpleVoiceInputProps {
  onTaskCreated: () => void;
}

export const SimpleVoiceInput: React.FC<SimpleVoiceInputProps> = ({ onTaskCreated }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentStep, setCurrentStep] = useState<'idle' | 'listening' | 'processing' | 'success'>('idle');
  const [error, setError] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Check browser support
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  useEffect(() => {
    if (!isSupported) return;

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setTaskDescription(result);
      handleVoiceResult(result);
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      setCurrentStep('idle');
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string, callback?: () => void) => {
    if (!synthRef.current) {
      if (callback) callback();
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported');
      return;
    }

    setError('');
    setTranscript('');
    setIsListening(true);
    setCurrentStep('listening');
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      setError('Failed to start listening');
      setIsListening(false);
      setCurrentStep('idle');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceResult = async (result: string) => {
    setCurrentStep('processing');
    
    speak(`I heard: ${result}. Let me create this task for Andries.`, async () => {
      try {
        // Create the task directly using the form API
        const taskData = {
          taskTitle: result,
          taskDescription: `🎤 Voice-created task: ${result}`,
          priority: 'medium',
          category: 'business-growth'
        };

        const response = await fetch('/api/taskade/forms/01K577Z1B3S1PWFTVQZ30QCGWV/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        if (response.ok) {
          setCurrentStep('success');
          speak('Perfect! Your task has been created and assigned to Andries. You can find it in the dashboard.', () => {
            onTaskCreated();
          });
        } else {
          throw new Error('Failed to create task');
        }
      } catch (error) {
        console.error('Error creating task:', error);
        setError('Failed to create task');
        speak('Sorry, there was an error creating your task. Please try again.');
        setCurrentStep('idle');
      }
    });
  };

  const reset = () => {
    setCurrentStep('idle');
    setTranscript('');
    setTaskDescription('');
    setError('');
    stopSpeaking();
    stopListening();
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-yellow-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Not Supported</h2>
        <p className="text-gray-600 mb-6">
          Please use Chrome, Edge, or Safari for voice input features.
        </p>
      </div>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Task Created!</h2>
        <p className="text-gray-600 mb-4">
          Task: "{taskDescription}"
        </p>
        <p className="text-gray-600 mb-6">
          Successfully created and assigned to Andries.
        </p>
        <button
          onClick={reset}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Create Another Task
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Mic className="h-8 w-8 text-purple-600" />
          <Brain className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Simple Voice Input</h2>
        <p className="text-gray-600">Click the microphone and describe your task</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Status */}
      <div className="bg-gray-50 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className="text-sm text-gray-600">
            {currentStep === 'idle' && 'Ready to listen'}
            {currentStep === 'listening' && 'Listening...'}
            {currentStep === 'processing' && 'Creating task...'}
          </span>
        </div>
        
        {transcript && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">You said:</p>
            <p className="text-sm text-blue-800">"{transcript}"</p>
          </div>
        )}
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={currentStep === 'processing'}
          className={`p-6 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
          }`}
        >
          {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </button>

        <button
          onClick={isSpeaking ? stopSpeaking : undefined}
          disabled={!isSpeaking}
          className={`p-4 rounded-full transition-all ${
            isSpeaking
              ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {isSpeaking ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-xl">
        <h4 className="font-semibold text-blue-900 mb-2">How to use:</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Click the microphone button</li>
          <li>2. Speak your task clearly</li>
          <li>3. Wait for confirmation</li>
          <li>4. Task will be created automatically</li>
        </ol>
      </div>

      {currentStep !== 'idle' && (
        <div className="text-center mt-6">
          <button
            onClick={reset}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};