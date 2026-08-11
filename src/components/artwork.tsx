import Image from 'next/image';

type ArtworkProps = {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  priority?: boolean;
  rounded?: 'tile' | 'circle';
};

export function Artwork({ src, alt, size = 'md', priority = false, rounded = 'tile' }: ArtworkProps) {
  const image = src ?? 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85';
  return (
    <div className={`artwork artwork-${size} artwork-${rounded}`}>
      <Image src={image} alt={alt} fill sizes={size === 'hero' ? 'min(86vw, 520px)' : '(max-width: 700px) 32vw, 220px'} priority={priority} unoptimized />
    </div>
  );
}
