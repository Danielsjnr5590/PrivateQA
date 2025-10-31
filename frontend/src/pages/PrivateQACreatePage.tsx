import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePrivateQA } from '../hooks/usePrivateQA';
import toast from 'react-hot-toast';

export function PrivateQACreatePage() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { createSession, isLoading } = usePrivateQA();
  
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('24');
  const [creationStep, setCreationStep] = useState('');

  const handleCreate = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      const sessionId = await createSession(
        topic,
        description,
        parseInt(duration),
        (step) => {
          setCreationStep(step);
          console.log('📝', step);
        }
      );

      toast.success('Session created successfully!');
      navigate(`/session/${sessionId}`);
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast.error(error.message || 'Failed to create session');
      setCreationStep('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={() => navigate('/')} className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg sm:text-xl font-bold">P</span>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-900">PrivateQA</span>
              </button>
              
              <nav className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => navigate('/sessions')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Browse
                </button>
                <button
                  onClick={() => navigate('/my-questions')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  My Questions
                </button>
                <button
                  onClick={() => navigate('/create')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                >
                  Create
                </button>
              </nav>
            </div>
            <div className="scale-75 sm:scale-100 origin-right">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => navigate('/sessions')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            Browse
          </button>
          <button
            onClick={() => navigate('/my-questions')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            My Questions
          </button>
          <button
            onClick={() => navigate('/create')}
            className="px-4 py-2 bg-orange-100 text-orange-600 font-medium rounded-lg whitespace-nowrap"
          >
            Create
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Q&A Session</h1>
          <p className="text-gray-600">Start an anonymous Q&A session with your community</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Topic */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Session Topic *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Ask me anything about Web3 development"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                {topic.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more context about your Q&A session..."
                rows={5}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                {description.length}/500 characters
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Session Duration
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: '1', label: '1 hour' },
                  { value: '6', label: '6 hours' },
                  { value: '24', label: '24 hours' },
                  { value: '168', label: '1 week' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setDuration(value)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      duration === value
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="text-blue-500 text-xl">ℹ️</span>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 mb-1">How it works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Questions are encrypted and anonymous</li>
                    <li>• Only you can decrypt and view questions</li>
                    <li>• Answer publicly or skip questions</li>
                    <li>• Session auto-closes after duration expires</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            {creationStep && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-orange-800 font-medium">{creationStep}</span>
                </div>
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={isLoading || !topic.trim() || !description.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Session...' : 'Create Session'}
            </button>

            {!isConnected && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Connect your wallet to create a session</p>
                <ConnectButton />
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">💡 Tips for a great session</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex gap-2">
              <span>✓</span>
              <span>Choose a clear, specific topic that invites questions</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Provide context in the description to help people ask better questions</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Share your session link on social media to get more questions</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Check back regularly to answer new questions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
