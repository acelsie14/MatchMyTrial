// services/bookmarkService.ts
import firestore from '@react-native-firebase/firestore';

export const saveBookmark = async (
  userId: string,
  trial: any,
): Promise<void> => {
  try {
    const trialId = trial?.protocolSection?.identificationModule?.nctId;
    const title =
      trial?.protocolSection?.identificationModule?.briefTitle ||
      'Untitled Trial';
    const status =
      trial?.protocolSection?.statusModule?.overallStatus || 'Unknown';
    const location =
      trial?.protocolSection?.contactsLocationsModule?.locations?.[0];
    const city = location?.city || '';
    const country = location?.country || '';
    const locationText =
      city && country
        ? `${city}, ${country}`
        : city || country || 'Location not specified';

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

// Delete all bookmarks for a user
export const deleteAllUserBookmarks = async (userId: string): Promise<void> => {
  try {
    // Get all bookmarks for this user
    const bookmarksSnapshot = await firestore()
      .collection('savedTrials')
      .doc(userId)
      .collection('bookmarks')
      .get();

    const batch = firestore().batch();

    bookmarksSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the parent savedTrials document
    batch.delete(firestore().collection('savedTrials').doc(userId));

    await batch.commit();
    console.log(`✅ Deleted ${bookmarksSnapshot.size} bookmarks`);
  } catch (error) {
    console.error('Error deleting bookmarks:', error);
    throw error;
  }
};
