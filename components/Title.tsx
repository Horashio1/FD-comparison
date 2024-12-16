// components/Title.tsx
"use client";

import React from "react";

type TitleProps = {
  text: string;
};

export default function Title({ text}: TitleProps) {
  return (
    <h1
      className={`text-2xl sm:text-2xl md:text-4xl lg:text-4xl font-bold text-primary mb-4 text-left`}
    >
      {text}
    </h1>
  );
}
