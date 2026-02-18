import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { useScroll, useMotionValueEvent, useTransform } from "framer-motion";

function VideoScroll() {
  const ref = useRef(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [isFirstImageLoaded, setIsFirstImageLoaded] = useState(false);

  const images = useMemo(() => {
    const loadedImages = [];
    for (let i = 1; i <= 700; i++) {
      const img = new Image();
      img.onload = () => {
        if (i === 1) {
          setAspectRatio(img.naturalWidth / img.naturalHeight);
          setIsFirstImageLoaded(true);
        }
      };
      img.src = `/AVA_Scroll/${i.toString().padStart(4, "0")}.webp`;
      loadedImages.push(img);
    }
    return loadedImages;
  }, []);

  const { scrollYProgress } = useScroll();
  const currentIndex = useTransform(scrollYProgress, [0, 1], [1, 700]);

  const calculateDimensions = useCallback(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const imageRatio = aspectRatio;
    const windowRatio = windowWidth / windowHeight;

    let canvasWidth,
      canvasHeight,
      offsetX = 0,
      offsetY = 0;

    // Calculate dimensions to cover the window
    if (windowRatio > imageRatio) {
      canvasWidth = windowWidth;
      canvasHeight = canvasWidth / imageRatio;
      offsetY = (windowHeight - canvasHeight) / 2;
    } else {
      canvasHeight = windowHeight;
      canvasWidth = canvasHeight * imageRatio;
      offsetX = (windowWidth - canvasWidth) / 2;
    }

    return {
      canvasWidth,
      canvasHeight,
      offsetX,
      offsetY,
    };
  }, [aspectRatio]);

  const render = useCallback(
    (index) => {
      if (images[index - 1] && ref.current) {
        const canvas = ref.current;
        const ctx = canvas.getContext("2d");
        const { canvasWidth, canvasHeight, offsetX, offsetY } =
          calculateDimensions();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          images[index - 1],
          offsetX,
          offsetY,
          canvasWidth,
          canvasHeight
        );
      }
    },
    [images, calculateDimensions]
  );

  useMotionValueEvent(currentIndex, "change", (latest) => {
    render(Math.floor(latest));
  });

  useEffect(() => {
    if (!isFirstImageLoaded) return;

    const canvas = ref.current;
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render(Math.floor(currentIndex.get()));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFirstImageLoaded, render, currentIndex]);

  useEffect(() => {
    if (!isFirstImageLoaded) return;

    const canvas = ref.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, [isFirstImageLoaded]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (images[0]?.complete) {
        clearInterval(interval);
        render(1);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [images, render]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -2,
        backgroundColor: "black",
      }}
    />
  );
}

export default VideoScroll;
