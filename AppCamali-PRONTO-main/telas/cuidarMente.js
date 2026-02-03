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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; 

// Certifique-se que a imagem existe no caminho '../assets/flores.png'
const ARTIGO_BACKGROUND = require('../assets/flores.png'); 

const CuidarMenteScreen = () => {
    const navigation = useNavigation(); 

    // CORREÇÃO DE NAVEGAÇÃO: 
    // Usa 'navigate' para voltar à tela 'BemEstarMental' e garantir que o retorno seja o correto, 
    // em vez de apenas depender de goBack() que pode levar à tela inicial.
    // IMPORTANTE: Substitua 'BemEstarMental' pelo NOME DA ROTA que você usa no seu Stack Navigator.
    const handleBack = () => navigation.navigate('BemEstar'); 

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
                    <Text style={styles.tituloPrincipal}>Artigo sobre saúde mental</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
                    <Image 
                        source={ARTIGO_BACKGROUND} 
                        style={styles.artigoImagem} 
                        resizeMode="cover" 
                    />

                    <View style={styles.artigoConteudo}>
                        <Text style={styles.tituloSecao}>Cuidados com a saúde mental</Text>
                        <Text style={styles.paragrafo}>
                            A saúde mental é fundamental para a saúde geral, podendo afetar seus pensamentos, sentimentos e comportamentos. Algumas medidas simples são úteis para manter a saúde mental. Ao colocar algumas delas em prática, você pode lidar melhor com os altos e baixos da vida, melhorar seu estado de espírito e administrar emoções.
                        </Text>

                        <Text style={styles.tituloSecao}>Registre suas emoções e estados de espírito</Text>
                        <Text style={styles.paragrafo}>
                            Quando você mantém um registro das suas emoções e do seu humor, fica mais fácil reconhecer os fatores que contribuem para seu estado emocional. No app saúde, você pode fazer esse registro todos os dias, assim pode associar melhor as emoções ou os humores mais recorrentes com suas possíveis causas.
                        </Text>

                        <Text style={styles.paragrafo}>
                            Ao analisar emoções e humores que você registrou por um determinado período, você pode notar certos padrões. Por exemplo, se você notar que registrou um humor desagradável por um período persistente, talvez seja benéfico responder a um questionário sobre saúde mental. Esse questionário fornece mais informações sobre seu risco para condições comuns e ajuda você a identificar os próximos passos.
                        </Text>
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
    tituloPrincipal: {
        fontSize: 20, 
        fontWeight: 'bold',
        color: '#161C4E',
        textAlign: 'center',
        flex: 1, 
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingBottom: 40,
    },
    artigoImagem: {
        width: '100%',
        height: 200, 
        marginBottom: 20,
    },
    artigoConteudo: {
        paddingHorizontal: 20,
    },
    tituloSecao: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#161C4E',
        marginBottom: 10,
        marginTop: 15,
    },
    paragrafo: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginBottom: 15,
        textAlign: 'justify',
    },
});

export default CuidarMenteScreen;