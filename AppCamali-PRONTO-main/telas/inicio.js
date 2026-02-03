import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

// Assumindo que a imagem da logo está em './assets/logoCamaliLetra.png'
// e que os estilos de fonte e cores são os mesmos usados no App.js

SplashScreen.preventAutoHideAsync();

export default function InicioScreen({ navigation }) {
  useEffect(() => {
    // Esconde a splash screen nativa do Expo assim que o componente é montado
    SplashScreen.hideAsync();

    // Navega para a tela principal (que era a 'Inicio' original, agora 'TelaInicial') após 3 segundos
    const timer = setTimeout(() => {
      navigation.replace('TelaInicial');
    }, 1000);

    // Limpa o timer se o componente for desmontado antes do tempo
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#FFF9EA', '#FFF9EA', '#73BCD5']}
      locations={[0, 0.5, 1]}
      style={estilos.container}>
      <Image
        source={require('../assets/logoCamaliLetra.png')}
        style={estilos.logo}
        resizeMode="contain"
      />
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
});