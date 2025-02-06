// pages/index.js
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession, signIn } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();
  const [businessInfo, setBusinessInfo] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle form submission to trigger SWOT analysis.
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!businessInfo.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-swot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessInfo }),
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing SWOT:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.h1 
        className="text-4xl font-bold mb-6"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
      >
        AI-Powered SWOT Analysis
      </motion.h1>
      <p className="text-center mb-8 max-w-2xl">
        Enter your business details and let our AI analyze your Strengths, Weaknesses, Opportunities, and Threats.
      </p>
      {/* Prompt users to sign in */}
      {!session && (
        <button
          onClick={() => signIn()}
          className="mb-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign In to Start
        </button>
      )}
      {session && (
        <form onSubmit={handleAnalyze} className="w-full max-w-lg">
          <textarea
            value={businessInfo}
            onChange={(e) => setBusinessInfo(e.target.value)}
            placeholder="Describe your business..."
            className="w-full p-4 border border-gray-300 rounded mb-4"
            rows="5"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full px-6 py-3 bg-green-600 text-white rounded"
          >
            {loading ? 'Analyzing...' : 'Generate SWOT Analysis'}
          </motion.button>
        </form>
      )}
      {/* Display the SWOT analysis report */}
      {analysis && (
        <div className="mt-8 w-full max-w-lg bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">SWOT Analysis Report</h2>
          <div>
            <h3 className="font-bold">Strengths:</h3>
            <p>{analysis.strengths}</p>
          </div>
          <div className="mt-4">
            <h3 className="font-bold">Weaknesses:</h3>
            <p>{analysis.weaknesses}</p>
          </div>
          <div className="mt-4">
            <h3 className="font-bold">Opportunities:</h3>
            <p>{analysis.opportunities}</p>
          </div>
          <div className="mt-4">
            <h3 className="font-bold">Threats:</h3>
            <p>{analysis.threats}</p>
          </div>
          {session.user.premium && (
            <div className="mt-6">
              <a 
                href={`/api/generate-report?reportId=${analysis.reportId}`} 
                className="px-4 py-2 bg-purple-600 text-white rounded"
              >
                Download PDF Report
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
