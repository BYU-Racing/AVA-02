import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const ScrollingContent = () => {
  const { scrollYProgress } = useScroll();

  // Create opacity and scale transformations for content
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.02, 0.03, 0.04],
    [1, 1, 0.5, 0]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 0.006, 0.03, 0.06],
    [1, 1, 1.5, 2.5]
  );

  const opacityCar = useTransform(
    scrollYProgress,
    [0.07, 0.1, 0.2, 0.23],
    [0, 1, 1, 0]
  );

  const opacitySuspension1 = useTransform(
    scrollYProgress,
    [0.24, 0.25, 0.3, 0.32],
    [0, 1, 1, 0]
  );

  const opacitySuspension2 = useTransform(
    scrollYProgress,
    [0.32, 0.33, 0.37, 0.39],
    [0, 1, 1, 0]
  );

  return (
    <>
      {/* Sticky Header */}
      <motion.div
        style={{
          position: "fixed",
          top: "2%",
          transform: "translateX(-50%)",
          zIndex: 10,
          color: "white",
          textAlign: "center",
          opacity,
          scale,
          width: "100%",
        }}
      >
        <motion.h1
          style={{
            fontFamily: "avaFont, sans-serif",
            marginBottom: "1px",
            fontSize: "10vw",
          }}
        >
          AVA-02
        </motion.h1>
        <motion.p style={{ fontSize: "1.0vw", marginTop: "1px" }}>
          Advanced Vehicle Analytics by BYU Racing Electronics Team
        </motion.p>
      </motion.div>

      <motion.div
        style={{
          position: "fixed",
          top: "70%", // Move to top of screen
          left: "40%", // Center horizontally
          transform: "translateX(-25%)", // Only horizontal centering
          zIndex: 10,
          color: "white",
          textAlign: "center",
          opacity: opacityCar,
        }}
      >
        <motion.h1
          style={{
            fontFamily: "avaFont, sans-serif",
            marginBottom: "1px",
            fontSize: "5rem",
          }}
        >
          Electric Blue II
        </motion.h1>
        <motion.p style={{ fontSize: "1.3rem", marginTop: "1px" }}>
          Second generation car from BYU Racing redesigned from the ground up
          from last years experiance
        </motion.p>
      </motion.div>

      <motion.div
        style={{
          position: "fixed",
          top: "10%", // Move to top of screen
          left: "15%", // Center horizontally
          transform: "translateX(-25%)", // Only horizontal centering
          zIndex: 10,
          color: "white",
          textAlign: "center",
          opacity: opacitySuspension1,
        }}
      >
        <motion.h1
          style={{
            fontFamily: "avaFont, sans-serif",
            marginBottom: "1px",
            fontSize: "5rem",
          }}
        >
          Suspension
        </motion.h1>
        <motion.p style={{ fontSize: "1.3rem", marginTop: "1px" }}>
          Optimized for tighter packaging and weight reduction
        </motion.p>
        <Card
          sx={{
            minWidth: 275,
            marginTop: "3rem",
            borderRadius: "16px", // Rounded corners
            backgroundColor: "rgba(220, 220, 220, 0.9)", // Transparent white
            backdropFilter: "blur(21px)", // Frosted glass effect
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)", // Optional shadow for depth
            border: "1px solid rgba(255, 255, 255, 0.3)", // Subtle border for effect
          }}
        >
          <CardContent>
            <img src="Suspension2025Com.png" alt="REAR SUSPENSION CAD" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        style={{
          position: "fixed",
          top: "50%", // Move to top of screen
          left: "75%", // Center horizontally
          transform: "translateX(-25%)", // Only horizontal centering
          zIndex: 10,
          color: "white",
          textAlign: "center",
          opacity: opacitySuspension2,
        }}
      >
        <Card
          sx={{
            minWidth: 275,
            marginTop: "3rem",
            borderRadius: "16px", // Rounded corners
            backgroundColor: "rgba(220, 220, 220, 0.9)", // Transparent white
            backdropFilter: "blur(21px)", // Frosted glass effect
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)", // Optional shadow for depth
            border: "1px solid rgba(255, 255, 255, 0.3)", // Subtle border for effect
          }}
        >
          <CardContent>
            <img src="Suspension2025P1Compressed.png" alt="front suspension" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        style={{
          position: "fixed",
          top: "10%", // Move to top of screen
          left: "10%", // Center horizontally
          transform: "translateX(-25%)", // Only horizontal centering
          zIndex: 10,
          color: "white",
          textAlign: "center",
          opacity: opacitySuspension2,
        }}
      >
        <Card
          sx={{
            minWidth: 275,
            marginTop: "3rem",
            borderRadius: "16px", // Rounded corners
            backgroundColor: "rgba(220, 220, 220, 0.9)", // Transparent white
            backdropFilter: "blur(21px)", // Frosted glass effect
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)", // Optional shadow for depth
            border: "1px solid rgba(255, 255, 255, 0.3)", // Subtle border for effect
          }}
        >
          <CardContent>
            <img src="SuspensionALLCom.png" alt="All suspension" />
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
      >
        {/* <Section title="Design Concept" backgroundColor="rgba(0,0,0,0.0)">
          Innovative racing analytics platform
        </Section> */}
        {/* 
        <Section title="Data Visualization" backgroundColor="rgba(0,0,0,0.0)">
          Advanced telemetry and performance tracking
        </Section> */}

        {/* <Section title="Real-time Insights" backgroundColor="rgba(0,0,0,0.0)">
          Live data processing and analysis
        </Section> */}
      </div>
    </>
  );
};

// Reusable Section Component
const Section = ({ title, children, backgroundColor }) => {
  return (
    <div
      style={{
        height: "2000px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        backgroundColor: backgroundColor,
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "2.5rem", marginBottom: "20px" }}>{title}</h2>
      <p style={{ maxWidth: "600px", fontSize: "1.2rem" }}>{children}</p>
    </div>
  );
};

export default ScrollingContent;
