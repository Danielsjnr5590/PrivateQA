import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

export function PrivateQALandingPage() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">P</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PrivateQA</h1>
                <p className="text-xs text-gray-500">Private Q&A Platform</p>
              </div>
            </div>
            <div className="scale-75 sm:scale-100 origin-right">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Powered by Zama FHE • End-to-End Encrypted
          </div>
          
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Private Q&A
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              With Encrypted Answers
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Ask encrypted questions and receive private encrypted answers. 
            Only you can decrypt your answers. Perfect for private consultations and confidential Q&A.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isConnected ? (
              <>
                <button
                  onClick={() => navigate('/sessions')}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                >
                  Browse Sessions
                </button>
                <button
                  onClick={() => navigate('/my-questions')}
                  className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl font-bold text-lg hover:border-orange-500 transition-all"
                >
                  My Questions
                </button>
              </>
            ) : (
              <div className="inline-block">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                    >
                      Connect Wallet to Start
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Encrypted Questions</h3>
            <p className="text-gray-600">
              Questions are encrypted with FHE. Only session hosts can decrypt and view them.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Private Answers</h3>
            <p className="text-gray-600">
              Answers are encrypted for you only. No one else can read your private responses.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Time-Limited Sessions</h3>
            <p className="text-gray-600">
              Set session duration. Questions accepted until expiration. Perfect for scheduled Q&A.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Personal Dashboard</h3>
            <p className="text-gray-600">
              Track all your questions and answers in one place. Monitor response status.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Confidential</h3>
            <p className="text-gray-600">
              End-to-end encryption ensures complete privacy. Perfect for sensitive questions.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">⛓️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">On-Chain</h3>
            <p className="text-gray-600">
              All data stored on Ethereum. Decentralized, permanent, and censorship-resistant.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Perfect For</h2>
          <p className="text-xl text-gray-600">Multiple use cases across communities</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🚀', title: 'Crypto Projects', desc: 'Community AMAs and updates' },
            { icon: '🎤', title: 'Influencers', desc: 'Anonymous fan questions' },
            { icon: '🏢', title: 'Companies', desc: 'Employee feedback sessions' },
            { icon: '📚', title: 'Educators', desc: 'Anonymous student questions' },
            { icon: '💙', title: 'Support Groups', desc: 'Safe space discussions' },
            { icon: '🗳️', title: 'Politicians', desc: 'Town hall Q&As' },
          ].map((useCase, i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200">
              <span className="text-4xl mb-3 block">{useCase.icon}</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{useCase.title}</h3>
              <p className="text-gray-600 text-sm">{useCase.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Create your first Q&A session or browse active sessions from the community.
          </p>
          {isConnected ? (
            <button
              onClick={() => navigate('/create')}
              className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
            >
              Create Your First Session
            </button>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="px-8 py-4 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-600">
              Built with ❤️ using Zama FHE • Powered by Ethereum Sepolia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
