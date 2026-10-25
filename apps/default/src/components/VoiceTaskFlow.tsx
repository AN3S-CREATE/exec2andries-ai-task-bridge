import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, AlertCircle, Brain, ArrowRight } from 'lucide-react';

interface VoiceTaskFlowProps {
  onTaskCreated: () => void;
}

type Step = 'idle' | 'listening' | 'q1' | 'q2' | 'q3' | 'creating' | 'success';

export const VoiceTaskFlow: React.FC<VoiceTaskFlowProps> = ({ onTaskCreated }) => {
  const [step, setStep] = useState<Step>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Questions based on your prompt structure
  const questions = [
    "Question 1: Who is this for and what's the context?", // Context (who/what/where)
    "Question 2: When do you need this completed?", // Deadline or urgency  
    "Question 3: What are the key deliverables or scope?" // Scope or deliverables
  ];

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setCurrentTranscript(result);
      handleSpeechResult(result);
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(`Speech error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
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
    if (!recognitionRef.current) return;
    setError('');
    setCurrentTranscript('');
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSpeechResult = (result: string) => {
    if (step === 'idle') {
      // Initial task description
      setTaskDescription(result);
      setStep('q1');
      speak(`I heard: ${result}. Now I'll ask you 3 quick questions to optimize this for Andries. ${questions[0]}`, () => {
        setTimeout(() => startListening(), 1000);
      });
    } else if (step === 'q1') {
      // Answer 1
      setAnswers([result]);
      setStep('q2');
      speak(`Got it: ${result}. ${questions[1]}`, () => {
        setTimeout(() => startListening(), 1000);
      });
    } else if (step === 'q2') {
      // Answer 2
      setAnswers(prev => [...prev, result]);
      setStep('q3');
      speak(`Perfect: ${result}. ${questions[2]}`, () => {
        setTimeout(() => startListening(), 1000);
      });
    } else if (step === 'q3') {
      // Answer 3 - now create the task
      const finalAnswers = [...answers, result];
      setAnswers(finalAnswers);
      setStep('creating');
      
      speak(`Excellent: ${result}. Let me create this structured task for Andries now.`, () => {
        createTask(finalAnswers);
      });
    }
  };

  const createTask = async (finalAnswers: string[]) => {
    try {
      // Create task with all the information following your prompt structure
      const taskData = {
        taskTitle: taskDescription,
        taskDescription: `🎤 Voice-Created Task with AI Questions

📋 MAIN TASK: ${taskDescription}

🤖 AI-GENERATED CLARIFICATIONS:
1. Context: ${finalAnswers[0]}
2. Deadline/Urgency: ${finalAnswers[1]}  
3. Scope/Deliverables: ${finalAnswers[2]}

📊 TASK DETAILS:
• Created via Voice Input
• Optimized for Andries' expertise
• Ready for intelligent structuring

🧠 Generated by 3-Question AI Flow`,
        priority: finalAnswers[1].toLowerCase().includes('urgent') || finalAnswers[1].toLowerCase().includes('asap') ? 'urgent' : 'medium',
        category: determineCategory(taskDescription),
        deadline: extractDeadline(finalAnswers[1])
      };

      const response = await fetch('/api/taskade/forms/01K577Z1B3S1PWFTVQZ30QCGWV/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        setStep('success');
        speak('Perfect! Your task has been created with all the details and assigned to Andries. You can find it in the dashboard.', () => {
          onTaskCreated();
        });
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      setError('Failed to create task');
      speak('Sorry, there was an error creating your task. Please try again.');
      setStep('idle');
    }
  };

  const determineCategory = (task: string): string => {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('sales') || taskLower.includes('client') || taskLower.includes('deal')) return 'sales';
    if (taskLower.includes('marketing') || taskLower.includes('campaign') || taskLower.includes('brand')) return 'marketing';
    if (taskLower.includes('training') || taskLower.includes('onboard') || taskLower.includes('teach')) return 'training';
    if (taskLower.includes('event') || taskLower.includes('meeting') || taskLower.includes('conference')) return 'events';
    return 'business-growth';
  };

  const extractDeadline = (deadlineText: string): string | undefined => {
    const text = deadlineText.toLowerCase();
    if (text.includes('today')) return new Date().toISOString();
    if (text.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    }
    if (text.includes('week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString();
    }
    return undefined;
  };

  const reset = () => {
    setStep('idle');
    setTaskDescription('');
    setAnswers([]);
    setCurrentTranscript('');
    setError('');
    stopSpeaking();
    stopListening();
  };

  const getStepInfo = () => {
    switch (step) {
      case 'idle': return { title: 'Ready', desc: 'Click mic and describe your task' };
      case 'listening': return { title: 'Listening', desc: 'Speak clearly...' };
      case 'q1': return { title: 'Question 1/3', desc: 'Context & who it\'s for' };
      case 'q2': return { title: 'Question 2/3', desc: 'Deadline & urgency' };
      case 'q3': return { title: 'Question 3/3', desc: 'Scope & deliverables' };
      case 'creating': return { title: 'Creating Task', desc: 'Structuring for Andries...' };
      case 'success': return { title: 'Complete!', desc: 'Task created successfully' };
      default: return { title: '', desc: '' };
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Voice Not Supported</h2>
        <p className="text-gray-600">Please use Chrome, Edge, or Safari for voice features.</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Voice Task Created!</h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
          <p className="font-semibold text-gray-900 mb-2">Task: {taskDescription}</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Context:</strong> {answers[0]}</p>
            <p><strong>Deadline:</strong> {answers[1]}</p>
            <p><strong>Scope:</strong> {answers[2]}</p>
          </div>
        </div>
        <button
          onClick={reset}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Create Another Task
        </button>
      </div>
    );
  }

  const stepInfo = getStepInfo();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Mic className="h-8 w-8 text-purple-600" />
          <Brain className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Voice Task Flow</h2>
        <p className="text-gray-600">Speak your task → Answer 3 questions → Task created</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Progress */}
      <div className="bg-gray-50 p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-900">{stepInfo.title}</span>
          <span className="text-sm text-gray-600">{stepInfo.desc}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: step === 'idle' ? '0%' :
                     step === 'q1' ? '25%' :
                     step === 'q2' ? '50%' :
                     step === 'q3' ? '75%' :
                     step === 'creating' ? '90%' :
                     '100%'
            }}
          />
        </div>

        {taskDescription && (
          <div className="bg-blue-50 p-3 rounded-lg mb-3">
            <p className="text-sm font-medium text-blue-900">Task: {taskDescription}</p>
          </div>
        )}

        {currentTranscript && (
          <div className="bg-green-50 p-3 rounded-lg mb-3">
            <p className="text-sm font-medium text-green-900">You said: "{currentTranscript}"</p>
          </div>
        )}

        {answers.length > 0 && (
          <div className="space-y-2">
            {answers.map((answer, index) => (
              <div key={index} className="bg-purple-50 p-2 rounded text-sm">
                <span className="font-medium text-purple-900">Q{index + 1}:</span>
                <span className="text-purple-800 ml-2">{answer}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={step === 'creating' || isSpeaking}
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
      <div className="bg-blue-50 p-4 rounded-xl mb-4">
        <h4 className="font-semibold text-blue-900 mb-2">3-Question AI Flow:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-3 w-3" />
            <span>1. Context (who/what/where)</span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-3 w-3" />
            <span>2. Deadline or urgency</span>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-3 w-3" />
            <span>3. Scope or deliverables</span>
          </div>
        </div>
      </div>

      {step !== 'idle' && step !== 'success' && (
        <div className="text-center">
          <button
            onClick={reset}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};