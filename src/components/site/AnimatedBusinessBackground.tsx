import React, { useEffect, useState } from 'react';

const businessImages = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80',
];

const AnimatedBusinessBackground: React.FC = () => {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % businessImages.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#071426]">
      {businessImages.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ${index === activeImage ? 'site-background-drift opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url("${image}")` }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(4,14,30,0.58)_0%,rgba(5,24,48,0.48)_50%,rgba(6,28,52,0.60)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.17),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(37,99,235,0.18),transparent_36%)]" />
    </div>
  );
};

export default AnimatedBusinessBackground;