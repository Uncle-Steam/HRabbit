import React, { useState } from 'react';
import { UserContext } from '../types';
import { ArrowRight, Briefcase, Building, User, Sparkles } from 'lucide-react';
import hrabbitLogo from '../assets/HRabbit Logo.png';
import ibmLogo from '../assets/ibmlogo.png';

interface WelcomeScreenProps {
  onStart: (ctx: UserContext) => void;
  isLoading: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, isLoading }) => {
  const [ctx, setCtx] = useState<UserContext>({
    name: '',
    role: '',
    department: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(ctx);
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* HRabbit Header */}
      <header className="border-b border-ibm-grey-100 bg-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              {/* HRabbit Logo */}
              <img 
                src={hrabbitLogo} 
                alt="HRabbit Logo" 
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-semibold text-ibm-grey-900">HRabbit</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Fits in remaining space */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-6 py-6 md:py-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center h-full">
            
            {/* Left Column - Text Content */}
            <div className="space-y-5 md:space-y-6 flex flex-col justify-center">
              {/* Headline */}
              <h1 className="text-4xl md:text-5xl font-light leading-tight tracking-tight" style={{
                background: 'linear-gradient(90deg, #0f62fe 0%, #8a3ffc 50%, #ff6eb4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 300
              }}>
                Capture knowledge
                <br />
                through innovation
              </h1>
              
              {/* Body Text */}
              <p className="text-sm md:text-base text-ibm-grey-700 leading-relaxed">
                HRabbit's AI-powered offboarding solution helps organizations preserve critical knowledge 
                when employees transition. Our intelligent system identifies knowledge gaps and creates 
                comprehensive handover documentation.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-ibm-grey-400" size={18} />
                    <input
                      required
                      type="text"
                      value={ctx.name}
                      onChange={e => setCtx({...ctx, name: e.target.value})}
                      placeholder="Full Name"
                      className="w-full pl-10 pr-4 py-3 text-base border-2 border-ibm-grey-200 focus:border-ibm-blue-500 focus:ring-2 focus:ring-ibm-blue-200 outline-none transition-all bg-white rounded"
                    />
                  </div>
                  
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 text-ibm-grey-400" size={18} />
                    <input
                      required
                      type="text"
                      value={ctx.role}
                      onChange={e => setCtx({...ctx, role: e.target.value})}
                      placeholder="Job Title / Role"
                      className="w-full pl-10 pr-4 py-3 text-base border-2 border-ibm-grey-200 focus:border-ibm-blue-500 focus:ring-2 focus:ring-ibm-blue-200 outline-none transition-all bg-white rounded"
                    />
                  </div>

                  <div className="relative">
                    <Building className="absolute left-3 top-3.5 text-ibm-grey-400" size={18} />
                    <input
                      required
                      type="text"
                      value={ctx.department}
                      onChange={e => setCtx({...ctx, department: e.target.value})}
                      placeholder="Department / Team"
                      className="w-full pl-10 pr-4 py-3 text-base border-2 border-ibm-grey-200 focus:border-ibm-blue-500 focus:ring-2 focus:ring-ibm-blue-200 outline-none transition-all bg-white rounded"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-ibm-blue-500 hover:bg-ibm-blue-600 text-white font-semibold py-3 px-6 text-base flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed rounded"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing Gaps...
                      </>
                    ) : (
                      <>
                        Start Knowledge Scan
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="flex-1 bg-white border-2 border-ibm-blue-500 text-ibm-blue-500 hover:bg-ibm-blue-50 font-semibold py-3 px-6 text-base flex items-center justify-center gap-2 transition-all rounded"
                  >
                    Learn More
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-ibm-grey-100">
                <div className="flex items-center justify-center gap-6 text-sm text-ibm-grey-600">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-ibm-blue-500" />
                    <span>IBM watsonx orchestrate powered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-ibm-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secure & Private</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className="hidden md:flex items-center justify-center h-full">
              <div className="bg-gradient-to-br from-ibm-blue-50 to-ibm-purple-50 rounded-lg p-8 w-full max-w-md">
                <div className="text-center space-y-4">
                  {/* IBM Logo */}
                  <div className="flex justify-center mb-2">
                    <img 
                      src={ibmLogo} 
                      alt="IBM Logo" 
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-ibm-grey-900">Intelligent Knowledge Hop</h3>
                  <p className="text-ibm-grey-600 text-sm">
                    Leverage AI to identify critical knowledge gaps and ensure seamless transitions
                  </p>
                  {/* Statistics would be loaded from database/API */}
                  <div className="flex gap-4 justify-center pt-2">
                    {/* Dynamic content from backend */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomeScreen;
