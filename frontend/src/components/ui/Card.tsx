import React, { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "elevated" | "bordered";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  return (
    <div
      className={`card card--${variant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
);
