// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint128, euint128, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AnonAsk
 * @notice Anonymous Q&A Platform with FHE encryption
 * @dev Questions are encrypted and only visible to session hosts
 */
contract AnonAsk is SepoliaConfig {
    
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
        uint256 timestamp;
        bool isAnswered;
        bool isApproved;
        string answer;
        uint256 upvotes;
    }
    
    // State Variables
    mapping(uint256 => Session) public sessions;
    mapping(uint256 => Question) public questions;
    mapping(uint256 => euint128) private encryptedQuestions;
    mapping(uint256 => uint256[]) public sessionQuestions;
    mapping(address => uint256[]) public hostSessions;
    mapping(uint256 => mapping(address => bool)) public hasUpvoted;
    
    uint256 public sessionCount;
    uint256 public questionCount;
    
    // Events
    event SessionCreated(uint256 indexed sessionId, address indexed host, string topic, uint256 expiresAt);
    event QuestionSubmitted(uint256 indexed questionId, uint256 indexed sessionId, uint256 timestamp);
    event QuestionAnswered(uint256 indexed questionId, uint256 indexed sessionId, string answer);
    event QuestionApproved(uint256 indexed questionId);
    event QuestionUpvoted(uint256 indexed questionId, uint256 newUpvoteCount);
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
     * @notice Submit an anonymous encrypted question
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
            timestamp: block.timestamp,
            isAnswered: false,
            isApproved: false,
            answer: "",
            upvotes: 0
        });
        
        sessionQuestions[sessionId].push(questionCount);
        sessions[sessionId].questionCount++;
        
        emit QuestionSubmitted(questionCount, sessionId, block.timestamp);
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
     * @notice Answer a question (host only)
     * @param questionId Question ID
     * @param answer Answer text
     */
    function answerQuestion(
        uint256 questionId,
        string memory answer
    ) external {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        uint256 sessionId = questions[questionId].sessionId;
        require(sessions[sessionId].host == msg.sender, "Not session host");
        require(!questions[questionId].isAnswered, "Already answered");
        require(bytes(answer).length > 0, "Answer cannot be empty");
        
        questions[questionId].answer = answer;
        questions[questionId].isAnswered = true;
        questions[questionId].isApproved = true;
        
        sessions[sessionId].answeredCount++;
        
        emit QuestionAnswered(questionId, sessionId, answer);
    }
    
    /**
     * @notice Approve a question without answering (host only)
     * @param questionId Question ID
     */
    function approveQuestion(uint256 questionId) external {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        uint256 sessionId = questions[questionId].sessionId;
        require(sessions[sessionId].host == msg.sender, "Not session host");
        require(!questions[questionId].isApproved, "Already approved");
        
        questions[questionId].isApproved = true;
        emit QuestionApproved(questionId);
    }
    
    /**
     * @notice Upvote a question
     * @param questionId Question ID
     */
    function upvoteQuestion(uint256 questionId) external {
        require(questionId > 0 && questionId <= questionCount, "Invalid question ID");
        require(!hasUpvoted[questionId][msg.sender], "Already upvoted");
        
        questions[questionId].upvotes++;
        hasUpvoted[questionId][msg.sender] = true;
        
        emit QuestionUpvoted(questionId, questions[questionId].upvotes);
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
