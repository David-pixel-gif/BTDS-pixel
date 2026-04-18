import React from "react";

const iconStyle = {
  width: "100%",
  height: "100%",
  stroke: "#0f172a",
  strokeWidth: 1.5,
  fill: "none"
};

const LandingData = {
  hero: {
    title: "AI-Powered Brain Tumor Detection System",
    subtitle:
      "A multi-stage deep learning pipeline for brain MRI analysis, combining classification, localization, and clinical analytics.",
    primaryCta: {
      label: "Get Started",
      route: "/register"
    },
    secondaryCta: {
      label: "View Pipeline",
      anchor: "#features"
    }
  },

  features: {
    title: "AI Detection Pipeline",
    items: [
      {
        stage: "Stage 1",
        title: "Tumor vs Non-Tumor",
        description:
          "Binary classification model determines whether a brain MRI contains tumorous tissue.",
        visual: () => (
          <svg viewBox="0 0 100 100" style={iconStyle}>
            <circle cx="50" cy="50" r="38" />
            <circle cx="65" cy="45" r="8" />
          </svg>
        )
      },
      {
        stage: "Stage 2",
        title: "Tumor Type Classification",
        description:
          "Multi-class model identifies tumor categories such as Glioma, Meningioma, or Pituitary.",
        visual: () => (
          <svg viewBox="0 0 100 100" style={iconStyle}>
            <circle cx="50" cy="50" r="36" />
            <path d="M50 14v72M14 50h72" />
          </svg>
        )
      },
      {
        stage: "Stage 3",
        title: "Bounding Box Localization",
        description:
          "Object detection network localizes tumor regions using bounding boxes.",
        visual: () => (
          <svg viewBox="0 0 100 100" style={iconStyle}>
            <rect x="20" y="20" width="60" height="60" rx="4" />
            <rect x="45" y="45" width="20" height="20" rx="2" />
          </svg>
        )
      },
      {
        stage: "Stage 4",
        title: "Clinical Analytics",
        description:
          "Results are summarized through confidence scores, visual overlays, and diagnostic analytics.",
        visual: () => (
          <svg viewBox="0 0 100 100" style={iconStyle}>
            <polyline points="15,65 35,45 55,55 75,30" />
            <circle cx="75" cy="30" r="3" fill="#0f172a" />
          </svg>
        )
      }
    ]
  },

  trust: {
    title: "Designed for Clinical & Research Use",
    items: [
      {
        title: "Persistent Records",
        description:
          "Patients, users, diagnosis records, audit events, and reports are stored through the MySQL-backed backend."
      },
      {
        title: "Auditable Workflow",
        description:
          "Report exports and diagnostic activity are logged so operational history comes from application events."
      }
    ]
  },

  cta: {
    title: "Explore the AI Detection Pipeline",
    subtitle:
      "A structured approach to brain tumor analysis designed for trust, clarity, and research-grade evaluation.",
    action: {
      label: "Request Access",
      route: "/register"
    }
  }
};

export default LandingData;
