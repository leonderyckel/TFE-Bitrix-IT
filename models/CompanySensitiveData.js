const mongoose = require('mongoose');
const crypto = require('crypto');

// Récupère la clé de chiffrement depuis les variables d'environnement
const ENCRYPTION_KEY_FROM_MODEL_SCOPE = process.env.ENCRYPTION_KEY; // Doit être une clé de 32 octets (256 bits)
const IV_LENGTH = 16; // Pour AES, c'est toujours 16

// Fonctions de chiffrement / déchiffrement
function encrypt(text) {
    console.log('[ENCRYPT] Called with text:', text); // Log 1: Text to encrypt
    if (!text) {
        console.log('[ENCRYPT] Text is null or empty, returning null.');
        return null;
    }

    // Utiliser la variable du scope du modèle si elle est définie, sinon essayer de lire process.env à nouveau
    // Cela aide à diagnostiquer si la clé était disponible au chargement du modèle vs. au moment de l'appel
    const EFFECTIVE_ENCRYPTION_KEY = ENCRYPTION_KEY_FROM_MODEL_SCOPE || process.env.ENCRYPTION_KEY;
    console.log('[ENCRYPT] ENCRYPTION_KEY_FROM_MODEL_SCOPE:', ENCRYPTION_KEY_FROM_MODEL_SCOPE ? ENCRYPTION_KEY_FROM_MODEL_SCOPE.substring(0,10) + '...' : 'NOT SET IN MODEL SCOPE');
    console.log('[ENCRYPT] process.env.ENCRYPTION_KEY at call time:', process.env.ENCRYPTION_KEY ? process.env.ENCRYPTION_KEY.substring(0,10) + '...' : 'NOT SET IN PROCESS.ENV AT CALL');
    console.log('[ENCRYPT] EFFECTIVE_ENCRYPTION_KEY being used:', EFFECTIVE_ENCRYPTION_KEY ? EFFECTIVE_ENCRYPTION_KEY.substring(0,10) + '...' : 'NO KEY AVAILABLE');


    if (!EFFECTIVE_ENCRYPTION_KEY) {
        console.error('[ENCRYPT] CRITICAL: EFFECTIVE_ENCRYPTION_KEY is not set. Returning original text.');
        return text;
    }
    if (typeof EFFECTIVE_ENCRYPTION_KEY !== 'string' || EFFECTIVE_ENCRYPTION_KEY.length !== 64) {
        console.error(`[ENCRYPT] CRITICAL: EFFECTIVE_ENCRYPTION_KEY is invalid. Expected 64-char hex string, got length ${EFFECTIVE_ENCRYPTION_KEY.length}. Key: "${EFFECTIVE_ENCRYPTION_KEY.substring(0,10)}...". Returning original text.`);
        return text; 
    }

    try {
        let iv = crypto.randomBytes(IV_LENGTH);
        console.log('[ENCRYPT] IV generated:', iv.toString('hex'));

        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(EFFECTIVE_ENCRYPTION_KEY, 'hex'), iv);
        console.log('[ENCRYPT] Cipher created.');

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const result = iv.toString('hex') + ':' + encrypted;
        console.log('[ENCRYPT] Encryption successful. Result (iv:encrypted_hex):', result.substring(0, 50) + "...");
        return result;

    } catch (error) {
        console.error("[ENCRYPT] Encryption failed during crypto operations:", error);
        console.error("[ENCRYPT] Error name:", error.name);
        console.error("[ENCRYPT] Error message:", error.message);
        // console.error("[ENCRYPT] Error stack:", error.stack); // Stack peut être trop verbeux pour un log initial
        return text; 
    }
}


function decrypt(text) {
    // Utiliser la variable du scope du modèle si elle est définie, sinon essayer de lire process.env à nouveau
    const EFFECTIVE_ENCRYPTION_KEY = ENCRYPTION_KEY_FROM_MODEL_SCOPE || process.env.ENCRYPTION_KEY;

    if (!text || typeof text !== 'string' || text.indexOf(':') === -1) {
        // console.log('[DECRYPT] Text is null, not a string, or invalid format. Returning as is:', text);
        return text;
    }
    if (!EFFECTIVE_ENCRYPTION_KEY) {
        console.error("[DECRYPT] CRITICAL: EFFECTIVE_ENCRYPTION_KEY is not set. Cannot decrypt. Returning original text:", text.substring(0,50) + '...');
        return text;
    }
    if (typeof EFFECTIVE_ENCRYPTION_KEY !== 'string' || EFFECTIVE_ENCRYPTION_KEY.length !== 64) {
        console.error(`[DECRYPT] CRITICAL: EFFECTIVE_ENCRYPTION_KEY is invalid. Expected 64-char hex string. Cannot decrypt. Returning original text: "${text.substring(0,50)}..."`);
        return text; 
    }

    try {
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(EFFECTIVE_ENCRYPTION_KEY, 'hex'), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        // console.log('[DECRYPT] Decryption successful for text starting with:', text.substring(0,10) + '...');
        return decrypted.toString();
    } catch (error) {
        console.error("[DECRYPT] Decryption failed for text starting with: ", text.substring(0,50) + '...');
        console.error("[DECRYPT] Error name:", error.name);
        console.error("[DECRYPT] Error message:", error.message);
        // console.error("[DECRYPT] Error stack:", error.stack);
        return text; // Retourne le texte original chiffré en cas d'erreur
    }
}

const companySensitiveDataSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true, // Rendu optionnel
        index: true // Ajout d'un index peut être utile
    },
    companyName: { // Ajout du nom de la compagnie directement ici
        type: String,
        required: true, // Le nom est requis pour identifier l'entrée
        trim: true,
        index: true // Index sur le nom pour recherche rapide/unicité
    },
    notes: {
        type: String,
        set: encrypt, // Chiffre les notes
        get: decrypt // Déchiffre les notes
    },
    credentials: [
        {
            service: String,
            username: { type: String, set: encrypt, get: decrypt },
            password: { type: String, set: encrypt, get: decrypt }
            //_id: false // Si vous ne voulez pas d'_id pour les sous-documents credentials
        }
    ],
    remoteAccessDetails: [
        {
            title: String,
            identifier: { type: String, set: encrypt, get: decrypt },
            password: { type: String, set: encrypt, get: decrypt },
            notes: { type: String, set: encrypt, get: decrypt, default: null }
        }
    ],
    networkInfo: {
        ipAddress: { type: String, set: encrypt, get: decrypt },
        subnetMask: { type: String, set: encrypt, get: decrypt },
        gateway: { type: String, set: encrypt, get: decrypt }
    },
    diagramData: { // Ajout du champ pour les données React Flow
        type: Object, // Stocke directement l'objet JSON de React Flow
        default: null // Par défaut, pas de diagramme
    },
    layoutData: { // Ajout du champ pour les données tldraw
        type: Object, // Stocke directement le snapshot JSON de tldraw
        default: null 
    },
    // Ajoute d'autres champs sensibles si nécessaire
}, {
    timestamps: true,
    toJSON: { getters: true }, // Assure que les getters (decrypt) sont appliqués lors de la conversion en JSON
    toObject: { getters: true } // Assure que les getters sont appliqués lors de la conversion en objet
});

// Assurer l'unicité basée sur companyName si clientId n'est pas présent?
// Ou une unicité combinée ? Pour l'instant, on gérera la logique de non-duplication dans la route POST.
// companySensitiveDataSchema.index({ companyName: 1, clientId: 1 }, { unique: true, sparse: true });

// Méthode pour décrypter toutes les données (si nécessaire, mais les getters devraient suffire)
companySensitiveDataSchema.methods.getDecryptedData = function() {
    const decrypted = { _id: this._id, companyName: this.companyName };
    if (this.clientId) decrypted.clientId = this.clientId;
    // Les champs utilisant get: decrypt seront automatiquement déchiffrés lorsqu'ils sont accédés.
    // Donc, this.notes, this.networkInfo.ipAddress, etc., devraient déjà être déchiffrés lorsqu'ils sont accédés.
    // Pour être explicite ou si on n'utilise pas toObject/toJSON avec getters :
    decrypted.notes = this.notes; // Getter devrait s'appliquer
    
    if (this.networkInfo) {
        decrypted.networkInfo = {
            ipAddress: this.networkInfo.ipAddress, 
            subnetMask: this.networkInfo.subnetMask,
            gateway: this.networkInfo.gateway 
        };
    }
    if (this.credentials && this.credentials.length > 0) {
        decrypted.credentials = this.credentials.map(cred => ({
            _id: cred._id,
            service: cred.service,
            username: cred.username,
            password: cred.password
        }));
    }
    if (this.remoteAccessDetails && this.remoteAccessDetails.length > 0) {
        decrypted.remoteAccessDetails = this.remoteAccessDetails.map(access => ({
            _id: access._id,
            title: access.title,
            identifier: access.identifier,
            password: access.password,
            notes: access.notes
        }));
    }
    if (this.diagramData) decrypted.diagramData = this.diagramData;
    if (this.layoutData) decrypted.layoutData = this.layoutData;

    decrypted.createdAt = this.createdAt;
    decrypted.updatedAt = this.updatedAt;
    return decrypted;
};

module.exports = companySensitiveDataSchema;
console.log('[MODEL LOAD] ENCRYPTION_KEY at model definition:', ENCRYPTION_KEY_FROM_MODEL_SCOPE ? ENCRYPTION_KEY_FROM_MODEL_SCOPE.substring(0,10) + '...' : 'NOT SET'); // Log au chargement du modèle 