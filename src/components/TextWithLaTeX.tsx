import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface TextWithLaTeXProps {
  text: string;
}

export function TextWithLaTeX({ text }: TextWithLaTeXProps) {
  const parts = text.split('$');

  return (
    <p>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          try {
            return <InlineMath key={index} math={part} />;
          } catch (error) {
            console.error('LaTeX rendering error:', error);
            return <span key={index} className="text-red-500 text-sm">LaTeX Error: {part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}