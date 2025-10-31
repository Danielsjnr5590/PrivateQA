import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePrivateQA, Session } from '../hooks/usePrivateQA';
import { formatDistanceToNow } from 'date-fns';

export function PrivateQABrowsePage() {
  const navigate = useNavigate();
  const { getSession } = usePrivateQA();
  const [sessions, setSessions] = useState<(Session & { timeRemaining: string })[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('active');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // Load recent sessions (in production, you'd have an indexer or subgraph)
      const sessionIds = Array.from({ length: 10 }, (_, i) => BigInt(i + 1));
      const loadedSessions: (Session & { timeRemaining: string })[] = [];

      for (const id of sessionIds) {
        try {
          const session = await getSession(id);
          const now = Date.now() / 1000;
          const expiresAt = Number(session.expiresAt);
          const isExpired = now >= expiresAt;
          
          loadedSessions.push({
            ...session,
            timeRemaining: isExpired 
              ? 'Ended' 
              : `${Math.floor((expiresAt - now) / 3600)}h remaining`
          });
        } catch (error) {
          // Session doesn't exist, stop loading
          break;
        }
      }

      setSessions(loadedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const now = Date.now() / 1000;
    const isExpired = now >= Number(session.expiresAt);
    
    if (filter === 'active') return session.isActive && !isExpired;
    if (filter === 'ended') return !session.isActive || isExpired;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
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
                  className="px-4 py-2 text-orange-600 font-medium"
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
            className="px-4 py-2 bg-orange-100 text-orange-600 font-medium rounded-lg whitespace-nowrap"
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
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 whitespace-nowrap"
          >
            Create
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Browse Q&A Sessions</h1>
          <p className="text-gray-600 text-base sm:text-lg">Discover active sessions and ask anonymous questions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-500'
            }`}
          >
            All Sessions
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'active'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-500'
            }`}
          >
            🟢 Active
          </button>
          <button
            onClick={() => setFilter('ended')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === 'ended'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-500'
            }`}
          >
            ⚫ Ended
          </button>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600 mb-6">Be the first to create a Q&A session!</p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Create Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              if (!session || !session.id) return null;
              
              const now = Math.floor(Date.now() / 1000);
              const expiresAtNum = session.expiresAt ? Number(session.expiresAt) : 0;
              const isExpired = expiresAtNum === 0 || now >= expiresAtNum;
              const createdAt = session.createdAt ? new Date(Number(session.createdAt) * 1000) : new Date();
              
              return (
                <div
                  key={session.id ? session.id.toString() : Math.random().toString()}
                  onClick={() => navigate(`/session/${session.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {session.isActive && !isExpired ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            LIVE
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                            ENDED
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Posted {formatDistanceToNow(createdAt, { addSuffix: true })}
                        </span>
                        <span className="hidden sm:inline text-xs text-gray-500">
                          {session.timeRemaining}
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 hover:text-orange-600 transition-colors line-clamp-2">
                        {session.topic}
                      </h2>

                      <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                        {session.description}
                      </p>

                      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <span className="sm:hidden">{session.questionCount ? session.questionCount.toString() : '0'}</span>
                          <span className="hidden sm:inline">{session.questionCount ? session.questionCount.toString() : '0'} questions</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="sm:hidden">{session.answeredCount ? session.answeredCount.toString() : '0'}</span>
                          <span className="hidden sm:inline">{session.answeredCount ? session.answeredCount.toString() : '0'} answered</span>
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {session.host ? `${session.host.slice(0, 6)}...${session.host.slice(-4)}` : 'Unknown'}
                        </span>
                      </div>
                    </div>
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
