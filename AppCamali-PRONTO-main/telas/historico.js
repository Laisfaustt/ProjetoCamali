import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { auth, db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const POTE_IMAGE = require('../assets/pote.png');

// Dados das emoções
const emocoesData = [
  { id: 'desanimado', label: 'Desanimado', color: '#9932CC', emoji: require('../assets/desanimado.png') },
  { id: 'triste', label: 'Triste', color: '#5BA7F4', emoji: require('../assets/triste.png') },
  { id: 'neutro', label: 'Neutro', color: '#6DE0F2', emoji: require('../assets/neutro.png') },
  { id: 'otimo', label: 'Ótimo', color: '#3CB371', emoji: require('../assets/otimo.png') },
  { id: 'feliz', label: 'Feliz', color: '#FFA500', emoji: require('../assets/feliz.png') },
];

const months = [
  'Janeiro', 'Fevereiro', 'Março',
  'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro',
  'Outubro', 'Novembro', 'Dezembro'
];

// Configuração do calendário
LocaleConfig.locales['pt-br'] = {
  monthNames: months,
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

// Componente PoteMensal
const PoteMensal = ({ month, emotions, onPress }) => {
  const jarSize = width * 0.25;
  
  const emotionsWithDetails = emotions.map(e => {
    const localEmocaoData = emocoesData.find(data => data.id === e.emocaoId);
    return localEmocaoData || { color: '#ccc', emoji: null };
  });

  return (
    <TouchableOpacity style={styles.poteContainer} onPress={onPress} disabled={emotions.length === 0}>
      <View style={styles.poteWrapper}>
        <Image source={POTE_IMAGE} style={[styles.jarImage, { width: jarSize, height: jarSize }]} resizeMode="contain" />
        <View style={styles.jarContent}>
          {emotionsWithDetails.slice(0, 15).map((emocao, index) => (
            <View
              key={index}
              style={[
                styles.jarBolinhaAbsoluta,
                {
                  backgroundColor: emocao.color,
                  top: Math.random() * 40 + 50,
                  left: Math.random() * 50 + 25,
                }
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.monthLabel}>{month}</Text>
    </TouchableOpacity>
  );
};

// Componente RegistroDeHumor
const RegistroDeHumor = ({ time, emocaoId }) => {
    const localEmocaoData = emocoesData.find(data => data.id === emocaoId);
    if (!localEmocaoData) return null;

    const { label, color, emoji } = localEmocaoData;

    return (
        <View style={styles.registroContainer}>
            <View style={styles.registroConteudo}>
                <Text style={styles.registrotempo}>{time}</Text>
                <View style={[styles.registroCard, { backgroundColor: color }]}>
                    <View style={styles.registroIcone}>
                        <Image source={emoji} style={styles.registroEmoji} />
                    </View>
                    <Text style={styles.registroHumor}>{label}</Text>
                </View>
            </View>
        </View>
    );
};

export default function Historico({ navigation }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isDayDetailsVisible, setDayDetailsVisible] = useState(false);
  const [selectedMonthData, setSelectedMonthData] = useState(null);
  const [selectedDayEmotions, setSelectedDayEmotions] = useState([]);
  const [selectedDateString, setSelectedDateString] = useState('');

  useEffect(() => {
    fetchYearlyData(currentYear);
  }, [currentYear]);

  const fetchYearlyData = async (year) => {
    const user = auth.currentUser;
    if (!user) return;

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    try {
        const q = query(
          collection(db, "emocoes"),
          where("userId", "==", user.uid),
          where("timestamp", ">=", Timestamp.fromDate(startOfYear)),
          where("timestamp", "<=", Timestamp.fromDate(endOfYear))
        );
    
        const querySnapshot = await getDocs(q);
        const yearEmotions = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          yearEmotions.push({
            ...data,
            date: data.timestamp.toDate(),
          });
        });
    
        const dataByMonth = months.map((monthName, index) => {
          const monthEmotions = yearEmotions.filter(e => e.date.getMonth() === index);
          return {
            month: monthName,
            monthIndex: index,
            emotions: monthEmotions,
          };
        });
    
        setMonthlyData(dataByMonth);
    } catch (error) {
        console.log("Erro ao buscar dados:", error);
    }
  };

  const handlePotePress = (monthData) => {
    if (monthData.emotions.length > 0) {
        setSelectedMonthData(monthData);
        setCalendarVisible(true);
    }
  };

  const handleDayPress = (day) => {
    if (!selectedMonthData) return;

    const dayEmotions = selectedMonthData.emotions.filter(e => {
      const emotionDate = e.date.toISOString().split('T')[0];
      return emotionDate === day.dateString;
    })
    .map(e => ({
        ...e,
        time: e.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }))
    .sort((a, b) => a.date - b.date);

    if (dayEmotions.length > 0) {
      setSelectedDayEmotions(dayEmotions);
      const dateObj = new Date(day.dateString + 'T12:00:00'); // Use T12 para evitar problemas de fuso horário
      setSelectedDateString(dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
      setCalendarVisible(false);
      setDayDetailsVisible(true);
    }
  };

  const getMarkedDates = () => {
    if (!selectedMonthData) return {};
    const marked = {};
    selectedMonthData.emotions.forEach(emocao => {
      const dateString = emocao.date.toISOString().split('T')[0];
      marked[dateString] = { marked: true, dotColor: '#6EBAD4' };
    });
    
    if (selectedDayEmotions.length > 0) {
        const selectedDate = selectedDayEmotions[0].date.toISOString().split('T')[0];
        if (marked[selectedDate]) {
            marked[selectedDate] = { 
                ...marked[selectedDate], 
                selected: true, 
                selectedColor: '#6EBAD4',
                dotColor: 'white'
            };
        }
    }
    return marked;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#B0E5F7', '#D1F0F7', '#FFF9EA']} locations={[0, 0.6, 1]} style={styles.backgroundGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'<'}{' '}Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Histórico</Text>
          <View style={{ width: 60 }} /> 
        </View>

        {/* SELETOR DE ANO */}
        <View style={styles.yearSelector}>
          <TouchableOpacity onPress={() => setCurrentYear(currentYear - 1)}>
            <Text style={styles.yearArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.yearText}>{currentYear}</Text>
          <TouchableOpacity onPress={() => setCurrentYear(currentYear + 1)}>
            <Text style={styles.yearArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* GRADE DE POTES */}
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.potesGrid}>
            {monthlyData.map((data, index) => (
              <PoteMensal key={index} month={data.month} emotions={data.emotions} onPress={() => handlePotePress(data)} />
            ))}
          </View>
        </ScrollView>

        {/* MODAL CALENDÁRIO */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isCalendarVisible}
          onRequestClose={() => setCalendarVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setCalendarVisible(false)}>
                <Text style={styles.closeButtonText}>{'<'}{' '}Voltar</Text>
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>Histórico</Text>
              <Text style={styles.modalSubtitle}>{currentYear}</Text>
              <Text style={styles.modalMonthTitle}>{selectedMonthData?.month}</Text>
              
              {selectedMonthData && (
                <Calendar
                  current={`${currentYear}-${String(selectedMonthData.monthIndex + 1).padStart(2, '0')}-01`}
                  onDayPress={handleDayPress}
                  monthFormat={'MMMM yyyy'}
                  hideExtraDays={true}
                  firstDay={1}
                  markedDates={getMarkedDates()}
                  hideArrows={true}
                  disableMonthChange={true}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#605D84',
                    selectedDayBackgroundColor: '#6EBAD4',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#00adf5',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    dotColor: '#6EBAD4',
                    selectedDotColor: '#ffffff',
                    arrowColor: '#6EBAD4',
                    monthTextColor: '#414562',
                    indicatorColor: 'blue',
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: 16,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 14
                  }}
                />
              )}
              
              <Image 
                source={require('../assets/logoCamaliLetra.png')} 
                style={styles.camaliImage}
              />
            </View>
          </View>
        </Modal>

        {/* MODAL DETALHES DO DIA */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isDayDetailsVisible}
          onRequestClose={() => setDayDetailsVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContainer, styles.dayDetailsModal]}>
              <TouchableOpacity style={styles.closeButton} onPress={() => { setDayDetailsVisible(false); setCalendarVisible(true); }}>
                <Text style={styles.backButtonText}>{'<'}{' '}Voltar</Text>
              </TouchableOpacity>
              
              <Text style={styles.dayDetailsTitle}>Histórico</Text>
              <Text style={styles.dayDetailsDate}>{selectedDateString}</Text>
              
              <ScrollView style={styles.dayDetailsScrollView}>
                {selectedDayEmotions.map((registro, index) => (
                  <RegistroDeHumor
                    key={index}
                    time={registro.time}
                    emocaoId={registro.emocaoId}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E5E8E8',
  },
  backgroundGradient: {
    flex: 1,
    paddingHorizontal: 10,
  },
  header: {
    marginTop: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 5,
    paddingLeft: 0,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  headerTitle: {
    marginTop: 5,
    marginRight: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  yearArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 15,
  },
  yearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollViewContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  potesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: width * 0.95,
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginTop: 10,
  },
  poteContainer: {
    width: width * 0.3,
    alignItems: 'center',
    marginTop: 30,
    marginVertical: 10,
  },
  poteWrapper: {
    width: width * 0.25,
    height: width * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  jarImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  jarContent: {
    position: 'absolute',
    width: '70%',
    height: '50%',
    bottom: '15%',
    overflow: 'hidden',
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    position: 'absolute',
    bottom: -10,
  },
  jarBolinhaAbsoluta: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  camaliImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginTop: 20,
    resizeMode: 'contain',
  },
  dayDetailsModal: {
    height: '90%',
    width: '95%',
  },
  dayDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  dayDetailsDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  dayDetailsScrollView: {
    flex: 1,
    paddingHorizontal: 10,
  },
  registroContainer: { 
    flexDirection: 'row', 
    marginBottom: 15, 
    alignItems: 'center',
    paddingLeft: 10 
  },
  registroConteudo: { 
    flex: 1, 
    marginLeft: 5 
  },
  registrotempo: { 
    fontSize: 12, 
    color: '#555', 
    marginBottom: 5,
    marginLeft: 10,
  },
  registroCard: { 
    borderRadius: 15, 
    padding: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    minHeight: 80, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.23, 
    shadowRadius: 2.62, 
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
});