"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export  function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "px-8 py-3 rounded-full font-medium transition focus:outline-none";

  const variants = {
    primary: "bg-amber-700 text-white hover:bg-amber-900",
    secondary: "border border-white text-white hover:bg-white hover:text-black",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
