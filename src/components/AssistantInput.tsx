
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AssistantState } from '@/types';
import { toast } from 'sonner';

interface AssistantInputProps {
  onInputSubmit: (input: string) => void;
  state: AssistantState;
  isListening: boolean;
  toggleListening: () => void;
  placeholder?: string;
}

const AssistantInput: React.FC<AssistantInputProps> = ({
  onInputSubmit,
  state,
  isListening,
  toggleListening,
  placeholder = "Ask me anything..."
}) => {
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      onInputSubmit(textInput.trim());
      setTextInput('');
    }
  };
  
  useEffect(() => {
    // Focus the input when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };
  
  const getMicButtonColor = () => {
    if (state === 'listening') return 'bg-red-500 hover:bg-red-600';
    if (isListening) return 'bg-primary hover:bg-primary/90';
    return 'bg-secondary hover:bg-secondary/90';
  };
  
  const MicIcon = isListening ? Mic : MicOff;

  return (
    <form onSubmit={handleSubmit} className="relative w-full flex items-center">
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={state === 'processing' || state === 'speaking'}
          className="pr-12 pl-4 py-6 text-base rounded-full glass-morphism focus-visible:ring-primary"
        />
        <Button
          type="button"
          onClick={toggleListening}
          disabled={state === 'processing'}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full w-10 h-10 p-0 ${getMicButtonColor()} transition-colors`}
          aria-label={isListening ? "Stop listening" : "Start listening"}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          <MicIcon className="h-5 w-5" />
          {state === 'listening' && (
            <span className="absolute w-full h-full rounded-full pulse-animation"></span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default AssistantInput;
