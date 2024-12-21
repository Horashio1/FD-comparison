// app/about/page.tsx
"use client";

import Title from "@/components/Title";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Title text="About Us" />

      <div className="text-lg text-gray-700 mt-6 space-y-4">
        <p className="leading-relaxed">
          Welcome! This is a fun project where I am experimenting with web technologies to build a stylish and functional app. Here, I am focusing on creating a smooth, engaging user experience while expanding my skills.
        </p>
      </div>
    </div>
  );
}