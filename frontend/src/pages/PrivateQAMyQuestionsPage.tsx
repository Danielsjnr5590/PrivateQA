import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePrivateQA, Session, Question } from '../hooks/usePrivateQA';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export function PrivateQAMyQuestionsPage() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { 
    getUserQuestions, 
    getQuestion, 
    getSession,
    decryptAnswerContent 
  } = usePrivateQA();
  
  const [questions, setQuestions] = useState<(Question & { 
    session?: Session;
    decryptedAnswer?: string;
    isDecrypting?: boolean;
    decryptionStep?: string;
  })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadUserQuestions();
    }
  }, [address]);

  const loadUserQuestions = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const questionIds = await getUserQuestions(address);
      console.log('User question IDs:', questionIds);
      
      const loadedQuestions = await Promise.all(
        questionIds.map(async (id) => {
          try {
            const question = await getQuestion(id);
            const session = await getSession(question.sessionId);
            return { ...question, session };
          } catch (error) {
            console.error(`Error loading question ${id}:`, error);
            return null;
          }
        })
      );

      setQuestions(loadedQuestions.filter(q => q !== null) as any[]);
    } catch (error) {
      console.error('Error loading user questions:', error);
      toast.error('Failed to load your questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecryptAnswer = async (questionId: bigint) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isDecrypting: true, decryptionStep: '' } : q
    ));

    try {
      const decrypted = await decryptAnswerContent(questionId, (step) => {
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, decryptionStep: step } : q
        ));
      });
      
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, decryptedAnswer: decrypted, isDecrypting: false, decryptionStep: undefined } : q
      ));
      
      toast.success('Answer decrypted!');
    } catch (error: any) {
      console.error('Error decrypting answer:', error);
      toast.error(error.message || 'Failed to decrypt answer');
      
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, isDecrypting: false, decryptionStep: undefined } : q
      ));
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to view your questions</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

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
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Browse
                </button>
                <button
                  onClick={() => navigate('/my-questions')}
                  className="px-4 py-2 text-orange-600 font-medium"
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
            className="px-4 py-2 bg-orange-100 text-orange-600 font-medium rounded-lg whitespace-nowrap"
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">My Questions</h1>
          <p className="text-gray-600 text-base sm:text-lg">Track your questions and decrypt private answers</p>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading your questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="text-6xl mb-4 block">💭</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-600 mb-6">Start by asking a question in an active session</p>
            <button
              onClick={() => navigate('/sessions')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Browse Sessions
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => {
              if (!question || !question.id) return null;
              
              return (
                <div
                  key={question.id.toString()}
                  className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6"
                >
                  {/* Session Info */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 
                        className="text-lg font-bold text-gray-900 hover:text-orange-600 cursor-pointer"
                        onClick={() => navigate(`/session/${question.sessionId}`)}
                      >
                        {question.session?.topic || 'Session'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        Asked {formatDistanceToNow(new Date(Number(question.timestamp) * 1000), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{question.session?.description}</p>
                  </div>

                  {/* Question Status */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {question.isAnswered ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                          ✅ ANSWERED
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                          ⏳ PENDING
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      🔒 Your question is encrypted and only visible to the session host
                    </p>
                  </div>

                  {/* Answer Section */}
                  {question.isAnswered && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      {question.decryptedAnswer ? (
                        <div>
                          <p className="text-sm font-bold text-blue-900 mb-2">Decrypted Answer:</p>
                          <p className="text-gray-800">{question.decryptedAnswer}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-blue-900 mb-2">Private Answer Available</p>
                          <p className="text-gray-600 mb-3 text-sm">
                            Your answer is encrypted. Click below to decrypt and view it.
                          </p>
                          <button
                            onClick={() => handleDecryptAnswer(question.id)}
                            disabled={question.isDecrypting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {question.isDecrypting ? (
                              <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Decrypting...
                              </span>
                            ) : (
                              '🔓 Decrypt Answer'
                            )}
                          </button>

                          {question.isDecrypting && question.decryptionStep && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                <div className="flex-1">
                                  <p className="text-blue-900 font-semibold text-sm">{question.decryptionStep}</p>
                                  <p className="text-blue-700 text-xs mt-1">Please sign any wallet prompts...</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
