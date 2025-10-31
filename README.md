# PrivateQA

**Fully Encrypted Private Q&A Platform powered by Zama FHE**

🚀 **[Live Demo](https://private-qa.vercel.app/)** | 📖 [Documentation](#getting-started) | 🔗 [Smart Contract](https://sepolia.etherscan.io/address/0xE3f872828287d456B4b6b3d4ba1c37376F1D79CF)

PrivateQA is a decentralized Q&A platform where questions and answers remain completely private through end-to-end encryption using Zama's Fully Homomorphic Encryption (FHE). Only the intended recipients can decrypt and read the content - not even the blockchain can see your data.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Smart Contract](#smart-contract)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

PrivateQA enables users to:
- **Create Q&A Sessions**: Host encrypted Q&A sessions where only you can read questions
- **Ask Private Questions**: Submit questions encrypted specifically for the session host
- **Receive Encrypted Answers**: Get answers encrypted only for you - no one else can read them
- **Personal Dashboard**: Track your questions and decrypt answers on demand

Unlike traditional Q&A platforms, PrivateQA ensures complete privacy through FHE encryption, making it ideal for:
- Confidential consultations
- Anonymous feedback collection
- Private mentorship sessions
- Sensitive Q&A discussions

---

## Key Features

### 🔐 End-to-End Encryption
- Questions encrypted for session hosts only
- Answers encrypted for specific askers only
- Powered by Zama's FHE technology
- Zero-knowledge architecture

### 👤 Privacy-First Design
- No public question/answer visibility
- Encrypted data stored on-chain
- Only authorized parties can decrypt
- No metadata leakage

### 📱 Modern User Experience
- Responsive design for all devices
- Real-time encryption progress indicators
- Intuitive dashboard for managing questions
- Seamless wallet integration via RainbowKit

### ⚡ Decentralized & Trustless
- Smart contracts on Ethereum Sepolia
- No central authority
- Transparent and verifiable
- Immutable encrypted records

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Landing    │  │   Sessions   │  │ My Questions │  │
│  │     Page     │  │    Browser   │  │   Dashboard  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Zama FHE SDK & Relayer                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Encryption/Decryption Engine                     │  │
│  │  - Question encryption (euint128)                 │  │
│  │  - Answer encryption (euint128)                   │  │
│  │  - Key management & signatures                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           Smart Contract (Ethereum Sepolia)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PrivateQA.sol                                    │  │
│  │  - Session management                             │  │
│  │  - Encrypted question storage                     │  │
│  │  - Encrypted answer storage                       │  │
│  │  - Access control (FHE.allow)                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Session Creation**: Host creates a session with title and description
2. **Question Submission**: User encrypts question → stores encrypted data on-chain → only host can decrypt
3. **Answer Submission**: Host decrypts question → encrypts answer → stores encrypted answer → only asker can decrypt
4. **Answer Retrieval**: Asker requests access → decrypts their answer → displays plaintext

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **date-fns** - Date formatting

### Blockchain
- **Solidity 0.8.24** - Smart contract language
- **Hardhat** - Development environment
- **Zama fhEVM** - FHE-enabled EVM
- **Ethereum Sepolia** - Test network

### Web3 Integration
- **wagmi** - React hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **RainbowKit** - Wallet connection UI
- **ethers.js** - Ethereum utilities

### Encryption
- **Zama FHE SDK** - Fully Homomorphic Encryption
- **fhEVM** - FHE operations on-chain
- **Relayer SDK** - Key management and decryption

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Sepolia ETH for gas fees
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/privateqa.git
cd privateqa
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Configuration

1. **Smart Contract Setup**

Create `.env` in the root directory:
```env
PRIVATE_KEY=your_wallet_private_key
INFURA_API_KEY=your_infura_api_key
```

2. **Frontend Setup**

Create `frontend/.env`:
```env
VITE_PRIVATEQA_CONTRACT_ADDRESS=0xYourDeployedContractAddress
VITE_INFURA_API_KEY=your_infura_api_key
```

### Running the Application

1. **Deploy Smart Contract** (if not already deployed)
```bash
npx hardhat run scripts/deployPrivateQA.js --network sepolia
```

2. **Start Frontend Development Server**
```bash
cd frontend
npm run dev
```

3. **Access the application**
Open http://localhost:5173 in your browser

---

## Smart Contract

### PrivateQA.sol

The core smart contract manages all encrypted Q&A operations.

**Key Functions:**

```solidity
// Create a new Q&A session
function createSession(string memory title, string memory description) 
    external returns (uint256)

// Submit an encrypted question
function submitQuestion(
    uint256 sessionId,
    externalEuint128 encryptedQuestion,
    bytes calldata inputProof
) external returns (uint256)

// Host requests access to decrypt a question
function requestQuestionAccess(uint256 questionId) external

// Get encrypted question (host only)
function getEncryptedQuestion(uint256 questionId) 
    external view returns (euint128)

// Submit encrypted answer
function answerQuestion(
    uint256 questionId,
    externalEuint128 encryptedAnswer,
    bytes calldata inputProof
) external

// Asker requests access to decrypt answer
function requestAnswerAccess(uint256 questionId) external

// Get encrypted answer (asker only)
function getEncryptedAnswer(uint256 questionId) 
    external view returns (euint128)

// Close a session (host only)
function closeSession(uint256 sessionId) external
```

**Deployed Contract:**
- Network: Ethereum Sepolia
- Address: `0xE3f872828287d456B4b6b3d4ba1c37376F1D79CF`
- [View on Etherscan](https://sepolia.etherscan.io/address/0xE3f872828287d456B4b6b3d4ba1c37376F1D79CF)

---

## How It Works

### 1. Creating a Session

```typescript
// Host creates a session
const sessionId = await createSession("Ask Me Anything", "Private Q&A session");
```

### 2. Asking a Question

```typescript
// User encrypts and submits question
const questionId = await submitQuestion(
  sessionId,
  "What is your advice on...",
  (step) => console.log(step) // Progress callback
);
```

**Encryption Process:**
1. Initialize FHE SDK
2. Convert text to BigInt (max 16 bytes)
3. Encrypt using `euint128`
4. Generate input proof
5. Submit to blockchain
6. Grant access to host via `FHE.allow()`

### 3. Answering a Question

```typescript
// Host decrypts question
const question = await decryptQuestionContent(questionId);

// Host encrypts and submits answer
await answerQuestion(
  questionId,
  "Here's my advice...",
  (step) => console.log(step)
);
```

### 4. Reading an Answer

```typescript
// Asker decrypts their answer
const answer = await decryptAnswerContent(questionId);
```

**Decryption Process:**
1. Request access via smart contract
2. Generate keypair
3. Sign EIP-712 message
4. Fetch encrypted data
5. Decrypt via Zama relayer
6. Convert BigInt back to text

---

## Project Structure

```
privateqa/
├── contracts/
│   └── PrivateQA.sol              # Main smart contract
├── scripts/
│   └── deployPrivateQA.js         # Deployment script
├── frontend/
│   ├── src/
│   │   ├── abi/
│   │   │   └── PrivateQA.json     # Contract ABI
│   │   ├── components/
│   │   │   └── ChainGuard.tsx     # Network validation
│   │   ├── config/
│   │   │   └── wagmi.ts           # Web3 configuration
│   │   ├── hooks/
│   │   │   └── usePrivateQA.ts    # Main React hook
│   │   ├── pages/
│   │   │   ├── PrivateQALandingPage.tsx
│   │   │   ├── PrivateQABrowsePage.tsx
│   │   │   ├── PrivateQACreatePage.tsx
│   │   │   ├── PrivateQASessionPage.tsx
│   │   │   ├── PrivateQAManagePage.tsx
│   │   │   └── PrivateQAMyQuestionsPage.tsx
│   │   ├── utils/
│   │   │   └── fhe.ts             # FHE utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Deployment

### Smart Contract Deployment

```bash
# Deploy to Sepolia
npx hardhat run scripts/deployPrivateQA.js --network sepolia

# Verify contract
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

### Frontend Deployment

**Vercel (Recommended):**

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Manual Build:**

```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting provider
```

---

## Security

### Encryption Security
- **FHE Encryption**: Questions and answers encrypted with Zama's FHE
- **Access Control**: Smart contract enforces who can decrypt what
- **Zero-Knowledge**: Blockchain cannot read encrypted data

### Smart Contract Security
- **Access Modifiers**: Functions restricted to authorized users
- **Input Validation**: All inputs validated on-chain
- **Reentrancy Protection**: Standard security patterns applied

### Best Practices
- Never share private keys
- Always verify contract addresses
- Use hardware wallets for production
- Test on testnet first

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Zama](https://zama.ai/) - For FHE technology and fhEVM
- [Ethereum](https://ethereum.org/) - For the blockchain infrastructure
- [Hardhat](https://hardhat.org/) - For development tools
- [RainbowKit](https://www.rainbowkit.com/) - For wallet connection UI

---

## Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Join our community discussions

---

**Built with ❤️ using Zama FHE • Powered by Ethereum Sepolia**
