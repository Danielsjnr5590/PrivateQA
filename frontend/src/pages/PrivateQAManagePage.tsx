import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { usePrivateQA, Session, Question } from '../hooks/usePrivateQA';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export function PrivateQAManagePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { 
    getSession, 
    getSessionQuestions, 
    getQuestion, 
    decryptQuestionContent,
    answerQuestion,
    closeSession 
  } = usePrivateQA();
  
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<(Question & { decryptionStep?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answeringStep, setAnsweringStep] = useState<string>('');

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const sessionData = await getSession(BigInt(sessionId!));
      
      // Check if user is host
      if (address?.toLowerCase() !== sessionData.host.toLowerCase()) {
        toast.error('You are not the host of this session');
        navigate(`/session/${sessionId}`);
        return;
      }

      setSession(sessionData);

      const questionIds = await getSessionQuestions(BigInt(sessionId!));
      console.log('Question IDs:', questionIds);
      
      const questionPromises = questionIds.map(id => getQuestion(id));
      const questionsData = await Promise.all(questionPromises);
      console.log('Questions data:', questionsData);
      console.log('First question:', questionsData[0]);
      
      // Sort: unanswered first, then by upvotes
      questionsData.sort((a, b) => {
        if (a.isAnswered !== b.isAnswered) {
          return a.isAnswered ? 1 : -1;
        }
        return Number(b.upvotes - a.upvotes);
      });
      
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrypt = async (questionId: bigint) => {
    try {
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, decryptionStep: 'Starting...' }
          : q
      ));

      const decrypted = await decryptQuestionContent(
        questionId,
        (step) => {
          setQuestions(prev => prev.map(q => 
            q.id === questionId 
              ? { ...q, decryptionStep: step }
              : q
          ));
        }
      );

      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, decryptedContent: decrypted, decryptionStep: undefined }
          : q
      ));

      toast.success('Question decrypted!');
    } catch (error: any) {
      console.error('Error decrypting:', error);
      toast.error(error.message || 'Failed to decrypt question');
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, decryptionStep: undefined }
          : q
      ));
    }
  };

  const handleAnswer = async (questionId: bigint) => {
    const answer = answerText[questionId.toString()];
    if (!answer?.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    setAnsweringId(questionId.toString());
    setAnsweringStep('');
    try {
      await answerQuestion(questionId, answer, (step) => {
        setAnsweringStep(step);
      });
      toast.success('Answer encrypted and sent!');
      setAnswerText(prev => ({ ...prev, [questionId.toString()]: '' }));
      setAnsweringStep('');
      loadSession();
    } catch (error: any) {
      console.error('Error answering:', error);
      toast.error(error.message || 'Failed to send encrypted answer');
      setAnsweringStep('');
    } finally {
      setAnsweringId(null);
    }
  };

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to close this session? This cannot be undone.')) {
      return;
    }

    try {
      await closeSession(BigInt(sessionId!));
      toast.success('Session closed');
      navigate(`/session/${sessionId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to close session');
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
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const now = Date.now() / 1000;
  const isExpired = now >= Number(session.expiresAt);
  const unansweredCount = questions.filter(q => !q.isAnswered).length;

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
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 whitespace-nowrap"
          >
            Create
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-full">
                👑 Managing Session
              </span>
              {session.isActive && !isExpired ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                  🟢 LIVE
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-bold rounded-full">
                  ⚫ ENDED
                </span>
              )}
            </div>
            
            {session.isActive && (
              <button
                onClick={handleCloseSession}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Close Session
              </button>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{session.topic}</h1>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Total Questions</p>
              <p className="text-3xl font-bold text-blue-900">{session.questionCount.toString()}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 mb-1">Unanswered</p>
              <p className="text-3xl font-bold text-orange-900">{unansweredCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Answered</p>
              <p className="text-3xl font-bold text-green-900">{session.answeredCount.toString()}</p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            Questions to Answer ({unansweredCount} pending)
          </h3>

          {questions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <span className="text-6xl mb-4 block">💭</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-600">Share your session link to receive questions!</p>
            </div>
          ) : (
            questions.map((question) => {
              if (!question || !question.id) return null;
              
              return (
                <div
                  key={question.id.toString()}
                  className={`bg-white rounded-xl border-2 p-6 ${
                    question.isAnswered ? 'border-gray-200' : 'border-orange-200'
                  }`}
                >
                <div className="flex gap-4">
                  {/* Upvotes */}
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3l6 6h-4v6H8V9H4l6-6z" />
                    </svg>
                    <span className="text-lg font-bold text-gray-700">
                      {question.upvotes ? question.upvotes.toString() : '0'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {question.isAnswered ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                          ✓ ANSWERED
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                          ⏳ PENDING
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(Number(question.timestamp) * 1000), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Encrypted Question */}
                    {!question.decryptedContent && !question.isAnswered && (
                      <div className="mb-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                          <p className="text-gray-600 flex items-center gap-2">
                            🔒 Question is encrypted
                          </p>
                        </div>
                        
                        {question.decryptionStep ? (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-orange-800 text-sm font-medium">{question.decryptionStep}</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDecrypt(question.id)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                          >
                            🔓 Decrypt Question
                          </button>
                        )}
                      </div>
                    )}

                    {/* Decrypted Question */}
                    {question.decryptedContent && !question.isAnswered && (
                      <div className="mb-4">
                        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                          <p className="text-gray-900 font-medium">{question.decryptedContent}</p>
                        </div>

                        <textarea
                          value={answerText[question.id.toString()] || ''}
                          onChange={(e) => setAnswerText(prev => ({
                            ...prev,
                            [question.id.toString()]: e.target.value
                          }))}
                          placeholder="Type your answer here..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none mb-3"
                        />

                        <button
                          onClick={() => handleAnswer(question.id)}
                          disabled={answeringId === question.id.toString()}
                          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {answeringId === question.id.toString() ? 'Publishing...' : '✓ Publish Answer'}
                        </button>

                        {answeringId === question.id.toString() && answeringStep && (
                          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-orange-900 font-semibold text-sm">{answeringStep}</p>
                                <p className="text-orange-700 text-xs mt-1">Encrypting your answer...</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Already Answered */}
                    {question.isAnswered && (
                      <div>
                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                          <p className="text-sm text-gray-600 mb-2">Question:</p>
                          <p className="text-gray-900 font-medium">
                            {question.decryptedContent || '[Decrypted]'}
                          </p>
                        </div>
                        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                          <p className="text-sm text-green-600 mb-2">Your Answer:</p>
                          <p className="text-gray-900">{question.answer}</p>
                        </div>
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
