import React, { useState, useEffect } from 'react';

const testimonials = [
  {
    name: 'Sarah Wanjiku',
    role: 'CTO, TechVentures Kenya',
    image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231298778_e7646a4a.jpg',
    text: 'KCJ Tech transformed our entire IT infrastructure. Their expertise in system architecture and distributed systems helped us scale from 100 to 10,000 users seamlessly. Absolutely world-class service.',
    rating: 5,
  },
  {
    name: 'David Omondi',
    role: 'Founder, DigiCommerce Africa',
    image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231306805_e7150750.png',
    text: 'The e-commerce platform they built for us exceeded all expectations. Their knowledge of web programming and database systems is unmatched. Revenue increased by 300% within the first quarter.',
    rating: 5,
  },
  {
    name: 'Grace Muthoni',
    role: 'Dean, Nairobi Tech Institute',
    image: 'https://d64gsuwffb70l.cloudfront.net/6992d77ce0addb6132c1a899_1771231310861_9c8039c5.png',
    text: 'We partnered with KCJ Tech for our computer science curriculum development. Their depth of knowledge across programming fundamentals, data structures, and OOP is truly impressive.',
    rating: 5,
  },
];

const Testimonials: React.FC = () => {
  const [active, setActive] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setActive(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const next = () => goTo((active + 1) % testimonials.length);
  const prev = () => goTo((active - 1 + testimonials.length) % testimonials.length);

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-cyan-100/30 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-full mb-4">
            <span className="text-cyan-600 text-sm font-medium">Client Testimonials</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
            What Our <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Clients Say</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Don't just take our word for it — hear from the businesses and professionals we've helped succeed.
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 overflow-hidden">
            {/* Quote mark */}
            <div className="absolute top-6 right-8 text-cyan-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
            </div>

            <div className="relative z-10">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[active].rating)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-700 text-lg sm:text-xl leading-relaxed mb-8 italic">
                "{testimonials[active].text}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={testimonials[active].image}
                    alt={testimonials[active].name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-cyan-200 shadow-md"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{testimonials[active].name}</p>
                    <p className="text-gray-500 text-sm">{testimonials[active].role}</p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={prev}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-cyan-600 hover:border-cyan-300 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button
                    onClick={next}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-cyan-600 hover:border-cyan-300 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === active ? 'w-8 bg-gradient-to-r from-cyan-500 to-blue-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trusted by logos / stats */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: '500+', label: 'Happy Clients' },
            { value: '1,200+', label: 'Projects Completed' },
            { value: '20+', label: 'Service Areas' },
            { value: '10+', label: 'Years Experience' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
