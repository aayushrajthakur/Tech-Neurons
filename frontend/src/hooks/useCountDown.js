import { useEffect, useState } from "react";

const useCountdown = (targetTime) => {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(targetTime) - new Date())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1000);
        if (next === 0) clearInterval(interval);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  return formatted;
};

export default useCountdown;
