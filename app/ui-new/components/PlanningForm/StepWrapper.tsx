"use client";

import { ReactNode } from "react";

interface StepWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}
export const StepWrapper = ({ title, subtitle, children }: StepWrapperProps) => {
  return (
    <section className="text-center">
      <h2 className="text-xl font-serif mb-1">
        {title}
      </h2>

      {subtitle && (
        <p className="text-xs text-gray-600 mb-6">
          {subtitle}
        </p>
      )}

      {children}
    </section>
  );
};
