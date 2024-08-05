import forge from 'node-forge';


async function encryptMessage(message, publicKeyPem) {
    try {
      // Convert PEM-formatted public key to forge's public key object
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  
      // Encrypt the message using RSA-OAEP with MGF1-SHA256 and SHA-1
      const encrypted = publicKey.encrypt(
        forge.util.encodeUtf8(message),
        'RSA-OAEP',
        {
          md: forge.md.sha256.create(),
          mgf1: {
            md: forge.md.sha1.create()
          }
        }
      );
  
      // Convert the encrypted bytes to Base64 for easier handling
      return forge.util.encode64(encrypted);
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }
  
  async function decryptMessage(encryptedMessage, privateKeyPem=JSON.parse(localStorage.getItem("userInfo")).privatekey) {
    try {
      console.log(privateKeyPem)
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      const encryptedBytes = forge.util.decode64(encryptedMessage);
      const decrypted = privateKey.decrypt(
        encryptedBytes,
        'RSA-OAEP',
        {
          md: forge.md.sha256.create(),
          mgf1: {
            md: forge.md.sha1.create(),
          }
        }
      );
      return forge.util.decodeUtf8(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }


  
  export {encryptMessage,decryptMessage}