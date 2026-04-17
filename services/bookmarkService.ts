// services/bookmarkService.ts
import firestore from '@react-native-firebase/firestore';

export const saveBookmark = async (
  userId: string,
  trial: any,
): Promise<void> => {
  try {
    // Step 1: Extract trialId (NCT number)
    const trialId = trial?.protocolSection?.identificationModule?.nctId;

    // Step 2: Extract title
    const title =
      trial?.protocolSection?.identificationModule?.briefTitle ||
      'Untitled Trial';

    // Step 3: Extract status
    const status =
      trial?.protocolSection?.statusModule?.overallStatus || 'Unknown';

    // Step 4: Extract location (city and country)
    const location =
      trial?.protocolSection?.contactsLocationsModule?.locations?.[0];
    const city = location?.city || '';
    const country = location?.country || '';
    const locationText =
      city && country
        ? `${city}, ${country}`
        : city || country || 'Location not specified';

    // Step 5: Create document ID using userId and trialId
    const docId = `${userId}_${trialId}`;

    // Step 6: Create the bookmark object
    const bookmark = {
      userId: userId,
      trialId: trialId,
      title: title,
      location: locationText,
      status: status,
      savedAt: new Date().toISOString(),
    };

    // Step 7: Save to Firestore (top-level savedTrials collection)
    await firestore().collection('savedTrials').doc(docId).set(bookmark);

    console.log('Bookmark saved successfully');
  } catch (error) {
    console.error('Error saving bookmark:', error);
    throw error;
  }
};
// services/bookmarkService.ts (add this after saveBookmark)

export const removeBookmark = async (
  userId: string,
  trialId: string,
): Promise<void> => {
  try {
    // Step 1: Create document ID using userId and trialId (same format as save)
    const docId = `${userId}_${trialId}`;

    // Step 2: Delete the document from savedTrials collection
    await firestore().collection('savedTrials').doc(docId).delete();

    console.log('Bookmark removed successfully');
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
};

// services/bookmarkService.ts (add this after removeBookmark)

export const getUserBookmarks = async (userId: string): Promise<any[]> => {
  try {
    // Step 1: Query savedTrials collection where userId matches
    const snapshot = await firestore()
      .collection('savedTrials')
      .where('userId', '==', userId)
      .orderBy('savedAt', 'desc')
      .get();

    // Step 2: Convert snapshot to array of bookmark objects
    const bookmarks: any[] = [];
    snapshot.forEach((doc) => {
      bookmarks.push({
        id: doc.id, // The document ID (userId_trialId)
        ...doc.data(), // All the bookmark data
      });
    });

    // Step 3: Return the array
    return bookmarks;
  } catch (error) {
    console.error('Error getting user bookmarks:', error);
    return []; // Return empty array on error
  }
};
// services/bookmarkService.ts (add this after getUserBookmarks)

export const isBookmarked = async (
  userId: string,
  trialId: string,
): Promise<boolean> => {
  try {
    // Step 1: Create document ID using userId and trialId
    const docId = `${userId}_${trialId}`;

    // Step 2: Get the document
    const doc = await firestore().collection('savedTrials').doc(docId).get();

    // Step 3: Return true if document exists, false if not
    return doc.exists();
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};
