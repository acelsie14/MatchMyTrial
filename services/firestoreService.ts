import firestore from '@react-native-firebase/firestore';

export const saveUserProfile = async (
  userId: string,
  profileData: { age: number; gender: string; condition: string },
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
      completedAt: new Date().toISOString(),
    });

    console.log('profile saved successfully');
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
