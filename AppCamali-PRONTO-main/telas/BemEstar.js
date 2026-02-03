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
const CARD_WIDTH = width * 0.43; 

const EMOJIS = require('../assets/emojicortado.png');

const EMOJI_STRIP_WIDTH = 250; 
const EMOJI_STRIP_HEIGHT = 95; 

// Componente SmallCard ajustado: 
// 1. O 'title' (antigo subtítulo) não é mais renderizado.
// 2. O flex do 'content' é ajustado para melhor layout.
const SmallCard = ({ headerTitle, imageSource, onPress }) => ( 
    <TouchableOpacity onPress={onPress} style={[cardPequeno.card, { backgroundColor: '#FFF9EA' }]}>
        <View style={cardPequeno.header}>
            {/* Mantém o título pequeno em cinza claro */}
            <Text style={cardPequeno.title}>{headerTitle}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#444" />
        </View>
        
        {/* O 'content' não tem mais texto, mas mantém a imagem */}
        <View style={cardPequeno.content}>
            {imageSource && (
                // Ajustado para manter a imagem alinhada visualmente sem o subtítulo
                <Image source={imageSource} style={[cardPequeno.imagemFundo, cardPequeno.imagemAjustadaSemTexto]} resizeMode="cover" />
            )}
            {/* O TEXTO PRINCIPAL (SUBTÍTULO) FOI REMOVIDO DAQUI */}
        </View>
    </TouchableOpacity>
);

const BemEstarMentalScreen = () => {
    const navigation = useNavigation(); 

    const handleBack = () => navigation.goBack(); 
    
    const handleEstadoEmocionalPress = () => {
        navigation.navigate('historico'); 
    };
    

    const handleChatOrientadoraPress = () => {
        navigation.navigate('chat'); 
    };
    

    const handleCuidarMentePress = () => {
        navigation.navigate('cuidarMente'); 
    };
    

    const handleQuestionarioPress = () => {
        navigation.navigate('questionario');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#FFF9EA', '#D1F0F7', '#B0E5F7']} 
                locations={[0, 0.5, 1]}
                style={styles.gradientContainer}
            >
                <TouchableOpacity onPress={handleBack} style={styles.voltarBotao}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#444" />
                    <Text style={styles.botaoVoltarTexto}>Voltar</Text>
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.container}>
                    
                    <Text style={styles.tituloPrincipal}>Bem-estar mental</Text>
                    
                    <TouchableOpacity onPress={handleEstadoEmocionalPress} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#444" style={styles.emocaoIcon} />
                            <Text style={styles.cardTitulo1}>Histórico</Text>
                        </View>
                        <View style={emocoesestilo.emojiStripContainer}>
                            <Image
                                source={EMOJIS}
                                style={emocoesestilo.emojiStrip}
                                resizeMode="contain"
                            />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.cardPequenoContainer}>
                        {/* SmallCard para Chat Orientadora (Usando apenas o headerTitle) */}
                        <SmallCard 
                            headerTitle="Chat Orientadora" 
                            imageSource={require('../assets/imgChat.png')}
                            onPress={handleChatOrientadoraPress}
                        />
                        {/* SmallCard para Cuidar da Mente (Usando apenas o headerTitle) */}
                        <SmallCard 
                            headerTitle="Cuidar da Mente" 
                            imageSource={require('../assets/flores.png')}
                            onPress={handleCuidarMentePress}
                        />
                    </View>

                    <View style={[styles.card, styles.questionarioCard]}>
                        <MaterialCommunityIcons 
                            name="clipboard-list-outline" 
                            size={40} 
                            color="#161C4E" 
                            style={styles.questionarioIcone}
                        />
                        <Text style={styles.cardTitulo}>Questionário de Saúde Mental</Text>
                        
                        <Text style={styles.questionarioTexto}>
                            Esta avaliação usa perguntas padronizadas para dar a Você uma ideia do seu risco de ter duas condições muito comuns e tratáveis: a ansiedade e a depressão.
                        </Text>

                        {/* Botão Responder questionário com navegação */}
                        <TouchableOpacity onPress={handleQuestionarioPress} style={styles.questionarioBotao}>
                            <Text style={styles.questionarioBotaoTexto}>Responder questionário</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f8f8', 
    },
    gradientContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0, 
    },
    voltarBotao: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    botaoVoltarTexto: {
        fontSize: 16,
        marginLeft: 5,
        color: '#444',
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    tituloPrincipal: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#161C4E',
        marginBottom: 30,
        paddingHorizontal: 5,
    },
    card: {
        backgroundColor: '#FFF9EA', 
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    cardHeader: { 
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        alignSelf: 'flex-start',
    },
    cardTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#161C4E',
    },
    cardTitulo1: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#161C4E',
    },
    emocaoIcon: {
        marginRight: 10, // Espaçamento padrão entre ícone e texto
    },
    
    cardPequenoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    questionarioCard: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#FFF9EA', 
    },
    questionarioIcone: {
        marginBottom: 10,
    },
    questionarioTexto: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginHorizontal: 10,
        marginTop: 10,
        marginBottom: 25,
        lineHeight: 20,
    },
    questionarioBotao: {
        backgroundColor: '#6EBAD4', 
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        elevation: 3,
    },
    questionarioBotaoTexto: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    }
});

const emocoesestilo = StyleSheet.create({
    emojiStripContainer: {
        width: EMOJI_STRIP_WIDTH * 0.9, 
        height: EMOJI_STRIP_HEIGHT, 
        overflow: 'hidden',
        alignSelf: 'center',
        marginTop: 10, // Adiciona um pequeno espaço entre o cabeçalho e os emojis
    },
    emojiStrip: {
        width: EMOJI_STRIP_WIDTH, 
        height: EMOJI_STRIP_HEIGHT,
    }
});

const cardPequeno = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: 150, 
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 3,
        justifyContent: 'flex-start', // Mudança: Alinha o conteúdo ao topo
        overflow: 'hidden', 
        backgroundColor: '#FFF9EA', 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        zIndex: 1, 
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    content: {
        // Não precisamos mais do 'flex: 1' para empurrar o subtítulo para baixo
        flex: 1, 
        zIndex: 1, 
    },
    // Removido o estilo 'subtitulo' já que o texto foi removido
    
    imagemFundo: {
        position: 'absolute',
        bottom: 0,
        right: 0, 
        width: '100%', 
        height: '100%', 
        opacity: 0.7, 
        zIndex: 0, 
        // Mantém a imagem cobrindo o card
    },
    imagemAjustadaSemTexto: {
        // Garante que a imagem se ajuste bem na área agora que o texto não está mais lá embaixo
        width: '100%',
        height: '100%',
        marginBottom: 0, // Remove o marginBottom que estava associado ao layout antigo
    }
});

export default BemEstarMentalScreen;