# Social Writer

AI-powered newsjacking and content creation platform that helps you identify trending opportunities and create engaging LinkedIn content.

## 🚀 Features

### Research Tab
- **Newsjacking Opportunities**: Real-time discovery of trending articles and topics relevant to your brand
- **AI Brief Generation**: Automatically generate content briefs with emotional targeting
- **Smart Filtering**: Filter by trending topics and relevance scores
- **Brand Integration**: Analyze opportunities against your brand positioning

### Write Tab
- **Markdown Editor**: Full-featured markdown editor with preview
- **Real-time AI Analysis**: Automatic content analysis using Google's Gemini AI
- **Intelligent Feedback**: Detailed scoring and suggestions for:
  - Hook quality and engagement
  - Story structure and narrative flow
  - Scannability and mobile optimization
  - Takeaway strength and call-to-action
  - Authenticity and brand alignment
- **Auto-Improve**: One-click content enhancement based on AI feedback
- **Brand Consistency**: Ensure all content aligns with your brand voice

### Key Capabilities
- **Brand Positioning**: Upload and analyze brand guides for consistent messaging
- **Emotional Targeting**: Generate content briefs tailored to specific emotions
- **Trend Detection**: Identify and leverage trending topics in your industry
- **Performance Analytics**: Get detailed feedback on content quality and engagement potential

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Markdown**: @uiw/react-md-editor
- **AI Integration**: Google Gemini API
- **Backend**: Convex for real-time data
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini API key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/social-writer.git
   cd social-writer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Set up Convex**
   ```bash
   npm install convex
   npx convex dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### API Keys
- **Gemini API**: Required for AI analysis and content generation
  - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
  - Set it in the app via the "Set API Key" button

### Brand Positioning
- Upload your brand positioning document to enable brand-aligned content analysis
- Supports PDF, DOC, and text files
- Automatically extracts keywords and brand voice characteristics

## 📚 Usage

### Getting Started

1. **Set up your API key** in the top-right corner
2. **Upload your brand guide** (optional but recommended)
3. **Explore opportunities** in the Research tab
4. **Generate AI briefs** for promising articles
5. **Start writing** by clicking "Keep Writing" on any opportunity
6. **Get real-time feedback** as you write

### Research Tab Workflow
- Browse trending articles relevant to your industry
- Use the "Generate Briefs" button to create AI-powered content suggestions
- Filter by trending topics using the checkbox
- Click "Keep Writing" to start creating content based on an opportunity

### Write Tab Workflow
- Write your LinkedIn post in markdown format
- Receive automatic AI analysis every 5 seconds after you stop typing
- Review detailed feedback across multiple scoring categories
- Use "Auto Improve" to enhance your content based on AI suggestions
- Ensure brand consistency with your uploaded positioning document

## 🏗️ Project Structure

```
src/
├── components/
│   ├── App.tsx                    # Main application component
│   ├── MarkdownEditor.tsx         # Markdown editor component
│   ├── FeedbackPanel.tsx          # AI feedback display
│   ├── ApiKeyModal.tsx            # API key management
│   ├── BrandPositioningModal.tsx  # Brand guide upload
│   ├── NewsjackingDashboard.tsx   # Research tab
│   └── OpportunityCard.tsx       # Opportunity cards
├── services/
│   ├── geminiApi.ts              # Gemini API integration
│   └── convexNewsjacking.ts     # Convex backend services
├── types/
│   ├── feedback.ts               # AI feedback types
│   └── newsjacking.ts            # Newsjacking data types
└── hooks/
    └── useDebounce.ts            # Custom debounce hook
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for providing the powerful AI analysis capabilities
- **Convex** for the real-time backend infrastructure
- **Tailwind CSS** for the utility-first styling framework
- **Lucide** for the beautiful icon library

## 🔮 Future Enhancements

- Multi-platform support (Twitter, Facebook, etc.)
- Content scheduling and publishing
- Advanced analytics and performance tracking
- Team collaboration features
- Content calendar management
- Advanced brand voice customization
- Integration with social media management tools

## 📞 Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Check the documentation
- Review the code comments for implementation details

---

Built with ❤️ for content creators and social media professionals.
