import { useEffect, useState } from 'react';

export function useCounterAnimation(
  targetValue: number,
  duration: number = 1500,
  enabled: boolean = true
) {
  const [count, setCount] = useState(enabled ? 0 : targetValue);

  useEffect(() => {
    if (!enabled) {
      setCount(targetValue);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      setCount(Math.floor(easeOutCubic * targetValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [targetValue, duration, enabled]);

  return count;
}
