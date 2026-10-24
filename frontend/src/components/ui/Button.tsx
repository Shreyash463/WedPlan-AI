import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const classNames = [
      "btn",
      `btn--${variant}`,
      `btn--${size}`,
      isLoading ? "btn--loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <span className="btn-spinner" aria-hidden="true" />
        )}
        <span className={isLoading ? "btn-content--hidden" : "btn-content"}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
