import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/CodeVerification.css';

const CodeVerification = ({ 
  onVerify, 
  isLoading = false, 
  error = null, 
  placeholder = "Enter 6-digit code",
  title = "Family Code Verification"
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [showCode, setShowCode] = useState(false);

  const handleInputChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      }
    }

    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          setCode(digits.split(''));
          handleSubmit(digits);
        }
      });
    }
  };

  const handleSubmit = async (codeString = null) => {
    const finalCode = codeString || code.join('');
    if (finalCode.length === 6 && onVerify) {
      await onVerify(finalCode);
    }
  };

  const clearCode = () => {
    setCode(['', '', '', '', '', '']);
    document.getElementById('code-input-0')?.focus();
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <div className="code-verification">
      <h3 className="code-title">{title}</h3>
      
      <div className="code-input-container">
        <div className="code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-input-${index}`}
              type={showCode ? "text" : "password"}
              className={`code-input ${error ? 'error' : ''} ${digit ? 'filled' : ''}`}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              maxLength={1}
              disabled={isLoading}
              autoComplete="off"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          ))}
        </div>

        <div className="code-actions">
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowCode(!showCode)}
            title={showCode ? "Hide code" : "Show code"}
          >
            {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          
          <button
            type="button"
            className="clear-code"
            onClick={clearCode}
            disabled={!isCodeComplete || isLoading}
            title="Clear code"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="code-error" role="alert">
          {error}
        </div>
      )}

      <button
        type="button"
        className={`verify-button ${isCodeComplete ? 'ready' : ''}`}
        onClick={() => handleSubmit()}
        disabled={!isCodeComplete || isLoading}
      >
        {isLoading ? 'Verifying...' : 'Verify Code'}
      </button>

      <div className="code-help">
        <p>Enter the 6-digit family code shared by your family member</p>
      </div>
    </div>
  );
};

export default CodeVerification;
