<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# HRabbit - Knowledge Transfer Application

An AI-powered offboarding solution that helps organizations preserve critical knowledge when employees transition. Built with IBM Watsonx Orchestrate for intelligent knowledge gap identification and comprehensive handover documentation.

View your app in AI Studio: https://ai.studio/apps/drive/1hn8sNDQYrnOCkK18-5VO43EHa7p1BcWn

## Overview

HRabbit leverages **IBM Watsonx Orchestrate** to intelligently analyze employee knowledge and identify critical gaps that need to be addressed during offboarding. The application connects to Watsonx Orchestrate's backend API to:

- **Discover and invoke skillsets** - Automatically discovers available skillsets and skills configured in your Watsonx Orchestrate instance
- **Generate knowledge gaps** - Uses AI skills to analyze employee context and identify critical knowledge areas
- **Create handover documents** - Generates comprehensive knowledge transfer documentation using Watsonx Orchestrate skills

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:

   ```env
   # Required: IBM Watsonx Orchestrate API Configuration
   WATSONX_API_ENDPOINT=https://your-watsonx-instance.ibm.com/api
   WATSONX_API_KEY=your_watsonx_api_key_here

   # Optional: Google Gemini API (for video transcription only)
   # The application uses Watsonx Orchestrate for all AI operations
   # Gemini is only used for transcribing video interview responses
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Backend Integration

### IBM Watsonx Orchestrate

The application is **fully integrated** with IBM Watsonx Orchestrate backend:

- **Authentication**: Uses API key authentication to obtain JWT tokens from Watsonx Orchestrate
- **Skillset Discovery**: Automatically discovers available skillsets and skills from your Watsonx Orchestrate instance
- **Knowledge Gap Generation**: Invokes Watsonx Orchestrate skills to generate knowledge gaps based on employee context
- **Document Generation**: Uses Watsonx Orchestrate skills to create comprehensive handover documents

The application connects to Watsonx Orchestrate using the following endpoints:

- `/v1/auth/token` - Authentication and token management
- `/v1/skillsets` - Skillset discovery
- `/v1/skillsets/{skillsetId}` - Skill retrieval
- `/v1/skillsets/{skillsetId}/skills/{skillId}/invoke` - Skill invocation

### Video Transcription

Video interview responses are transcribed using Google Gemini API. This is the only feature that uses Gemini - all other AI operations are handled by Watsonx Orchestrate.

For detailed Watsonx setup instructions, see [WATSONX_SETUP.md](WATSONX_SETUP.md).
