import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

// Common styles
const cardStyles = {
  minWidth: 275,
  maxWidth: 600,
  marginTop: "2rem",
  borderRadius: "16px",
  backgroundColor: "rgba(220, 220, 220, 0.9)",
  backdropFilter: "blur(21px)",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
};

const contentBoxStyles = {
  position: "fixed",
  zIndex: 10,
  color: "white",
  textAlign: "center",
  padding: "0 20px",
  maxWidth: "90vw",
};

const headingStyles = {
  fontFamily: "avaFont, sans-serif",
  marginBottom: "1rem",
  fontSize: "clamp(2rem, 5vw, 5rem)",
};

const paragraphStyles = {
  fontSize: "clamp(1rem, 1.5vw, 1.3rem)",
  marginTop: "0.5rem",
  maxWidth: "600px",
  margin: "0 auto",
};

const ScrollingContent = () => {
  const { scrollYProgress } = useScroll();

  // Create opacity and scale transformations for content
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.02, 0.03, 0.04],
    [1, 1, 0.5, 0],
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 0.006, 0.03, 0.06],
    [1, 1, 1.5, 2.5],
  );

  const opacityCar = useTransform(
    scrollYProgress,
    [0.07, 0.1, 0.2, 0.23],
    [0, 1, 1, 0],
  );

  const opacitySuspension1 = useTransform(
    scrollYProgress,
    [0.24, 0.25, 0.3, 0.32],
    [0, 1, 1, 0],
  );

  const opacitySuspension2 = useTransform(
    scrollYProgress,
    [0.32, 0.33, 0.37, 0.39],
    [0, 1, 1, 0],
  );

  return (
    <>
      {/* Sticky Header */}
      <motion.div
        style={{
          position: "fixed",
          top: "5%",
          left: "50%",
          x: "-50%",
          zIndex: -1,
          color: "white",
          textAlign: "center",
          opacity,
          scale,
          maxWidth: "90vw",
        }}
      >
        <motion.h1
          style={{
            fontFamily: "avaFont, sans-serif",
            marginBottom: "1px",
            fontSize: "clamp(3rem, 10vw, 10rem)",
          }}
        >
          AVA-02
        </motion.h1>
        <motion.p
          style={{ fontSize: "clamp(0.8rem, 1.5vw, 1.2rem)", marginTop: "1px" }}
        >
          Advanced Vehicle Analytics by BYU Racing Electronics Team
        </motion.p>
      </motion.div>

      {/* Electric Blue II Section */}
      <motion.div
        style={{
          ...contentBoxStyles,
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: opacityCar,
        }}
      >
        <motion.h1 style={headingStyles}>Electric Blue II</motion.h1>
        <motion.p style={paragraphStyles}>
          Second generation car from BYU Racing redesigned from the ground up
          from last year's experience
        </motion.p>
      </motion.div>

      {/* Suspension Section 1 - Rear */}
      <motion.div
        style={{
          ...contentBoxStyles,
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: opacitySuspension1,
        }}
      >
        <motion.h1 style={headingStyles}>Suspension</motion.h1>
        <motion.p style={paragraphStyles}>
          Optimized for tighter packaging and weight reduction
        </motion.p>
        <Card sx={cardStyles}>
          <CardContent>
            <img
              src="Suspension2025Com.png"
              alt="REAR SUSPENSION CAD"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Suspension Section 2 - Front (Right Side) */}
      <motion.div
        style={{
          ...contentBoxStyles,
          top: "50%",
          right: "5%",
          left: "auto",
          transform: "translateY(-50%)",
          opacity: opacitySuspension2,
        }}
      >
        <Card sx={cardStyles}>
          <CardContent>
            <img
              src="Suspension2025P1Compressed.png"
              alt="Front suspension"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Suspension Section 3 - All (Left Side) */}
      <motion.div
        style={{
          ...contentBoxStyles,
          top: "20%",
          left: "5%",
          transform: "none",
          opacity: opacitySuspension2,
        }}
      >
        <Card sx={cardStyles}>
          <CardContent>
            <img
              src="SuspensionALLCom.png"
              alt="All suspension"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Scrollable content area */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "8000px",
          backgroundColor: "transparent",
        }}
      />
    </>
  );
};

export default ScrollingContent;
