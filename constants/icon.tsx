import { Feather } from '@expo/vector-icons';

export const icon = {
  home: (props: any) => (
    <Feather name="home" size={24} color={'#222'} {...props} />
  ),
  applied: (props: any) => (
    <Feather name="check-circle" size={24} color={'#222'} {...props} />
  ),
  profile: (props: any) => (
    <Feather name="user" size={24} color={'#222'} {...props} />
  ),
};
