import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Button,
  Platform,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import api from './src/api/api';

interface Location {
  latitude: string;
  longitude: string;
  device: {deviceId: number};
}

export default function App() {
  const [currentLatitude, setCurrentLatitude] = useState('');
  const [currentLongitude, setCurrentLongitude] = useState('');
  const [watchID, setWatchID] = useState(0);
  const [connected, setConnected] = useState(false);
  const [location, setLocation] = useState<Location>();
  var listLocation: Location[] = [] as Location[];

  NetInfo.fetch().then(state => {
    setConnected(state.isConnected || false);
  });

  const callLocation = () => {
    console.log('Obtendo localização...');
    if (Platform.OS === 'ios') {
      getLocation().then(() => addLocation());
    } else {
      const requestLocationPermission = async () => {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permissão de Acesso à Localização',
            message: 'Este aplicativo precisa acessar sua localização.',
            buttonNeutral: 'Pergunte-me depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getLocation().then(() => addLocation());
        } else {
          Alert.alert('Permissão de Localização negada');
        }
      };
      requestLocationPermission();
    }
  };

  const getLocation = async () => {
    await Geolocation.getCurrentPosition(
      position => {
        const currentLatitude = JSON.stringify(position.coords.latitude);
        const currentLongitude = JSON.stringify(position.coords.longitude);

        setCurrentLatitude(currentLatitude);
        setCurrentLongitude(currentLongitude);
      },
      error => Alert.alert(error.message),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
    const watchID = Geolocation.watchPosition(position => {
      const currentLatitude = JSON.stringify(position.coords.latitude);
      const currentLongitude = JSON.stringify(position.coords.longitude);
      setCurrentLatitude(currentLatitude);
      setCurrentLongitude(currentLongitude);
      const location = {
        latitude: currentLatitude,
        longitude: currentLongitude,
        device: {deviceId: 5},
      };
      listLocation.push(location);
    });
    setWatchID(watchID);

    const location = {
      latitude: currentLatitude,
      longitude: currentLongitude,
      device: {deviceId: 5},
    };

    listLocation.push(location);
  };

  const clearLocation = () => {
    Geolocation.clearWatch(watchID);
  };

  const addLocation = () => {
    if (connected) {
      for (var i = 0; i < listLocation.length; i++) {
        api
          .post('api/location', listLocation[i])
          .then(response => {
            console.log(response);
            listLocation.splice(i);
          })
          .catch(err => {
            console.error('ops! ocorreu um erro' + err);
          });
      }
    }
  };

  setInterval(function () {
    callLocation;
  }, 3000);

  return (
    <View style={styles.container}>
      <Text style={styles.boldText}>Você está Aqui</Text>
      <Text style={styles.text}>Latitude: {currentLatitude}</Text>
      <Text style={styles.text}>Longitude: {currentLongitude}</Text>
      <View style={styles.button}>
        <Button title="Obter Localização" onPress={callLocation} />
      </View>
      <View style={styles.button}>
        <Button title="Cancelar Monitoração" onPress={clearLocation} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    padding: 16,
    backgroundColor: 'white',
  },
  boldText: {
    fontSize: 30,
    color: 'red',
  },
  text: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
});
