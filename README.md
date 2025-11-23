<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# HRabbit 🐰

## AI-Driven Employee Offboarding & Knowledge Transfer System

HRabbit is an intelligent system designed to prevent knowledge loss when employees leave a company. By leveraging IBM Watsonx Orchestrate and AI automation, it streamlines the offboarding process through automated data collection, intelligent gap identification, and AI-conducted exit interviews.

![HRabbit Banner](https://img.shields.io/badge/AI-Powered-blue) ![Python](https://img.shields.io/badge/Python-3.8+-green) ![React](https://img.shields.io/badge/React-TypeScript-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

**View the app in AI Studio:** https://ai.studio/apps/drive/1hn8sNDQYrnOCkK18-5VO43EHa7p1BcWn

## 🎯 Problem Statement

When employees leave an organization, critical knowledge often walks out the door with them. This leads to:
- **Knowledge Silos**: Undocumented processes and tribal knowledge
- **Productivity Loss**: New team members struggle without proper handover
- **Risk Exposure**: Missing context on critical systems and workflows
- **Incomplete Transitions**: Rushed offboarding processes miss crucial details

## 💡 Solution Overview

HRabbit addresses these challenges through three core capabilities:

### 1. 🔄 Extraction Automation
Automatically gathers work artifacts, messages, documents, and context from:
- **Confluence** - Documentation and knowledge base
- **Jira** - Project tickets and workflows
- **Email & Slack** - Communication history
- **Google Drive** - Shared documents and files
- **Other Enterprise Tools** - Extensible connector framework

### 2. 🔍 Gap Identification
Uses AI to analyze extracted information and detect:
- Missing knowledge and undocumented steps
- Unclear ownership and responsibilities
- Blind spots that successors would struggle with
- Critical dependencies and relationships

### 3. 🤖 AI-Driven Exit Interview
Conducts structured interviews (text or video) with:
- Targeted questions based on identified gaps
- Intelligent follow-up questions
- Context-aware conversation flow
- Comprehensive documentation generation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Sources  │    │   AI Processing │    │     Output      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Confluence    │───▶│ • RAG Chain     │───▶│ • Knowledge     │
│ • Jira          │    │ • Gap Analysis  │    │   Transfer      │
│ • Email/Slack   │    │ • LLM Agents    │    │   Package       │
│ • Drive         │    │ • Orchestration │    │ • Exit Reports  │
│ • Custom APIs   │    │ • Vector DB     │    │ • Action Items  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Features

### Current Implementation
- ✅ **Confluence Integration** - Search and retrieve documentation
- ✅ **Jira Connectivity** - Ticket and project context extraction  
- ✅ **RAG Pipeline** - Intelligent document retrieval and analysis
- ✅ **AI Agents** - Watsonx Orchestrate integration
- ✅ **Gap Analysis** - Automated risk identification
- ✅ **Exit Interview Generator** - Context-aware question generation
- ✅ **Web Interface** - React-based frontend for user interaction

### Coming Soon
- 🔄 **Multi-Source Connectors** - Email, Slack, Drive integration
- 🔄 **Video Interview AI** - Voice-to-text and video analysis
- 🔄 **Advanced Analytics** - Knowledge transfer metrics and insights

## 📋 Prerequisites

### Backend
- Python 3.8+
- OpenAI API Key (or other LLM provider)
- Atlassian Cloud account (Confluence/Jira)
- IBM Watsonx Orchestrate (optional)

### Frontend
- Node.js 16+
- npm or yarn

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Uncle-Steam/HRabbit.git
cd HRabbit
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Atlassian Configuration
CONFLUENCE_URL=https://your-domain.atlassian.net
ATLASSIAN_USERNAME=your-email@company.com
ATLASSIAN_API_TOKEN=your-api-token

# OpenAI Configuration
OPENAI_API_KEY=your-openai-key

# Optional: IBM Watsonx
WATSONX_API_KEY=your-watsonx-key
WATSONX_PROJECT_ID=your-project-id
WATSONX_API_ENDPOINT=https://your-watsonx-instance.ibm.com/api
```

#### Setup Connections
```bash
./setup_connection.sh
```

#### Import AI Agent
```bash
./import_agent.sh
```

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Configure Frontend Environment
Create a `.env.local` file in the `frontend` directory:
```env
# IBM Watsonx Orchestrate API Configuration
VITE_WATSONX_API_ENDPOINT=https://your-watsonx-instance.ibm.com/api
VITE_WATSONX_API_KEY=your_watsonx_api_key_here

# Optional: Google Gemini API (for video transcription only)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

#### Run the Frontend
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Run the Backend CLI (Optional)
```bash
# Basic ticket analysis
python src/main.py --ticket "PROJ-123"

# With custom query
python src/main.py --ticket "PROJ-123" --query "What are the deployment steps?"
```

## 📖 Usage Examples

### Employee Knowledge Extraction
```python
from src.connectors.confluence_loader import ConfluenceConnector
from src.rag.chain import RAGChain

# Initialize connectors
confluence = ConfluenceConnector(url, username, token)

# Search for employee documentation
docs = confluence.search_pages("John Doe contributor")

# Analyze knowledge gaps
chain = RAGChain()
analysis = chain.answer(
    "What knowledge gaps exist for John's projects?",
    ticket_details,
    docs
)
```

### AI Agent Integration
The system includes a pre-configured Confluence agent (`agents/confluence_agent.yaml`) that performs:
- Employee documentation retrieval
- Gap analysis with HR risk assessment
- Exit interview question generation

## 🔧 Configuration

### Confluence Connection
Configure your Confluence connection in `connections/confluence_connection.yaml`:
```yaml
name: confluence_creds
type: confluence
config:
  url: ${CONFLUENCE_URL}
  username: ${ATLASSIAN_USERNAME}
  api_token: ${ATLASSIAN_API_TOKEN}
```

### AI Agent Settings
Customize the AI agent behavior in `agents/confluence_agent.yaml`:
- LLM model selection
- Search strategies
- Analysis templates
- Output formatting

## 🛠️ Development

### Project Structure
```
HRabbit/
├── frontend/                # React TypeScript frontend
│   ├── App.tsx             # Main application component
│   ├── components/         # UI components
│   ├── services/           # API services
│   └── package.json        # Frontend dependencies
├── src/                    # Python backend
│   ├── main.py            # Entry point and CLI
│   ├── tools.py           # Utility functions
│   ├── connectors/        # Data source integrations
│   │   ├── confluence_loader.py
│   │   └── jira_loader.py
│   └── rag/
│       └── chain.py       # RAG pipeline
├── agents/
│   └── confluence_agent.yaml # AI agent configuration
├── connections/
│   └── confluence_connection.yaml # Connection settings
├── requirements.txt       # Python dependencies
├── setup_connection.sh    # Connection setup script
└── import_agent.sh       # Agent import script
```

### Adding New Connectors
1. Create a new connector in `src/connectors/`
2. Implement the base interface methods
3. Add connection configuration
4. Update the main processing pipeline

### Extending AI Capabilities
1. Modify the agent YAML configuration
2. Add new tools and knowledge bases
3. Customize prompts and instructions
4. Test with various scenarios

## 🔌 Backend Integration

### IBM Watsonx Orchestrate

The application is **fully integrated** with IBM Watsonx Orchestrate backend:

- **Authentication**: Uses API key authentication to obtain JWT tokens
- **Skillset Discovery**: Automatically discovers available skillsets and skills
- **Knowledge Gap Generation**: Invokes Watsonx Orchestrate skills based on employee context
- **Document Generation**: Uses Watsonx Orchestrate skills to create handover documents

The application connects to Watsonx Orchestrate using the following endpoints:

- `/v1/auth/token` - Authentication and token management
- `/v1/skillsets` - Skillset discovery
- `/v1/skillsets/{skillsetId}` - Skill retrieval
- `/v1/skillsets/{skillsetId}/skills/{skillId}/invoke` - Skill invocation

### Video Transcription

Video interview responses are transcribed using Google Gemini API. This is the only feature that uses Gemini - all other AI operations are handled by Watsonx Orchestrate.

For detailed Watsonx setup instructions, see [WATSONX_SETUP.md](WATSONX_SETUP.md).

## 🔌 Integrations

### Supported Platforms
- **Atlassian Suite** - Confluence, Jira
- **Communication** - Slack, Microsoft Teams (planned)
- **Storage** - Google Drive, SharePoint (planned)
- **Email** - Outlook, Gmail (planned)

### AI/ML Platforms
- **IBM Watsonx** - Orchestrate, Assistant
- **OpenAI** - GPT-4, GPT-3.5-turbo
- **Google Gemini** - Video transcription
- **LangChain** - RAG pipeline and document processing
- **ChromaDB** - Vector storage and similarity search

## 📊 Output Formats

### Knowledge Transfer Package
- **Executive Summary** - High-level overview and recommendations
- **Detailed Analysis** - Comprehensive gap identification
- **Documentation Drafts** - Template documents for successors
- **Action Items** - Prioritized next steps
- **Interview Transcripts** - AI-conducted exit interview results

### Analytics Dashboard (Coming Soon)
- Knowledge transfer completeness metrics
- Risk assessment scores
- Time-to-productivity tracking
- Department-wide knowledge mapping

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Setup Guide](docs/setup.md) (coming soon)
- [API Reference](docs/api.md) (coming soon)
- [Troubleshooting](docs/troubleshooting.md) (coming soon)

### Community
- [GitHub Issues](https://github.com/Uncle-Steam/HRabbit/issues) - Bug reports and feature requests
- [Discussions](https://github.com/Uncle-Steam/HRabbit/discussions) - Community support and ideas

## 🗺️ Roadmap

### Phase 1: Core Foundation ✅
- [x] Confluence/Jira integration
- [x] Basic RAG pipeline
- [x] AI agent framework
- [x] Gap analysis engine
- [x] Web interface

### Phase 2: Enhanced Intelligence 🔄
- [ ] Multi-modal AI (text + video)
- [ ] Advanced knowledge graphs
- [ ] Predictive gap identification
- [ ] Real-time collaboration features

### Phase 3: Enterprise Scale 📅
- [ ] SSO/Enterprise auth
- [ ] Advanced analytics dashboard
- [ ] Compliance and audit trails
- [ ] Multi-tenant architecture

## 🏆 Acknowledgments

Built with ❤️ using:
- [IBM Watsonx](https://www.ibm.com/watsonx) - Enterprise AI platform
- [LangChain](https://langchain.com) - LLM application framework
- [Atlassian API](https://developer.atlassian.com) - Confluence/Jira integration
- [OpenAI](https://openai.com) - Large language models
- [React](https://react.dev) - Frontend framework
- [Vite](https://vitejs.dev) - Build tool

---

**HRabbit** - Because good employees shouldn't disappear down a rabbit hole when they leave! 🐰✨
