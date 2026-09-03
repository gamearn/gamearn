/**
 * Gamearn Cloud Functions
 *
 * Avatar 24h / one-per-day cooldown (server-authoritative).
 *
 * The upload pipeline is direct-to-Firebase: the Flutter client uploads
 * straight to Storage, and the Storage security rules enforce the 24h window
 * at upload time by reading the cooldown record in Firestore. That record must
 * live somewhere a malicious client cannot write — otherwise a client could
 * skip (or lie about) the timestamp and upload repeatedly.
 *
 * This function is the server-side writer for that record. It fires whenever a
 * profile picture object finishes uploading (Storage onFinalize), so the stamp
 * is recorded even if the client drops its connection mid-flight or never
 * bothers to confirm. Works identically on Android and iOS — no client-side
 * confirmation round-trip is required (important for poor network areas).
 *
 *   write path : uploads/{uid}/profile.jpg   → upload_cooldowns/{uid}
 *   collection : upload_cooldowns/{uid}      → { lastProfileUpload: Timestamp }
 *   rules      : storage.rules reads this doc (firestore.get) to gate writes;
 *                firestore.rules denies clients any write to it.
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onObjectFinalized } = require('firebase-functions/v2/storage');

initializeApp();
const db = getFirestore();

/**
 * Storage object size ceiling enforced by storage.rules. Uploads above this
 * are impossible via the app (rules deny before the object is finalized), so
 * anything larger arriving here came through an admin path — we still stamp it
 * so the cooldown record stays truthful.
 */
const MAX_AVATAR_BYTES = 150 * 1024;

exports.enforceAvatarCooldown = onObjectFinalized(
  {
    // Pinned so the trigger resolves without depending on FIREBASE_CONFIG
    // at module-load time (the deploy loader has none set).
    bucket: 'gamearn-app.firebasestorage.app',
    match: 'users/{uid}/profile.jpg',
  },
  async (event) => {
    const { uid } = event.params;
    const object = event.data;

    // Always stamp, even for oversized/admin writes, so the record can never
    // be left stale. Admin SDK writes bypass Firestore security rules.
    await db.collection('upload_cooldowns').doc(uid).set(
      {
        lastProfileUpload: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (object && object.size > MAX_AVATAR_BYTES) {
      console.warn(
        `Avatar for ${uid} exceeds the ${MAX_AVATAR_BYTES}-byte cap ` +
          `(got ${object.size}); uploaded outside app rules.`
      );
    }
  }
);
