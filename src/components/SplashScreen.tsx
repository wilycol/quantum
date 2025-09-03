
import React, { useEffect, useRef, useState } from 'react';

// This video URL is the official QuantumTrade logo animation.
const SPLASH_VIDEO_URL = 'https://res.cloudinary.com/djojon779/video/upload/v1754260499/Animate_the_QuantumTrade_logo_on_a_dark_gradient_background_black_to_deep_blue_._The_golden__Q__glows_subtly_showing_a_candlestick_chart_inside._Below_it_the_golden__QuantumTrade__text_fades_in_with_a_digital_gylmzp.mp4';

interface SplashScreenProps {
  onCompleted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onCompleted }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      setIsFadingOut(true);
    };

    const handleFadeOutEnd = (event: TransitionEvent) => {
      // Ensure we only trigger onCompleted when the fade-out transition for opacity has ended.
      if (event.propertyName === 'opacity' && isFadingOut) {
        onCompleted();
      }
    };

    // The 'ended' event fires when the video playback has finished.
    video.addEventListener('ended', handleVideoEnd);
    
    // The 'transitionend' event fires when the fade-out CSS transition is complete.
    video.parentElement?.addEventListener('transitionend', handleFadeOutEnd);

    // A fallback timeout to ensure the splash screen doesn't get stuck,
    // e.g., if the video fails to load or the 'ended' event doesn't fire.
    const fallbackTimeout = setTimeout(handleVideoEnd, 10000); // 10-second fallback to match video length

    return () => {
      clearTimeout(fallbackTimeout);
      if (video) {
        video.removeEventListener('ended', handleVideoEnd);
        video.parentElement?.removeEventListener('transitionend', handleFadeOutEnd);
      }
    };
  }, [onCompleted, isFadingOut]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-b from-black to-[#0c164f] transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src={SPLASH_VIDEO_URL}
        autoPlay
        muted
        playsInline // Important for autoplay on mobile browsers
        className="w-full h-full object-contain animate-fade-in"
      />
    </div>
  );
};

export default SplashScreen;