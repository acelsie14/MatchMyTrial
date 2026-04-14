import AsyncStorage from '@react-native-async-storage/async-storage';
export interface CachedUser {
  uid: string;
  email: string;
  username: string;
}

export const saveUser = async (user: CachedUser): Promise<void> => {
  try {
    // convert the user object to json string
    const userJson = JSON.stringify(user);

    // save it with keyt user
    await AsyncStorage.setItem('user', userJson);

    console.log('User saved to storage');
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

export const getUser = async (): Promise<CachedUser | null> => {
  try {
    // get the user json string from storage using the key user
    const userJson = await AsyncStorage.getItem('user');

    // if there is no user in storage return null
    if (!userJson) {
      return null;
    }
    // parse the json string back to an object and return it
    const user: CachedUser = JSON.parse(userJson);
    return user;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return null;
  }
};
// function to check if there is a cached user in storage
export const hasCachedUser = async (): Promise<boolean> => {
  try {
    const user = await getUser();
    return user !== null;
  } catch (error) {
    console.error('Error checking cached user:', error);
    return false;
  }
};

export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('user');
    console.log('User removed from storage');
  } catch (error) {
    console.error('Error removing user from storage:', error);
  }
};
