/**
 * Convert a string message to a number for encryption
 * Supports up to 16 characters (128 bits)
 */
export function messageToNumber(message: string): bigint {
  if (message.length > 16) {
    throw new Error('Message too long. Maximum 16 characters.');
  }
  
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);
  
  let number = 0n;
  for (let i = 0; i < bytes.length; i++) {
    number |= BigInt(bytes[i]) << BigInt(i * 8);
  }
  
  return number;
}

/**
 * Convert a number back to a string message
 */
export function numberToMessage(number: bigint): string {
  const bytes: number[] = [];
  
  for (let i = 0; i < 16; i++) {
    const byte = Number((number >> BigInt(i * 8)) & 0xFFn);
    if (byte === 0) break;
    bytes.push(byte);
  }
  
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

/**
 * Encrypt a message using FHE
 */
export async function encryptMessage(
  instance: any,
  message: string
): Promise<{ data: string; proof: string }> {
  const messageNumber = messageToNumber(message);
  
  // Create encrypted input (similar to chatEncryption.ts)
  const input = instance.createEncryptedInput(instance.contractAddress, instance.userAddress);
  input.add128(messageNumber);
  
  const encrypted = await input.encrypt();
  
  // Convert to hex strings
  const handleBytes = encrypted.handles[0] as Uint8Array;
  const handleHex = '0x' + Array.from(handleBytes).map(b => (b as number).toString(16).padStart(2, '0')).join('');
  
  const proofBytes = encrypted.inputProof as Uint8Array;
  const proofHex = '0x' + Array.from(proofBytes).map(b => (b as number).toString(16).padStart(2, '0')).join('');
  
  return {
    data: handleHex,
    proof: proofHex
  };
}

/**
 * Decrypt a message using FHE
 */
export async function decryptMessage(
  instance: any,
  contractAddress: string,
  handle: Uint8Array,
  userAddress: string,
  signer: any
): Promise<string> {
  // Generate keypair
  const keypair = instance.generateKeypair();
  
  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = '365';
  const contractAddresses = [contractAddress];
  
  // Create EIP-712 signature
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimeStamp,
    durationDays
  );
  
  const signature = await signer.signTypedData({
    account: userAddress as `0x${string}`,
    domain: eip712.domain,
    types: {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    primaryType: 'UserDecryptRequestVerification',
    message: eip712.message
  });
  
  // Request decryption from relayer
  const handleContractPairs = [{ handle, contractAddress }];
  
  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    contractAddresses,
    userAddress,
    startTimeStamp,
    durationDays
  );
  
  // Extract decrypted value
  const resultKeys = Object.keys(result);
  if (resultKeys.length === 0) {
    throw new Error("Failed to decrypt message");
  }
  
  const handleKey = resultKeys[0];
  const decryptedValue = result[handleKey];
  
  if (!decryptedValue) {
    throw new Error("Failed to decrypt message");
  }
  
  const value = typeof decryptedValue === 'bigint' ? decryptedValue : BigInt(decryptedValue);
  
  return numberToMessage(value);
}

/**
 * Split long message into chunks
 */
export function splitMessage(message: string, chunkSize: number = 16): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Validate message length
 */
export function validateMessage(message: string, maxLength: number = 280): boolean {
  return message.length > 0 && message.length <= maxLength;
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: bigint): string {
  const now = Date.now();
  const messageTime = Number(timestamp) * 1000;
  const diff = now - messageTime;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Generate shareable link using userId
 */
export function generateShareLink(userId: string, baseUrl: string = window.location.origin): string {
  return `${baseUrl}/send/${userId}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}
