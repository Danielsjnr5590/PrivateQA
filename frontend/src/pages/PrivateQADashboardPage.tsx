import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePrivateQA, Session } from '../hooks/usePrivateQA';
import { formatDistanceToNow } from 'date-fns';

export function PrivateQADashboardPage() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { getHostSessions, getSession } = usePrivateQA();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadSessions();
    }
  }, [isConnected, address]);

  const loadSessions = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const sessionIds = await getHostSessions(address);
      const sessionPromises = sessionIds.map(id => getSession(id));
      const sessionsData = await Promise.all(sessionPromises);
      
      // Sort by creation date (newest first)
      sessionsData.sort((a, b) => Number(b.createdAt - a.createdAt));
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🔐</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Connect your wallet to view your sessions</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

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
                  onClick={() => navigate('/create')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-orange-600 font-medium"
                >
                  My Sessions
                </button>
              </nav>
            </div>
            <div className="scale-75 sm:scale-100 origin-right">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sessions</h1>
            <p className="text-gray-600">Manage your Q&A sessions</p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            + Create New Session
          </button>
        </div>

        {/* Stats Cards */}
        {sessions.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessions.reduce((sum, s) => sum + Number(s.questionCount), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Answered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessions.reduce((sum, s) => sum + Number(s.answeredCount), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading your sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-600 mb-6">Create your first Q&A session to get started!</p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Create Your First Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const now = Date.now() / 1000;
              const isExpired = now >= Number(session.expiresAt);
              const createdAt = new Date(Number(session.createdAt) * 1000);
              const unansweredCount = Number(session.questionCount) - Number(session.answeredCount);
              
              return (
                <div
                  key={session.id.toString()}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {session.isActive && !isExpired ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                            🟢 LIVE
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                            ⚫ ENDED
                          </span>
                        )}
                        {unansweredCount > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                            {unansweredCount} pending
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Created {formatDistanceToNow(createdAt, { addSuffix: true })}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">{session.topic}</h3>
                      <p className="text-gray-600 line-clamp-2 mb-4">{session.description}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {session.questionCount.toString()} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {session.answeredCount.toString()} answered
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/manage/${session.id}`)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                    >
                      Manage Session
                    </button>
                    <button
                      onClick={() => navigate(`/session/${session.id}`)}
                      className="flex-1 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-bold hover:border-orange-500 transition-all"
                    >
                      View Public Page
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
