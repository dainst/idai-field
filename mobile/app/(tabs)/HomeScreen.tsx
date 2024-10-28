import { Text, View } from 'react-native';
import App from '@/old/App';
import HomeScreen from '@/old/src/components/Home/HomeScreen';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <HomeScreen navigate={()=>null} deleteProject={()=> null}/>
    </View>
  );
}
