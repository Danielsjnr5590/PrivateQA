import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePrivateQA, Session, Question } from '../hooks/usePrivateQA';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export function PrivateQASessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { getSession, getSessionQuestions, getQuestion, submitQuestion, decryptAnswerContent } = usePrivateQA();
  
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [submissionStep, setSubmissionStep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decryptingAnswerId, setDecryptingAnswerId] = useState<string | null>(null);
  const [decryptionStep, setDecryptionStep] = useState('');

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) return;
      
      setIsLoading(true);
      try {
        // Fetch session details
        const sessionData = await getSession(BigInt(sessionId));
        setSession(sessionData);
        
        // Fetch questions
        const questionIds = await getSessionQuestions(BigInt(sessionId));
        const questionPromises = questionIds.map(id => getQuestion(id));
        const questionsData = await Promise.all(questionPromises);
        
        // Sort by upvotes (Reddit-style)
        questionsData.sort((a, b) => Number(b.upvotes - a.upvotes));
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error loading session:', error);
        toast.error('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]); // Only depend on sessionId

  const loadSession = async () => {
    if (!sessionId) return;
    
    try {
      const questionIds = await getSessionQuestions(BigInt(sessionId));
      const questionPromises = questionIds.map(id => getQuestion(id));
      const questionsData = await Promise.all(questionPromises);
      
      // Sort by upvotes (Reddit-style)
      questionsData.sort((a, b) => Number(b.upvotes - a.upvotes));
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    }
  };

  const handleSubmitQuestion = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!questionText.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitQuestion(
        BigInt(sessionId!),
        questionText,
        (step) => {
          setSubmissionStep(step);
          console.log('📝', step);
        }
      );

      toast.success('Question submitted anonymously!');
      setQuestionText('');
      setSubmissionStep('');
      
      // Reload questions
      setTimeout(() => loadSession(), 2000);
    } catch (error: any) {
      console.error('Error submitting question:', error);
      toast.error(error.message || 'Failed to submit question');
      setSubmissionStep('');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDecryptAnswer = async (questionId: bigint) => {
    setDecryptingAnswerId(questionId.toString());
    setDecryptionStep('');
    
    try {
      const decrypted = await decryptAnswerContent(questionId, (step) => {
        setDecryptionStep(step);
      });
      
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, decryptedAnswer: decrypted } : q
      ));
      
      toast.success('Answer decrypted!');
    } catch (error: any) {
      console.error('Error decrypting answer:', error);
      toast.error(error.message || 'Failed to decrypt answer');
    } finally {
      setDecryptingAnswerId(null);
      setDecryptionStep('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">❌</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session not found</h2>
          <button
            onClick={() => navigate('/sessions')}
            className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold"
          >
            Browse Sessions
          </button>
        </div>
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAtNum = session.expiresAt ? Number(session.expiresAt) : 0;
  const isExpired = expiresAtNum === 0 || now >= expiresAtNum;
  const isHost = address && session.host ? address.toLowerCase() === session.host.toLowerCase() : false;
  
  let timeRemaining = 'Ended';
  if (!isExpired && expiresAtNum > 0) {
    const secondsLeft = expiresAtNum - now;
    const hoursLeft = Math.floor(secondsLeft / 3600);
    const minutesLeft = Math.floor((secondsLeft % 3600) / 60);
    
    if (hoursLeft > 0) {
      timeRemaining = `${hoursLeft}h remaining`;
    } else if (minutesLeft > 0) {
      timeRemaining = `${minutesLeft}m remaining`;
    } else {
      timeRemaining = 'Ending soon';
    }
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
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 whitespace-nowrap"
          >
            Create
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Session Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {session.isActive && !isExpired ? (
              <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-xs sm:text-sm font-bold rounded-full">
                🟢 LIVE
              </span>
            ) : (
              <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm font-bold rounded-full">
                ⚫ ENDED
              </span>
            )}
            <span className="text-xs sm:text-sm text-gray-500">{timeRemaining}</span>
            {isHost && (
              <span className="ml-auto px-2 sm:px-3 py-1 bg-orange-100 text-orange-700 text-xs sm:text-sm font-bold rounded-full">
                👑 Your Session
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{session.topic}</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{session.description}</p>

          <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {session.host ? `${session.host.slice(0, 6)}...${session.host.slice(-4)}` : 'Unknown'}
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {session.questionCount ? session.questionCount.toString() : '0'} questions
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {session.answeredCount ? session.answeredCount.toString() : '0'} answered
            </span>
          </div>

          {isHost && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate(`/manage/${sessionId}`)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Manage Session
              </button>
            </div>
          )}
        </div>

        {/* Ask Question Form */}
        {!isExpired && session.isActive && !isHost && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Ask a Question Anonymously</h3>
            
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your anonymous question here..."
              rows={4}
              maxLength={280}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none mb-3"
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{questionText.length}/280</span>
              
              {!isConnected ? (
                <ConnectButton />
              ) : (
                <button
                  onClick={handleSubmitQuestion}
                  disabled={isSubmitting || !questionText.trim()}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Anonymously'}
                </button>
              )}
            </div>

            {submissionStep && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-orange-900 font-semibold text-sm">{submissionStep}</p>
                      <p className="text-orange-700 text-xs mt-1">Please wait and sign any wallet prompts...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Questions ({questions.length})
          </h3>

          {questions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <span className="text-6xl mb-4 block">💭</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-600">
                {isHost 
                  ? 'Waiting for questions from the community...' 
                  : 'Be the first to ask a question!'}
              </p>
            </div>
          ) : (
            questions.map((question) => {
              if (!question || !question.id) return null;
              
              return (
                <div
                  key={question.id.toString()}
                  className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all"
                >
                <div className="flex gap-3 sm:gap-4">
                  {/* Content */}
                  <div className="flex-1">
                    {question.isAnswered ? (
                      <>
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                              ANSWERED
                            </span>
                            <span className="text-xs text-gray-500">
                              {question.timestamp ? formatDistanceToNow(new Date(Number(question.timestamp) * 1000), { addSuffix: true }) : 'Recently'}
                            </span>
                          </div>
                          <p className="text-gray-900 font-medium">
                            {question.decryptedContent || '[Encrypted Question]'}
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          {question.asker?.toLowerCase() === address?.toLowerCase() ? (
                            <div>
                              {question.decryptedAnswer ? (
                                <div>
                                  <p className="text-sm font-bold text-blue-900 mb-2">Your Answer:</p>
                                  <p className="text-gray-800">{question.decryptedAnswer}</p>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-start gap-2 mb-3">
                                    <span className="text-blue-500 mt-1">🔒</span>
                                    <div>
                                      <p className="text-sm font-bold text-blue-900 mb-1">Answer Status:</p>
                                      <p className="text-gray-800">✅ Answered - Click below to decrypt</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDecryptAnswer(question.id)}
                                    disabled={decryptingAnswerId === question.id.toString()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                  >
                                    {decryptingAnswerId === question.id.toString() ? (
                                      <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Decrypting...
                                      </span>
                                    ) : (
                                      '🔓 Decrypt Answer'
                                    )}
                                  </button>
                                  {decryptingAnswerId === question.id.toString() && decryptionStep && (
                                    <div className="mt-3 bg-blue-100 border border-blue-300 rounded-lg p-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-blue-900 text-sm font-medium">{decryptionStep}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">🔒</span>
                              <div>
                                <p className="text-sm font-bold text-blue-900 mb-1">Answer Status:</p>
                                <p className="text-gray-800">🔒 Encrypted answer (only visible to asker)</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                            PENDING
                          </span>
                          <span className="text-xs text-gray-500">
                            {question.timestamp ? formatDistanceToNow(new Date(Number(question.timestamp) * 1000), { addSuffix: true }) : 'Recently'}
                          </span>
                        </div>
                        <p className="text-gray-600">
                          🔒 Question encrypted - waiting for host to answer
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
