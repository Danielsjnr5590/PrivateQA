// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint128, euint128, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PrivateQA
 * @notice Private Q&A Platform with FHE encryption
 * @dev Questions encrypted for host, answers encrypted for asker
 */
contract PrivateQA is SepoliaConfig {
    
    // Structs
    struct Session {
        uint256 id;
        address host;
        string topic;
        string description;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
        uint256 questionCount;
        uint256 answeredCount;
    }
    
    struct Question {
        uint256 id;
        uint256 sessionId;
        address asker;
        uint256 timestamp;
        bool isAnswered;
    }
    
    // State Variables
    mapping(uint256 => Session) public sessions;
    mapping(uint256 => Question) public questions;
    mapping(uint256 => euint128) private encryptedQuestions;
    mapping(uint256 => euint128) private encryptedAnswers;
    mapping(uint256 => uint256[]) public sessionQuestions;
    mapping(address => uint256[]) public hostSessions;
    mapping(address => uint256[]) public userQuestions;
    
    uint256 public sessionCount;
    uint256 public questionCount;
    
    // Events
    event SessionCreated(uint256 indexed sessionId, address indexed host, string topic, uint256 expiresAt);
    event QuestionSubmitted(uint256 indexed questionId, uint256 indexed sessionId, address indexed asker, uint256 timestamp);
    event QuestionAnswered(uint256 indexed questionId, uint256 indexed sessionId);
    event SessionClosed(uint256 indexed sessionId);
    
    // Modifiers
    modifier onlyHost(uint256 sessionId) {
        require(sessions[sessionId].host == msg.sender, "Not session host");
        _;
    }
    
    modifier sessionExists(uint256 sessionId) {
        require(sessionId > 0 && sessionId <= sessionCount, "Session does not exist");
        _;
    }
    
    modifier sessionActive(uint256 sessionId) {
        require(sessions[sessionId].isActive, "Session not active");
        require(block.timestamp < sessions[sessionId].expiresAt, "Session expired");
        _;
    }
    
    /**
     * @notice Create a new Q&A session
     * @param topic Session topic
     * @param description Session description
     * @param duration Duration in seconds
     * @return sessionId The created session ID
     */
    function createSession(
        string memory topic,
        string memory description,
        uint256 duration
    ) external returns (uint256) {
        require(bytes(topic).length > 0, "Topic cannot be empty");
        require(duration > 0, "Duration must be positive");
        
        sessionCount++;
        uint256 expiresAt = block.timestamp + duration;
        
        sessions[sessionCount] = Session({
            id: sessionCount,
            host: msg.sender,
            topic: topic,
            description: description,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true,
            questionCount: 0,
            answeredCount: 0
        });
        
        hostSessions[msg.sender].push(sessionCount);
        
        emit SessionCreated(sessionCount, msg.sender, topic, expiresAt);
        return sessionCount;
    }
    
    /**
     * @notice Submit an encrypted question
     * @param sessionId Target session ID
     * @param encryptedQuestion Encrypted question data
     * @return questionId The created question ID
     */
    function submitQuestion(
        uint256 sessionId,
        externalEuint128 encryptedQuestion,
        bytes calldata inputProof
    ) external sessionExists(sessionId) sessionActive(sessionId) returns (uint256) {
        questionCount++;
        
        // Store encrypted question
        euint128 question = FHE.fromExternal(encryptedQuestion, inputProof);
        encryptedQuestions[questionCount] = question;
        FHE.allowThis(question);
        FHE.allow(question, sessions[sessionId].host);
        
        questions[questionCount] = Question({
            id: questionCount,
            sessionId: sessionId,
            asker: msg.sender,
            timestamp: block.timestamp,
            isAnswered: false
        });
        
        sessionQuestions[sessionId].push(questionCount);
        userQuestions[msg.sender].push(questionCount);
        sessions[sessionId].questionCount++;
        
        emit QuestionSubmitted(questionCount, sessionId, msg.sender, block.timestamp);
        return questionCount;
    }
    
    /**
     * @notice Request access to decrypt a question (host only)
     * @param questionId Question ID to access
     */
    function requestQuestionAccess(uint256 questionId) external {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        uint256 sessionId = questions[questionId].sessionId;
        require(sessions[sessionId].host == msg.sender, "Not session host");
        
        FHE.allow(encryptedQuestions[questionId], msg.sender);
    }
    
    /**
     * @notice Get encrypted question (host only)
     * @param questionId Question ID
     * @return Encrypted question
     */
    function getEncryptedQuestion(uint256 questionId) 
        external 
        view 
        returns (euint128) 
    {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        uint256 sessionId = questions[questionId].sessionId;
        require(sessions[sessionId].host == msg.sender, "Not session host");
        
        return encryptedQuestions[questionId];
    }
    
    /**
     * @notice Answer a question with encrypted answer (host only)
     * @param questionId Question ID
     * @param encryptedAnswer Encrypted answer data
     */
    function answerQuestion(
        uint256 questionId,
        externalEuint128 encryptedAnswer,
        bytes calldata inputProof
    ) external {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        uint256 sessionId = questions[questionId].sessionId;
        require(sessions[sessionId].host == msg.sender, "Not session host");
        require(!questions[questionId].isAnswered, "Already answered");
        
        // Store encrypted answer
        euint128 answer = FHE.fromExternal(encryptedAnswer, inputProof);
        encryptedAnswers[questionId] = answer;
        FHE.allowThis(answer);
        FHE.allow(answer, questions[questionId].asker);
        
        questions[questionId].isAnswered = true;
        sessions[sessionId].answeredCount++;
        
        emit QuestionAnswered(questionId, sessionId);
    }
    
    /**
     * @notice Request access to decrypt an answer (asker only)
     * @param questionId Question ID to access
     */
    function requestAnswerAccess(uint256 questionId) external {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        require(questions[questionId].asker == msg.sender, "Not question asker");
        require(questions[questionId].isAnswered, "Question not answered yet");
        
        FHE.allow(encryptedAnswers[questionId], msg.sender);
    }
    
    /**
     * @notice Get encrypted answer (asker only)
     * @param questionId Question ID
     * @return Encrypted answer
     */
    function getEncryptedAnswer(uint256 questionId) 
        external 
        view 
        returns (euint128) 
    {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        require(questions[questionId].asker == msg.sender, "Not question asker");
        require(questions[questionId].isAnswered, "Question not answered yet");
        
        return encryptedAnswers[questionId];
    }
    
    /**
     * @notice Close a session (host only)
     * @param sessionId Session ID
     */
    function closeSession(uint256 sessionId) 
        external 
        sessionExists(sessionId) 
        onlyHost(sessionId) 
    {
        require(sessions[sessionId].isActive, "Session already closed");
        sessions[sessionId].isActive = false;
        
        emit SessionClosed(sessionId);
    }
    
    /**
     * @notice Get all questions for a session
     * @param sessionId Session ID
     * @return Array of question IDs
     */
    function getSessionQuestions(uint256 sessionId) 
        external 
        view 
        sessionExists(sessionId)
        returns (uint256[] memory) 
    {
        return sessionQuestions[sessionId];
    }
    
    /**
     * @notice Get all questions asked by a user
     * @param user User address
     * @return Array of question IDs
     */
    function getUserQuestions(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userQuestions[user];
    }
    
    /**
     * @notice Get all sessions hosted by an address
     * @param host Host address
     * @return Array of session IDs
     */
    function getHostSessions(address host) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return hostSessions[host];
    }
    
    /**
     * @notice Get session details
     * @param sessionId Session ID
     * @return Session struct
     */
    function getSession(uint256 sessionId) 
        external 
        view 
        sessionExists(sessionId)
        returns (Session memory) 
    {
        return sessions[sessionId];
    }
    
    /**
     * @notice Get question details
     * @param questionId Question ID
     * @return Question struct
     */
    function getQuestion(uint256 questionId) 
        external 
        view 
        returns (Question memory) 
    {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        return questions[questionId];
    }
    
    /**
     * @notice Check if session is expired
     * @param sessionId Session ID
     * @return True if expired
     */
    function isSessionExpired(uint256 sessionId) 
        external 
        view 
        sessionExists(sessionId)
        returns (bool) 
    {
        return block.timestamp >= sessions[sessionId].expiresAt;
    }
    
    /**
     * @notice Get active sessions count
     * @return Count of active sessions
     */
    function getActiveSessionsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= sessionCount; i++) {
            if (sessions[i].isActive && block.timestamp < sessions[i].expiresAt) {
                count++;
            }
        }
        return count;
    }
}
