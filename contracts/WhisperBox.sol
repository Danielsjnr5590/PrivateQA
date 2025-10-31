// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint128, euint128, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title WhisperBox
 * @notice Anonymous messaging platform with FHE encrypted messages
 * @dev Fully anonymous - sender addresses are not stored
 */
contract WhisperBox is SepoliaConfig {
    // Structs
    struct UserProfile {
        address userAddress;
        string userId;          // Unique random ID (e.g., "a1b2c3d4")
        string username;        // Display name
        uint256 messageCount;
        uint256 createdAt;
        bool isActive;
    }
    
    struct Message {
        uint256 id;
        address recipient;
        uint256 timestamp;
        bool isRead;
    }
    
    // State variables
    mapping(address => UserProfile) public profiles;
    mapping(string => address) public userIdToAddress;  // Map userId to address
    mapping(address => uint256[]) public userMessages;
    mapping(uint256 => Message) public messages;
    mapping(uint256 => euint128) private encryptedMessages;
    
    uint256 public messageCounter;
    uint256 private nonce;  // For generating unique IDs
    
    // Events
    event ProfileCreated(address indexed user, string username, uint256 timestamp);
    event MessageSent(uint256 indexed messageId, address indexed recipient, uint256 timestamp);
    event MessageRead(uint256 indexed messageId, address indexed reader, uint256 timestamp);
    
    // Modifiers
    modifier profileExists(address user) {
        require(profiles[user].isActive, "Profile does not exist");
        _;
    }
    
    modifier messageExists(uint256 messageId) {
        require(messageId > 0 && messageId < messageCounter, "Message does not exist");
        _;
    }
    
    modifier onlyRecipient(uint256 messageId) {
        require(messages[messageId].recipient == msg.sender, "Not the recipient");
        _;
    }
    
    constructor() {
        messageCounter = 1;
        nonce = 0;
    }
    
    /**
     * @notice Create a user profile with auto-generated unique ID and username
     */
    function createProfile() external {
        require(!profiles[msg.sender].isActive, "Profile already exists");
        
        // Generate unique user ID
        string memory userId = generateUserId();
        
        // Generate username from ID
        string memory username = string(abi.encodePacked("user_", userId));
        
        profiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            userId: userId,
            username: username,
            messageCount: 0,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Map userId to address
        userIdToAddress[userId] = msg.sender;
        
        emit ProfileCreated(msg.sender, username, block.timestamp);
    }
    
    /**
     * @notice Generate a unique user ID
     * @return 8-character hex ID (e.g., "a1b2c3d4")
     */
    function generateUserId() internal returns (string memory) {
        nonce++;
        bytes32 hash = keccak256(abi.encodePacked(msg.sender, block.timestamp, nonce));
        bytes memory hashBytes = new bytes(4);
        
        for (uint i = 0; i < 4; i++) {
            hashBytes[i] = hash[i];
        }
        
        return toHexString(hashBytes);
    }
    
    /**
     * @notice Convert bytes to hex string
     * @param data Bytes to convert
     * @return Hex string
     */
    function toHexString(bytes memory data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory str = new bytes(data.length * 2);
        
        for (uint i = 0; i < data.length; i++) {
            str[i * 2] = hexChars[uint8(data[i] >> 4)];
            str[i * 2 + 1] = hexChars[uint8(data[i] & 0x0f)];
        }
        
        return string(str);
    }
    
    /**
     * @notice Send an anonymous encrypted message using recipient's userId
     * @param recipientUserId Recipient's unique user ID
     * @param encryptedContent Encrypted message content (euint128)
     * @param inputProof FHE input proof
     */
    function sendAnonymousMessage(
        string memory recipientUserId,
        externalEuint128 encryptedContent,
        bytes calldata inputProof
    ) external returns (uint256) {
        // Get recipient address from userId
        address recipient = userIdToAddress[recipientUserId];
        require(recipient != address(0), "User ID does not exist");
        require(profiles[recipient].isActive, "Profile does not exist");
        
        uint256 messageId = messageCounter++;
        
        // Store message metadata
        messages[messageId] = Message({
            id: messageId,
            recipient: recipient,
            timestamp: block.timestamp,
            isRead: false
        });
        
        // Store encrypted content
        euint128 content = FHE.fromExternal(encryptedContent, inputProof);
        encryptedMessages[messageId] = content;
        
        // Grant decrypt permission to recipient
        FHE.allow(content, recipient);
        FHE.allowThis(content);
        
        // Update recipient's message list
        userMessages[recipient].push(messageId);
        profiles[recipient].messageCount++;
        
        emit MessageSent(messageId, recipient, block.timestamp);
        
        return messageId;
    }
    
    /**
     * @notice Get all message IDs for the caller
     * @return Array of message IDs
     */
    function getMyMessages() external view returns (uint256[] memory) {
        return userMessages[msg.sender];
    }
    
    /**
     * @notice Get message metadata
     * @param messageId Message ID
     * @return Message struct
     */
    function getMessage(uint256 messageId) 
        external 
        view 
        messageExists(messageId)
        onlyRecipient(messageId)
        returns (Message memory) 
    {
        return messages[messageId];
    }
    
    /**
     * @notice Get encrypted message content
     * @param messageId Message ID
     * @return Encrypted message content
     */
    function getEncryptedMessage(uint256 messageId)
        external
        view
        messageExists(messageId)
        onlyRecipient(messageId)
        returns (euint128)
    {
        return encryptedMessages[messageId];
    }
    
    /**
     * @notice Request access to encrypted message
     * @param messageId Message ID
     */
    function requestMessageAccess(uint256 messageId)
        external
        messageExists(messageId)
        onlyRecipient(messageId)
    {
        euint128 content = encryptedMessages[messageId];
        FHE.allow(content, msg.sender);
    }
    
    /**
     * @notice Mark a message as read
     * @param messageId Message ID
     */
    function markAsRead(uint256 messageId)
        external
        messageExists(messageId)
        onlyRecipient(messageId)
    {
        require(!messages[messageId].isRead, "Message already read");
        messages[messageId].isRead = true;
        
        emit MessageRead(messageId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Get user profile by address
     * @param user User address
     * @return UserProfile struct
     */
    function getProfile(address user) 
        external 
        view 
        profileExists(user)
        returns (UserProfile memory) 
    {
        return profiles[user];
    }
    
    /**
     * @notice Get user profile by userId
     * @param userId User's unique ID
     * @return UserProfile struct
     */
    function getProfileByUserId(string memory userId) 
        external 
        view 
        returns (UserProfile memory) 
    {
        address user = userIdToAddress[userId];
        require(user != address(0), "User ID does not exist");
        require(profiles[user].isActive, "Profile does not exist");
        return profiles[user];
    }
    
    /**
     * @notice Get address from userId
     * @param userId User's unique ID
     * @return User address
     */
    function getAddressFromUserId(string memory userId) 
        external 
        view 
        returns (address) 
    {
        address user = userIdToAddress[userId];
        require(user != address(0), "User ID does not exist");
        return user;
    }
    
    /**
     * @notice Get unread message count
     * @return Number of unread messages
     */
    function getUnreadCount() external view returns (uint256) {
        uint256[] memory messageIds = userMessages[msg.sender];
        uint256 unreadCount = 0;
        
        for (uint256 i = 0; i < messageIds.length; i++) {
            if (!messages[messageIds[i]].isRead) {
                unreadCount++;
            }
        }
        
        return unreadCount;
    }
    
    /**
     * @notice Get messages with pagination
     * @param offset Starting index
     * @param limit Number of messages to return
     * @return Array of message IDs
     */
    function getMessagesPaginated(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory allMessages = userMessages[msg.sender];
        
        if (offset >= allMessages.length) {
            return new uint256[](0);
        }
        
        uint256 remaining = allMessages.length - offset;
        uint256 resultSize = remaining < limit ? remaining : limit;
        uint256[] memory result = new uint256[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = allMessages[offset + i];
        }
        
        return result;
    }
}
