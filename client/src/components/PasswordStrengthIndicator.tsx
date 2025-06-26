import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  onValidityChange?: (isValid: boolean) => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

export default function PasswordStrengthIndicator({ password, onValidityChange }: PasswordStrengthProps) {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([
    { label: "At least 8 characters long", test: (pwd) => pwd.length >= 8, met: false },
    { label: "Contains uppercase letter", test: (pwd) => /[A-Z]/.test(pwd), met: false },
    { label: "Contains lowercase letter", test: (pwd) => /[a-z]/.test(pwd), met: false },
    { label: "Contains number", test: (pwd) => /[0-9]/.test(pwd), met: false },
    { label: "Contains special character", test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd), met: false },
  ]);

  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState("");

  useEffect(() => {
    const updatedRequirements = requirements.map(req => ({
      ...req,
      met: req.test(password)
    }));
    
    setRequirements(updatedRequirements);
    
    const metCount = updatedRequirements.filter(req => req.met).length;
    const strengthPercent = (metCount / updatedRequirements.length) * 100;
    setStrength(strengthPercent);
    
    // Determine strength label and color
    if (metCount === 0) {
      setStrengthLabel("");
    } else if (metCount <= 2) {
      setStrengthLabel("Weak");
    } else if (metCount <= 3) {
      setStrengthLabel("Fair");
    } else if (metCount <= 4) {
      setStrengthLabel("Good");
    } else {
      setStrengthLabel("Strong");
    }
    
    const isValid = metCount === updatedRequirements.length;
    onValidityChange?.(isValid);
  }, [password, onValidityChange]);

  const getStrengthColor = () => {
    if (strength <= 40) return "bg-red-500";
    if (strength <= 60) return "bg-orange-500";
    if (strength <= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthTextColor = () => {
    if (strength <= 40) return "text-red-600";
    if (strength <= 60) return "text-orange-600";
    if (strength <= 80) return "text-yellow-600";
    return "text-green-600";
  };

  if (!password) return null;

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          {strengthLabel && (
            <span className={`text-sm font-medium ${getStrengthTextColor()}`}>
              {strengthLabel}
            </span>
          )}
        </div>
        
        <div className="relative">
          <Progress value={strength} className="h-2" />
          <div 
            className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Requirements:</h4>
        <ul className="space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center space-x-2 text-sm">
              {req.met ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className={req.met ? "text-green-700" : "text-gray-600"}>
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {strength === 100 && (
        <div className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-700 font-medium">
            Password meets all security requirements
          </span>
        </div>
      )}
    </div>
  );
}