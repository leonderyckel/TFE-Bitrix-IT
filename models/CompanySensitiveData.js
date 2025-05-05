const mongoose = require('mongoose');
const crypto = require('crypto');

// Récupère la clé de chiffrement depuis les variables d'environnement
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Doit être une clé de 32 octets (256 bits)
const IV_LENGTH = 16; // Pour AES, c'est toujours 16

// Fonctions de chiffrement / déchiffrement (inchangées)
function encrypt(text) {
    if (!text) return null;
    if (!ENCRYPTION_KEY) {
        console.error("ENCRYPTION_KEY is not set.");
        // Retourner le texte en clair ou lancer une erreur ? Pour l'instant, retournons en clair avec un avertissement.
        return text; 
    }
    try {
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Encryption failed:", error);
        return text; // Retourne le texte original en cas d'erreur
    }
}

function decrypt(text) {
    if (!text || typeof text !== 'string' || text.indexOf(':') === -1) return text; // Retourne si null, pas une string, ou format invalide
    if (!ENCRYPTION_KEY) {
        console.error("ENCRYPTION_KEY is not set. Cannot decrypt.");
        return text; // Retourne le texte chiffré
    }
    try {
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
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
    if (this.notes) decrypted.notes = this.notes; // Utilise le getter
    if (this.networkInfo) {
        decrypted.networkInfo = {
            ipAddress: this.networkInfo.ipAddress, // Utilise le getter
            subnetMask: this.networkInfo.subnetMask, // Utilise le getter
            gateway: this.networkInfo.gateway // Utilise le getter
        };
    }
    if (this.credentials && this.credentials.length > 0) {
        decrypted.credentials = this.credentials.map(cred => ({
            service: cred.service,
            username: cred.username, // Utilise le getter
            password: cred.password // Utilise le getter
        }));
    }
    decrypted.createdAt = this.createdAt;
    decrypted.updatedAt = this.updatedAt;
    return decrypted;
};

module.exports = companySensitiveDataSchema; 