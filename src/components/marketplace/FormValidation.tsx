import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Validation rule type
 */
export interface ValidationRule {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  custom?: (value: string) => boolean;
  message: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  rules: {
    [key: string]: {
      passed: boolean;
      message: string;
    };
  };
}

/**
 * Validate a value against multiple rules
 */
export const validateField = (
  value: string,
  rules: { [key: string]: ValidationRule }
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    rules: {},
  };

  for (const [key, rule] of Object.entries(rules)) {
    let passed = true;
    let message = rule.message;

    if (rule.required && !value.trim()) {
      passed = false;
      message = "This field is required";
    } else if (value.trim()) {
      if (rule.pattern && !rule.pattern.test(value)) {
        passed = false;
      } else if (
        rule.minLength &&
        value.length < rule.minLength
      ) {
        passed = false;
        message = `Minimum ${rule.minLength} characters required`;
      } else if (
        rule.maxLength &&
        value.length > rule.maxLength
      ) {
        passed = false;
        message = `Maximum ${rule.maxLength} characters allowed`;
      } else if (rule.custom && !rule.custom(value)) {
        passed = false;
      }
    }

    result.rules[key] = { passed, message };

    if (!passed) {
      result.isValid = false;
    }
  }

  return result;
};

/**
 * Password strength validator
 */
export const validatePasswordStrength = (
  password: string
): {
  score: number;
  strength: "weak" | "fair" | "good" | "strong";
  feedback: string;
} => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score++;
  else feedback.push("At least 8 characters");

  if (password.length >= 12) score++;
  else if (password.length >= 8) feedback.push("12+ characters recommended");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Add uppercase letters");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Add numbers");

  if (/[!@#$%^&*]/.test(password)) score++;
  else feedback.push("Add special characters (!@#$%^&*)");

  const strengthMap = [
    "weak",
    "weak",
    "fair",
    "good",
    "good",
    "strong",
    "strong",
  ] as const;

  return {
    score,
    strength: strengthMap[score],
    feedback: feedback.join(", "),
  };
};

/**
 * Input field with real-time validation feedback
 */
export interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  rules?: { [key: string]: ValidationRule };
  helperText?: string;
  showValidationFeedback?: boolean;
  onValidationChange?: (result: ValidationResult) => void;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      label,
      required,
      rules,
      helperText,
      showValidationFeedback = true,
      onValidationChange,
      onChange,
      onBlur,
      className,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState(props.value || "");
    const [isTouched, setIsTouched] = useState(false);
    const [validation, setValidation] = useState<ValidationResult | null>(null);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);

        if (rules && showValidationFeedback) {
          const result = validateField(newValue, rules);
          setValidation(result);
          onValidationChange?.(result);
        }

        onChange?.(e);
      },
      [rules, showValidationFeedback, onChange, onValidationChange]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsTouched(true);
        onBlur?.(e);
      },
      [onBlur]
    );

    const isValid = validation?.isValid ?? true;
    const showError = !isValid && isTouched;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id || props.name}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "transition-colors",
            showError && "border-red-500 focus:ring-red-500",
            !showError && isValid && isTouched && "border-green-500 focus:ring-green-500",
            className
          )}
          {...props}
        />
        {showValidationFeedback && validation && isTouched && (
          <div className="space-y-1">
            {Object.entries(validation.rules).map(
              ([key, rule]) => {
                if (!rule.passed) {
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-sm text-red-600"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {rule.message}
                    </div>
                  );
                }
                return null;
              }
            )}
            {isValid && isTouched && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Looks good!
              </div>
            )}
          </div>
        )}
        {helperText && !showError && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

/**
 * Password input with strength indicator
 */
export interface PasswordInputProps
  extends Omit<ValidatedInputProps, "type"> {
  showStrengthIndicator?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      showStrengthIndicator = true,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof validatePasswordStrength> | null>(null);
    const [value, setValue] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (showStrengthIndicator) {
        const strength = validatePasswordStrength(newValue);
        setPasswordStrength(strength);
      }

      onChange?.(e);
    };

    const strengthColor = {
      weak: "bg-red-500",
      fair: "bg-yellow-500",
      good: "bg-blue-500",
      strong: "bg-green-500",
    };

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id || props.name}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={handleChange}
            {...props}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {showStrengthIndicator && passwordStrength && value && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < passwordStrength.score
                      ? strengthColor[passwordStrength.strength]
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Strength: <span className="font-semibold">{passwordStrength.strength}</span>
            </p>
            {passwordStrength.feedback && (
              <p className="text-sm text-gray-500">
                {passwordStrength.feedback}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

/**
 * Form validation rules presets
 */
export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  phone: {
    pattern: /^[\d\s\-\(\)]+$/,
    minLength: 10,
    message: "Please enter a valid phone number",
  },
  zip: {
    pattern: /^\d{5}(-\d{4})?$/,
    message: "Please enter a valid zip code (e.g., 12345 or 12345-6789)",
  },
  url: {
    pattern:
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    message: "Please enter a valid URL",
  },
  username: {
    pattern: /^[a-zA-Z0-9_-]{3,20}$/,
    message:
      "Username must be 3-20 characters and contain only letters, numbers, hyphens, or underscores",
  },
  password: {
    minLength: 8,
    message: "Password must be at least 8 characters",
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: "Name must be 2-50 characters and contain only letters, spaces, hyphens, or apostrophes",
  },
};

/**
 * Common validation fields
 */
export const commonValidations = {
  email: {
    required: { required: true, message: "Email is required" },
    format: validationRules.email,
  },
  password: {
    required: { required: true, message: "Password is required" },
    minLength: { minLength: 8, message: "Password must be at least 8 characters" },
  },
  phone: {
    required: { required: true, message: "Phone number is required" },
    format: validationRules.phone,
  },
  name: {
    required: { required: true, message: "Name is required" },
    format: validationRules.name,
  },
};
