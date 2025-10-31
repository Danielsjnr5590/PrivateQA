import { useState } from 'react';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import PrivateQAABI from '../abi/PrivateQA.json';
import { initializeFHE, encryptData, decryptQuestion, decryptAnswer } from '../utils/fhe';

const CONTRACT_ADDRESS = import.meta.env.VITE_PRIVATEQA_CONTRACT_ADDRESS;

export interface Session {
  id: bigint;
  host: string;
  topic: string;
  description: string;
  createdAt: bigint;
  expiresAt: bigint;
  isActive: boolean;
  questionCount: bigint;
  answeredCount: bigint;
}

export interface Question {
  id: bigint;
  sessionId: bigint;
  asker: string;
  timestamp: bigint;
  isAnswered: boolean;
  decryptedContent?: string;
  decryptedAnswer?: string;
}

export function usePrivateQA() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Create Session
  const createSession = async (
    topic: string,
    description: string,
    durationHours: number,
    onProgress?: (step: string) => void
  ): Promise<bigint> => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      onProgress?.('Creating session...');
      const duration = BigInt(durationHours * 3600);
      
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrivateQAABI.abi,
        functionName: 'createSession',
        args: [topic, description, duration],
      });

      onProgress?.('Waiting for confirmation...');
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      
      // Get session ID from event
      const log = receipt?.logs[0];
      const sessionId = log?.topics[1] ? BigInt(log.topics[1]) : 1n;
      
      return sessionId;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Question
  const submitQuestion = async (
    sessionId: bigint,
    questionText: string,
    onProgress?: (step: string) => void
  ): Promise<bigint> => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      onProgress?.('Initializing FHE...');
      const instance = await initializeFHE();
      
      onProgress?.('Encrypting question...');
      const { encryptedData, inputProof } = await encryptData(
        instance,
        questionText,
        CONTRACT_ADDRESS,
        address
      );

      onProgress?.('Submitting to blockchain...');
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrivateQAABI.abi,
        functionName: 'submitQuestion',
        args: [sessionId, encryptedData, inputProof],
        gas: 500000n,
      });

      onProgress?.('Waiting for confirmation...');
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      
      const log = receipt?.logs[0];
      const questionId = log?.topics[1] ? BigInt(log.topics[1]) : 1n;
      
      return questionId;
    } finally {
      setIsLoading(false);
    }
  };

  // Get Session
  const getSession = async (sessionId: bigint): Promise<Session> => {
    if (!publicClient) throw new Error('Public client not available');

    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrivateQAABI.abi,
      functionName: 'getSession',
      args: [sessionId],
    }) as any;

    console.log('Raw session result:', result);

    if (Array.isArray(result)) {
      return {
        id: result[0],
        host: result[1],
        topic: result[2],
        description: result[3],
        createdAt: result[4],
        expiresAt: result[5],
        isActive: result[6],
        questionCount: result[7],
        answeredCount: result[8],
      };
    } else {
      return {
        id: result.id,
        host: result.host,
        topic: result.topic,
        description: result.description,
        createdAt: result.createdAt,
        expiresAt: result.expiresAt,
        isActive: result.isActive,
        questionCount: result.questionCount,
        answeredCount: result.answeredCount,
      };
    }
  };

  // Get Session Questions
  const getSessionQuestions = async (sessionId: bigint): Promise<bigint[]> => {
    if (!publicClient) throw new Error('Public client not available');

    const questionIds = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrivateQAABI.abi,
      functionName: 'getSessionQuestions',
      args: [sessionId],
    }) as bigint[];

    return questionIds;
  };

  // Get User Questions
  const getUserQuestions = async (userAddress: string): Promise<bigint[]> => {
    if (!publicClient) throw new Error('Public client not available');

    const questionIds = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrivateQAABI.abi,
      functionName: 'getUserQuestions',
      args: [userAddress],
    }) as bigint[];

    return questionIds;
  };

  // Get Question
  const getQuestion = async (questionId: bigint): Promise<Question> => {
    if (!publicClient) throw new Error('Public client not available');

    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrivateQAABI.abi,
      functionName: 'getQuestion',
      args: [questionId],
    }) as any;

    console.log('Raw question result:', result);

    if (Array.isArray(result)) {
      return {
        id: result[0],
        sessionId: result[1],
        asker: result[2],
        timestamp: result[3],
        isAnswered: result[4],
      };
    } else {
      return {
        id: result.id,
        sessionId: result.sessionId,
        asker: result.asker,
        timestamp: result.timestamp,
        isAnswered: result.isAnswered,
      };
    }
  };

  // Decrypt Question Content (Host Only)
  const decryptQuestionContent = async (
    questionId: bigint,
    onProgress?: (step: string) => void
  ): Promise<string> => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      onProgress?.('Initializing FHE...');
      const instance = await initializeFHE();
      
      onProgress?.('Requesting access...');
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrivateQAABI.abi,
        functionName: 'requestQuestionAccess',
        args: [questionId],
        gas: 200000n,
      });
      
      await publicClient?.waitForTransactionReceipt({ hash });
      
      onProgress?.('Fetching encrypted question...');
      const encryptedHandle = await publicClient?.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrivateQAABI.abi,
        functionName: 'getEncryptedQuestion',
        args: [questionId],
        account: address as `0x${string}`,
      });

      onProgress?.('Decrypting question...');
      const decrypted = await decryptQuestion(
        instance,
        CONTRACT_ADDRESS,
        encryptedHandle as Uint8Array,
        address,
        walletClient
      );

      return decrypted;
    } finally {
      setIsLoading(false);
    }
  };

  // Answer Question (Host Only)
  const answerQuestion = async (
    questionId: bigint,
    answerText: string,
    onProgress?: (step: string) => void
  ): Promise<void> => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      onProgress?.('Initializing FHE...');
      const instance = await initializeFHE();
      
      onProgress?.('Encrypting answer...');
      const { encryptedData, inputProof } = await encryptData(
        instance,
        answerText,
        CONTRACT_ADDRESS,
        address
      );

      onProgress?.('Submitting answer...');
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrivateQAABI.abi,
        functionName: 'answerQuestion',
        args: [questionId, encryptedData, inputProof],
        gas: 500000n,
      });

      onProgress?.('Waiting for confirmation...');
      await publicClient?.waitForTransactionReceipt({ hash });
    } finally {
      setIsLoading(false);
    }
  };

  // Decrypt Answer (Asker Only)
  const decryptAnswerContent = async (
    questionId: bigint,
    onProgress?: (step: string) => void
  ): Promise<string> => {
    if (!walletClient || !address) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      onProgress?.('Initializing FHE...');
      const instance = await initializeFHE();
      
      onProgress?.('Requesting access...');
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrivateQAABI.abi,
        functionName: 'requestAnswerAccess',
        args: [questionId],
        gas: 200000n,
      });
      
      await publicClient?.waitForTransactionReceipt({ hash });
      
      onProgress?.('Fetching encrypted answer...');
      const encryptedHandle = await publicClient?.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrivateQAABI.abi,
        functionName: 'getEncryptedAnswer',
        args: [questionId],
        account: address as `0x${string}`,
      });

      onProgress?.('Decrypting answer...');
      const decrypted = await decryptAnswer(
        instance,
        CONTRACT_ADDRESS,
        encryptedHandle as Uint8Array,
        address,
        walletClient
      );

      return decrypted;
    } finally {
      setIsLoading(false);
    }
  };

  // Close Session
  const closeSession = async (sessionId: bigint): Promise<void> => {
    if (!walletClient) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PrivateQAABI.abi,
        functionName: 'closeSession',
        args: [sessionId],
      });

      await publicClient?.waitForTransactionReceipt({ hash });
    } finally {
      setIsLoading(false);
    }
  };

  // Get Host Sessions
  const getHostSessions = async (hostAddress: string): Promise<bigint[]> => {
    if (!publicClient) throw new Error('Public client not available');

    const sessionIds = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PrivateQAABI.abi,
      functionName: 'getHostSessions',
      args: [hostAddress],
    }) as bigint[];

    return sessionIds;
  };

  return {
    createSession,
    submitQuestion,
    getSession,
    getSessionQuestions,
    getUserQuestions,
    getQuestion,
    decryptQuestionContent,
    answerQuestion,
    decryptAnswerContent,
    closeSession,
    getHostSessions,
    isLoading,
  };
}
