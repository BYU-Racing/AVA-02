import { useRef, useMemo, useCallback, useEffect } from "react";
import { useScroll, useMotionValueEvent, useTransform } from "framer-motion";

function VideoScroll() {
  const ref = useRef(null);

  const images = useMemo(() => {
    const loadedImages = [];
    for (let i = 1; i <= 700; i++) {
      const img = new Image();
      img.src = `/AVA_Scroll/${i.toString().padStart(4, "0")}.webp`;
      loadedImages.push(img);
    }
    return loadedImages;
  }, []);

  const { scrollYProgress } = useScroll();

  const currentIndex = useTransform(scrollYProgress, [0, 1], [1, 700]);

  const render = useCallback(
    (index) => {
      if (images[index - 1]) {
        const canvas = ref.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(images[index - 1], 0, 0, canvas.width, canvas.height);
        }
      }
    },
    [images]
  );

  useMotionValueEvent(currentIndex, "change", (latest) => {
    render(Math.floor(latest));
  });

  // Set the canvas dimensions dynamically to match the viewport
  useEffect(() => {
    const canvas = ref.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    />
  );
}

export default VideoScroll;
