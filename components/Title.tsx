// components/Title.tsx
"use client";

import React from "react";

type TitleProps = {
  text: string;
};

export default function Title({ text}: TitleProps) {
  return (
    <h1
      className={`text-xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-primary leading-tight mb-8 text-left`}
    >
      {text}
    </h1>
  );
}
