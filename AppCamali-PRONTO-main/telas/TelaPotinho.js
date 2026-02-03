import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../config/firebaseConfig';
import {
  collection, addDoc, query, where, onSnapshot, orderBy, Timestamp
} from 'firebase/firestore';

const { width } = Dimensions.get('window');
const POTE_IMAGE = require('../assets/pote.png');

const emocoesData = [
  { id: 'desanimado', label: 'Desanimado', color: '#9932CC', emoji: require('../assets/desanimado.png') },
  { id: 'triste', label: 'Triste ', color: '#5BA7F4', emoji: require('../assets/triste.png') },
  { id: 'neutro', label: 'Neutro ', color: '#6DE0F2', emoji: require('../assets/neutro.png') },
  { id: 'otimo', label: 'Ótimo ', color: '#3CB371', emoji: require('../assets/otimo.png') },
  { id: 'feliz', label: 'Feliz ', color: '#FFA500', emoji: require('../assets/feliz.png') },
];

// --- Componente de Bolinha de Humor Individual ---
const BolinhaDeHumor = ({ id, label, color, emoji, onPress }) => (
  <TouchableOpacity style={styles.bolinhaContainer} onPress={() => onPress(id)}>
    <View style={[styles.bolinhaIcone, { backgroundColor: color, shadowColor: color }]}>
      <View style={styles.emojiContainer}>
        <Image source={emoji} style={styles.bolinhaEmoji} />
      </View>
    </View>
    <Text style={styles.bolinhaLabel}>{label}</Text>
  </TouchableOpacity>
);

// --- Componente de Registro na Linha do Tempo ---
const RegistroDeHumor = ({ time, humor, color, emoji }) => (
  <View style={styles.registroContainer}>
    <View style={styles.registroConteudo}>
      <Text style={styles.registrotempo}>{time}</Text>
      <View style={[styles.registroCard, { backgroundColor: color }]}>
        <View style={styles.registroIcone}>
          <Image source={emoji} style={styles.registroEmoji} />
        </View>
        <Text style={styles.registroHumor}>{humor}</Text>
        <TouchableOpacity style={styles.registroMenu}>
          <Text style={styles.registromenuTexto}>...</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// --- Tela Principal ---
export default function TelaPotinho({ navigation }) {
  const [userName, setUserName] = useState('');
  const [humoresNoPote, setHumoresNoPote] = useState([]);
  const [registrosDeHoje, setRegistrosDeHoje] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  
  // Ref para guardar as posições já geradas e não perder ao re-renderizar
  const posicoesCache = useRef({});

  // Função geradora de posição (movida para fora ou mantida aqui)
  const generateRandomPosition = () => {
    const jarWidth = width * 0.7;
    const jarHeight = width * 0.7;
    const paddingHorizontal = jarWidth * 0.28;
    const paddingTop = jarHeight * 0.40;
    const paddingBottom = jarHeight * 0.25;
    
    const randomLeft = Math.random() * (jarWidth - paddingHorizontal * 2) + paddingHorizontal;
    const randomTop = Math.random() * (jarHeight - paddingTop - paddingBottom) + paddingTop;
    
    const bolinhaSize = 25;
    const finalLeft = Math.min(randomLeft, jarWidth - paddingHorizontal - bolinhaSize);
    const finalTop = Math.min(randomTop, jarHeight - paddingBottom - bolinhaSize);
    
    return { left: finalLeft, top: finalTop };
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigation.replace('TelaInicial');
      return;
    }

    if (user.displayName) {
      setUserName(user.displayName.split(' ')[0]);
    } else if (user.email) {
      setUserName(user.email.split('@')[0]);
    } else {
      setUserName('Usuário');
    }

    const now = new Date();
    const monthName = now.toLocaleString('pt-BR', { month: 'long' });
    setCurrentDate(`${monthName.charAt(0).toUpperCase() + monthName.slice(1)}. ${now.getFullYear()}`);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "emocoes"),
      where("userId", "==", user.uid),
      where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
      where("timestamp", "<=", Timestamp.fromDate(endOfDay)),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const novosRegistros = [];
      const novasBolinhas = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const docId = doc.id; // ID único do documento no Firestore
        const localEmocaoData = emocoesData.find(e => e.id === data.emocaoId);

        if (localEmocaoData) {
          const registroFormatado = {
            ...data,
            ...localEmocaoData,
            idDoc: docId,
            time: data.timestamp ? data.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '...',
          };

          novosRegistros.push(registroFormatado);
          
          // LÓGICA DE POSIÇÃO FIXA:
          // Se já temos uma posição salva para este ID de documento, usamos ela.
          // Se não, geramos uma nova e salvamos no cache.
          if (!posicoesCache.current[docId]) {
            posicoesCache.current[docId] = generateRandomPosition();
          }

          novasBolinhas.push({
              ...registroFormatado,
              position: posicoesCache.current[docId]
          });
        }
      });

      setRegistrosDeHoje(novosRegistros);
      setHumoresNoPote(novasBolinhas.slice(0, 50));
      
    }, (error) => {
      console.error("Erro no Listener:", error);
    });

    return () => unsubscribe();
  }, []);

  const handlePressEmocao = async (idEmocao) => {
    const user = auth.currentUser;
    if (!user) return;

    const emocaoSelecionada = emocoesData.find(e => e.id === idEmocao);
    if (emocaoSelecionada) {
      try {
        await addDoc(collection(db, "emocoes"), {
          userId: user.uid,
          emocaoId: emocaoSelecionada.id,
          timestamp: Timestamp.now(),
        });
      } catch (error) {
        console.error("Erro ao adicionar emoção: ", error);
        Alert.alert("Erro", "Não foi possível salvar a emoção.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#B0E5F7', '#D1F0F7', '#FFF9EA']} locations={[0, 0.6, 1]} style={styles.backgroundGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <View style={styles.container}>
          <View style={styles.cabecalho}>
            <TouchableOpacity style={styles.menubotao} onPress={() => navigation.openDrawer()}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.historicobotao} onPress={() => navigation.navigate('historico')}>
              <Text style={styles.historicoText}>Histórico</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeMessage}>Bem-Vindo, {userName}!</Text>
          
          <View style={styles.jarsessao}>
            <ImageBackground source={POTE_IMAGE} style={styles.jarImageBackground} resizeMode="contain">
              {humoresNoPote.map((emocao) => (
                <View
                  key={emocao.idDoc} // Usar o ID único do documento como chave é melhor que index
                  style={[
                    styles.jarBolinhaAbsoluta,
                    {
                      backgroundColor: emocao.color,
                      top: emocao.position.top,
                      left: emocao.position.left,
                    }
                  ]}
                />
              ))}
            </ImageBackground>
          </View>

          <View style={styles.data}>
            <Text style={styles.dataTexto}>{currentDate}</Text>
          </View>
          
          <View style={styles.linhaEmocao}>
            {emocoesData.map((emocao) => (
              <BolinhaDeHumor key={emocao.id} {...emocao} onPress={handlePressEmocao} />
            ))}
          </View>
          
          <ScrollView style={styles.scrollView}>
            <Text style={styles.hjcabecalho}>Hoje</Text>
            {registrosDeHoje.map((registro, index) => (
              <RegistroDeHumor key={index} time={registro.time} humor={registro.label} color={registro.color} emoji={registro.emoji} />
            ))}
            <View style={{ height: 50 }} />
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E5E8E8'
  },
  backgroundGradient: {
    flex: 1
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden'
  },
  welcomeMessage: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#414562',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 5
  },
  menubotao: {
    width: 30,
    height: 30,
    justifyContent: 'space-around',
    paddingVertical: 5
  },
  menuLine: {
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2
  },
  historicobotao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41
  },
  historicoText: {
    marginLeft: 5,
    fontWeight: 'bold',
    color: '#333'
  },
  jarsessao: {
    alignItems: 'center',
    marginVertical: 10
  },
  jarImageBackground: {
    width: width * 0.7,
    height: width * 0.7
  },
  jarBolinhaAbsoluta: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.3,
    shadowRadius: 2
  },
  data: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginVertical: 10
  },
  dataTexto: {
    fontWeight: 'bold',
    color: '#333'
  },
  linhaEmocao: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  },
  bolinhaContainer: {
    alignItems: 'center'
  },
  bolinhaIcone: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    elevation: 3,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bolinhaEmoji: {
    width: 28,
    height: 28
  },
  bolinhaLabel: {
    fontSize: 12,
    color: '#333'
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 5,
    borderRadius: 10,
    paddingTop: 10
  },
  hjcabecalho: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 10
  },
  registroContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 10
  },
  registroConteudo: {
    flex: 1,
    marginLeft: 5
  },
  registrotempo: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5
  },
  registroCard: {
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    marginBottom: 5
  },
  registroIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  registroEmoji: {
    width: 25,
    height: 25
  },
  registroHumor: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  registroMenu: {
    padding: 5
  },
  registromenuTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
});