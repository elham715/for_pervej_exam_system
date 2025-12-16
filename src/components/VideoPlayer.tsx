
import React from 'react';

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(?:youtu.be\/|v\/|e\/|embed\/|watch\?v=|&v=)([^#&?\n]*).*/;
    const match = url.match(regExp);
    if (match && match[1] && match[1].length === 11) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    return url; // Return original if not a YouTube URL or ID not found
  };

  const embedSrc = getYouTubeEmbedUrl(src);

  return (
    <div className="aspect-w-16 aspect-h-9">
      <iframe 
        src={embedSrc}
        title="Topic Video"
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
}
