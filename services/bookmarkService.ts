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

    // Step 5: Save to Firestore at path: savedTrials/{userId}/bookmarks/{trialId}
    await firestore()
      .collection('savedTrials')
      .doc(userId)
      .collection('bookmarks')
      .doc(trialId)
      .set({
        trialId: trialId,
        title: title,
        location: locationText,
        status: status,
        savedAt: new Date().toISOString(),
      });

    console.log('Bookmark saved successfully');
  } catch (error) {
    console.error('Error saving bookmark:', error);
    throw error;
  }
};

export const removeBookmark = async (
  userId: string,
  trialId: string,
): Promise<void> => {
  try {
    // Delete from path: savedTrials/{userId}/bookmarks/{trialId}
    await firestore()
      .collection('savedTrials')
      .doc(userId)
      .collection('bookmarks')
      .doc(trialId)
      .delete();

    console.log('Bookmark removed successfully');
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
};

export const getUserBookmarks = async (userId: string): Promise<any[]> => {
  try {
    // Get all documents from savedTrials/{userId}/bookmarks
    const snapshot = await firestore()
      .collection('savedTrials')
      .doc(userId)
      .collection('bookmarks')
      .orderBy('savedAt', 'desc')
      .get();

    const bookmarks: any[] = [];
    snapshot.forEach((doc) => {
      bookmarks.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return bookmarks;
  } catch (error) {
    console.error('Error getting user bookmarks:', error);
    return [];
  }
};

export const isBookmarked = async (
  userId: string,
  trialId: string,
): Promise<boolean> => {
  try {
    const doc = await firestore()
      .collection('savedTrials')
      .doc(userId)
      .collection('bookmarks')
      .doc(trialId)
      .get();

    return doc.exists();
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
};
