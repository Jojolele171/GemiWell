# GemiWell - AI Health Assistant Prototype

1. Repository Overview & Team Introduction

GemiWell is an AI-powered health coaching platform designed to provide accessible, personalized lifestyle guidance and medical report analysis using Google AI technologies.
This is a Next.js-based AI health assistant prototype built in Firebase Studio.

### Team
- Joel Nga
- Shaun Cheng
- Jordan


# 2. Project Overview

## Problem Statement

Low health literacy is strongly associated with poorer health outcomes. Studies show that patients remember only about 49% of medical decisions discussed during consultations, and between 40–80% of medical information is forgotten immediately after appointments. As information complexity increases, retention decreases further.

This gap in comprehension can result in:
- Misinterpretation of medical instructions  
- Poor treatment adherence  
- Delayed interventions  
- Increased anxiety, especially among elderly individuals and patients managing chronic conditions  

---

## SDG Alignment

**SDG 3 — Good Health and Well-Being**

GemiWell supports SDG 3 by improving access to understandable health information and helping optimize healthcare resources in regions facing workforce shortages.

---

## Short Solution Description

GemiWell is an AI-powered platform that allows users to upload medical reports and receive structured, easy-to-understand explanations. By translating complex clinical data into clear insights and enabling contextual follow-up questions, the system improves health literacy while reducing repetitive clarification demands on healthcare professionals.

---

# 3. Key Features

-  Context-Aware AI Health Chatbot  
-  Multimodal Medical Report Analysis (OCR + Clinical Reasoning)  
-  Real-Time Firestore Synchronization  
-  Structured AI Output with Schema Validation  
-  Confidence-Level Scoring for AI Analyses  
-  Responsive Web Interface  

# 4. Technologies Used

## Google Technologies

### Firebase
- Firebase Authentication
- Cloud Firestore (real-time NoSQL database)

### Genkit 1.x
- AI orchestration layer
- Structured flow definitions
- Built-in safety enforcement

### Gemini 2.5 Flash
- Multimodal large language model
- Performs OCR and clinical reasoning
- Generates structured health insights

--

## Other Supporting Tools & Libraries

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- ShadCN UI
- Zod (schema validation)
- HTML5 Canvas API (image compression)
- MediaDevices API (camera integration)
- Firebase Client SDK

# 5. Implementation Details & Innovation

## System Architecture

GemiCare is a Serverless Full-Stack Healthcare Platform with layered architecture:

- Logic & Rendering Layer – Next.js + React: unified frontend/backend

- Identity & Persistence Layer – Firebase Authentication & Firestore: secure role-based access, real-time synchronization of user health profiles, messages, and reports.

- AI Orchestration Layer – Genkit + Google AI Plugin: structured AI flows, input/output validation, and safeties.

- AI Inference Engine – Gemini 2.5 Flash: multimodal reasoning (text, images, PDFs), contextual health coaching, OCR and clinical interpretation.

- Design System – ShadCN UI + Tailwind: accessible, responsive, clinical-grade UI.

## Key Modules

1. AI Chatbot – Provides lifestyle-focused health guidance.

Context aggregation from health profiles and medical reports.
Server Actions securely invoke AI flows.
Firestore real-time sync ensures cross-device consistency.

2. Medical Report Analyst – Extracts structured insights from documents.

Supports photos or PDFs.
Performs OCR and clinical reasoning via Gemini in one inference.
Generates structured summaries with confidence levels.

## Module Workflows

- AI Chatbot Flow: 
   User query → context aggregation → HealthAdviceFlow → Gemini response → Firestore → UI update.

- Medical Report Flow: 
   Capture/upload → client-side optimization → SummarizeMedicalReportFlow → Gemini multimodal analysis → Firestore → UI display.

## Innovations

Multimodal AI reasoning combining text, image, and PDF inputs.
Real-time data sync for cross-device consistency.
Structured AI flows with safety and schema validation for deterministic outputs.
Modular, serverless design for scalability and reliability.

--
# 6. Challenges

- Defining a Clear Focus: Initially, we had many ideas for features and directions. Narrowing down to a coherent project scope required prioritization and careful decision-making.

- Maintaining the Scope: features like a dedicated doctor’s view—were removed during development, as we saw it to be unneccesary.

- API keys: I exposed my API on accident and when making it a public repo, I had to fix my API keys but I accidentally messed up the logic in the sign ups. I had to delete my previous keys and repo, while making a copy of a later commit into a new repo (GemiWellv2 so to speak).


--

# 7. Installation & Setup

### Prerequisites
- Node.js (v18 or later)
- NPM or Yarn

### Local Setup Instructions

1. **Extract/Copy Files**: Copy all the files from this prototype into a new folder on your computer. 

2. **Navigate to Folder**:
   ```bash
   cd studio
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **env API keys**:
   Create a file named .env in your root folder and paste it API keys given, according to .env.example.

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

6. **Open the App**:
   Navigate to `http://localhost:3000`, or any other stated server in terminal.

--

# 8. Future roadmmap

## Phase 1:
– Better UI for web and mobile application
– Connect “Tracking” to Ai chat bot

## Phase 2:
– Faster analysis time
– Faster response time
– Stable scan function

## Phase 3:
– Develop a social platform
– Better diet and activity tracking system

## Phase 4:
– Connect to user’s digital watch