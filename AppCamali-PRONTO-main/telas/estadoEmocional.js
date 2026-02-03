import React from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    ScrollView, 
    SafeAreaView, 
    Image,
    Platform,
    Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; 

const { width } = Dimensions.get('window');

// Componente reutilizável para o Card de Resumo de Humor
const HumorCard = ({ title, moodText, emojiSource, isLarge = false }) => {
    const cardStyle = isLarge ? cardStyles.largeCard : cardStyles.smallCard;
    const emojiStyle = isLarge ? cardStyles.largeEmoji : cardStyles.smallEmoji;
    const moodTextStyle = isLarge ? cardStyles.largeMoodText : cardStyles.smallMoodText;
    const titleStyle = isLarge ? cardStyles.largeTitle : cardStyles.smallTitle;

    return (
        <View style={cardStyle}>
            <Text style={titleStyle}>{title}</Text>
            <Image source={emojiSource} style={emojiStyle} resizeMode="contain" />
            <Text style={moodTextStyle}>{moodText}</Text>
        </View>
    );
};

const EstadoEmocionalScreen = () => {
    const navigation = useNavigation(); 

    const handleBack = () => navigation.goBack(); 

    const emojiMuitoAgradavel = require('../assets/desanimado.png');
    const emojiAgradavel = require('../assets/feliz.png');

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#FFFFFF', '#D1F0F7', '#B0E5F7']} 
                locations={[0, 0.5, 1]}
                style={styles.gradientContainer}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.voltarBotao}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#444" />
                        <Text style={styles.botaoVoltarTexto}>Voltar</Text>
                    </TouchableOpacity>
                    <Text style={styles.tituloPrincipal}>Estado Emocional</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView contentContainerStyle={styles.container}>
                    
                    {/* Resumo de Hoje */}
                    <Text style={styles.dataTitulo}>Hoje, 27 de agosto.</Text>
                    <HumorCard 
                        title="Resumo Humor do Dia"
                        moodText="Um dia muito Agradável"
                        emojiSource={emojiMuitoAgradavel}
                        isLarge={true}
                    />
                    
                    {/* Resumo de Ontem */}
                    <Text style={styles.dataTitulo}>Ontem, 26 de agosto.</Text>
                    <HumorCard 
                        title="Resumo Humor do Dia anterior"
                        moodText="Um dia Agradável"
                        emojiSource={emojiAgradavel}
                        isLarge={false}
                    />
                    
                    {/* Adicione mais cards de dias anteriores aqui, se necessário */}

                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};

// Estilos gerais, adaptados do código base para manter a consistência
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f8f8', 
    },
    gradientContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0, 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    voltarBotao: {
        flexDirection: 'row',
        alignItems: 'center',
        // Ocupa o espaço do botão para ajudar a centralizar o título
        width: 80, 
    },
    botaoVoltarTexto: {
        fontSize: 16,
        marginLeft: 5,
        color: '#444',
    },
    placeholder: {
        width: 80,
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    tituloPrincipal: {
        fontSize: 20,
        marginTop: 10,
        fontWeight: 'bold',
        color: '#161C4E',
        textAlign: 'center',
        flex: 1, // Permite que o título ocupe o espaço central
    },
    dataTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#161C4E',
        marginBottom: 15,
        marginTop: 20,
    },
});

// Estilos específicos para os Cards de Humor
const cardStyles = StyleSheet.create({
    // Estilos para o Card Grande (Hoje)
    largeCard: {
        // Cor de fundo baseada no código fornecido: '#FFF9EA'
        backgroundColor: '#FFF9EA', 
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 20,
    },
    largeTitle: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        marginBottom: 10,
        textAlign: 'center',
    },
    largeEmoji: {
        width: 100,
        height: 100,
        marginBottom: 15,
    },
    largeMoodText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#161C4E',
        textAlign: 'center',
    },

    // Estilos para o Card Pequeno (Ontem e dias anteriores)
    smallCard: {
        // Cor de fundo baseada no código fornecido: '#FFF9EA'
        backgroundColor: '#FFF9EA', 
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 10,
        // Ajuste para o layout do card pequeno
        flexDirection: 'column', 
        paddingHorizontal: 30,
    },
    smallTitle: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        marginBottom: 5,
        textAlign: 'center',
    },
    smallEmoji: {
        width: 50,
        height: 50,
        marginBottom: 5,
    },
    smallMoodText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#161C4E',
        textAlign: 'center',
    },
});

export default EstadoEmocionalScreen;