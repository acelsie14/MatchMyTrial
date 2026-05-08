// services/firestoreService.ts
import firestore from '@react-native-firebase/firestore';

export const saveUserProfile = async (
  userId: string,
  profileData: {
    age: number;
    gender: string;
    condition: string;
    username: string;
  },
) => {
  try {
    const profileRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('profile')
      .doc('data');

    await profileRef.set({
      age: profileData.age,
      gender: profileData.gender,
      condition: profileData.condition,
      username: profileData.username,
      updatedAt: new Date().toISOString(),
    });

    console.log('Profile saved successfully');
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId: string) => {
  try {
    const profileRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('profile')
      .doc('data');

    const document = await profileRef.get();

    if (document.exists()) {
      return document.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Check if user profile exists
export const hasCompletedProfile = async (userId: string) => {
  try {
    const profile = await getUserProfile(userId);
    return profile !== null;
  } catch (error) {
    console.error('Error checking user profile existence:', error);
    return false;
  }
};

// Delete all user profile data from Firestore
export const deleteUserProfileData = async (userId: string): Promise<void> => {
  try {
    // Delete all documents in the profile subcollection
    const profileSnapshot = await firestore()
      .collection('users')
      .doc(userId)
      .collection('profile')
      .get();

    const batch = firestore().batch();

    profileSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the main user document (removes the ID/shell)
    batch.delete(firestore().collection('users').doc(userId));

    await batch.commit();
    console.log('✅ User profile data completely deleted');

    // ⚠️ DO NOT delete the verifiedEmails record - keep it for future signups!
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

// Check if email was ever verified
export const wasEmailVerifiedBefore = async (
  email: string,
): Promise<boolean> => {
  try {
    const doc = await firestore()
      .collection('verifiedEmails')
      .doc(email.toLowerCase())
      .get();

    return doc.exists();
  } catch (error) {
    console.error('Error checking verified email:', error);
    return false;
  }
};

//  Add email to verified emails collection
export const addVerifiedEmail = async (email: string): Promise<void> => {
  try {
    const emailLower = email.toLowerCase();
    const doc = await firestore()
      .collection('verifiedEmails')
      .doc(emailLower)
      .get();

    if (!doc.exists) {
      await firestore().collection('verifiedEmails').doc(emailLower).set({
        email: emailLower,
        verifiedAt: new Date().toISOString(),
        source: 'login_verification',
      });
      console.log('✅ Email added to verifiedEmails collection:', emailLower);
    }
  } catch (error) {
    console.error('Error adding verified email:', error);
  }
};
