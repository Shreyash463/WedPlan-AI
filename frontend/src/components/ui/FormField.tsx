import React, { ReactNode } from "react";

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ id, label, required, hint, error, children, className = "" }) => {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={`form-group ${error ? "has-error" : ""} ${className}`}>
      <label htmlFor={id} className="form-label">
        <span>{label}</span>
        {required && (
          <span className="required-indicator" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>

      {hint && (
        <span id={hintId} className="form-hint">
          {hint}
        </span>
      )}

      {children}

      {error && (
        <span id={errorId} className="form-error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
