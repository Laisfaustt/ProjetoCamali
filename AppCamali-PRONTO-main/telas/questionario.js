import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    SafeAreaView, 
    Platform,
    Modal,
    Linking,
    Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';

const QuestionarioScreen = () => {
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);
    const [resultadoModalVisible, setResultadoModalVisible] = useState(false); // Novo estado para o modal de resultados

    const handleBack = () => {
        // Verifica se o objeto de navegação existe e se pode voltar
        if (navigation && navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // Ação alternativa se não houver navegação (útil para testes isolados)
            console.log("Navegação indisponível ou não pode voltar.");
        }
    };

    const handleContinuarPress = () => {
        setModalVisible(true);
    };

    const handleAceitarTermos = async () => {
        setModalVisible(false);
        const url = 'https://forms.gle/iArZVy4j2VRaGXXE7';
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
            // Exibe o modal de resultados imediatamente após abrir o link, simulando o retorno.
            setResultadoModalVisible(true); 
        } else {
            console.error(`Não foi possível abrir o link: ${url}`);
        }
    };

    const handleCancelarTermos = () => {
        setModalVisible(false);
    };

    const handleResultadoOk = () => {
        setResultadoModalVisible(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            
            <Image 
                source={require('../assets/fundologin.png')} 
                style={styles.fundoImagem}
            />
            
            <View style={styles.overlayContent}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.voltarBotao}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#444" />
                        <Text style={styles.botaoVoltarTexto}>Voltar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    
                    <MaterialCommunityIcons 
                        name="clipboard-list-outline" 
                        size={80} 
                        color="#439AAB" 
                        style={styles.icone}
                    />
                    
                    <Text style={styles.titulo}>Questionário de Saúde Mental</Text>
                    
                    <Text style={styles.descricao}>
                        Esta avaliação usa perguntas padronizadas para que caso você precise de ajuda a Orientadora analise seu questionário e entre em contato.
                    </Text>

                    <TouchableOpacity onPress={handleContinuarPress} style={styles.botaoComecar}>
                        <Text style={styles.botaoComecarTexto}>Começar</Text>
                    </TouchableOpacity>

                </View>
            </View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCancelarTermos}
            >
                <View style={modalStyles.centeredView}>
                    <View style={modalStyles.modalView}>
                        <Text style={modalStyles.modalTitle}>Termos e condições</Text>
                        
                        <View style={modalStyles.termosContainer}>
                            <Text style={modalStyles.termoItem}>
                                <Text style={modalStyles.termoNumero}>1. </Text>
                                Ao prosseguir com este questionário, você declara estar ciente de que: Este questionário não possui caráter diagnóstico. Trata-se apenas de um instrumento de apoio e reflexão, não substituindo avaliação médica, psicológica ou profissional especializada.
                            </Text>
                            <Text style={modalStyles.termoItem}>
                                <Text style={modalStyles.termoNumero}>2. </Text>
                                A confidencialidade será preservada. As respostas e resultados serão compartilhados exclusivamente com a orientadora escolar, com o objetivo de oferecer suporte acadêmico e educacional.
                            </Text>
                            <Text style={modalStyles.termoItem}>
                                <Text style={modalStyles.termoNumero}>3. </Text>
                                Ao continuar, você concorda com estes termos e autoriza o uso das informações apenas para a finalidade descrita.
                            </Text>
                        </View>

                        <Text style={modalStyles.modalFooter}>
                            Ao continuar, você declara estar ciente e de acordo com esses termos.
                        </Text>

                        <View style={modalStyles.buttonContainer}>
	                            <TouchableOpacity
	                                style={[modalStyles.button, modalStyles.buttonCancel]}
	                                onPress={handleCancelarTermos}
	                            >
	                                <Text style={modalStyles.textStyleCancel}>Cancelar</Text>
	                            </TouchableOpacity>
	                            <TouchableOpacity
	                                style={[modalStyles.button, modalStyles.buttonAccept]}
	                                onPress={handleAceitarTermos}
	                            >
	                                <Text style={modalStyles.textStyle}>Aceitar</Text>
	                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
	            </Modal>

                {/* Novo Modal de Resultado do Questionário */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={resultadoModalVisible}
                    onRequestClose={handleResultadoOk}
                >
                    <View style={resultadoModalStyles.centeredView}>
                        <View style={resultadoModalStyles.modalView}>
                            <TouchableOpacity 
                                style={resultadoModalStyles.okButton}
                                onPress={handleResultadoOk}
                            >
                                <Text style={resultadoModalStyles.okButtonText}>OK</Text>
                            </TouchableOpacity>

                            <MaterialCommunityIcons 
                                name="clipboard-check-outline" 
                                size={80} 
                                color="#439AAB" 
                                style={resultadoModalStyles.icone}
                            />
                            
                            <Text style={resultadoModalStyles.titulo}>Resultados</Text>

                            <TouchableOpacity style={resultadoModalStyles.botaoAguarde}>
                                <Text style={resultadoModalStyles.botaoAguardeTexto}>Aguarde</Text>
                                <MaterialCommunityIcons name="information-outline" size={16} color="#FFF" style={{ marginLeft: 5 }} />
                            </TouchableOpacity>

                            <Text style={resultadoModalStyles.descricao}>
                                A orientadora analisará atentamente o seu questionário e, caso seja necessário, entrará em contato para esclarecer dúvidas, solicitar ajustes ou complementar informações.
                            </Text>

                            <View style={resultadoModalStyles.divisor} />

                            <Text style={resultadoModalStyles.subtitulo}>Próximos Passos</Text>

                            <Text style={resultadoModalStyles.passoItem}>
                                Pode ser importante discutir os riscos de ansiedade e depressão com uma pessoa de sua confiança.
                            </Text>
                            <Text style={resultadoModalStyles.passoItem}>
                                A nossa equipe pode fornecer recursos para ajudar você a controlar os sintomas.
                            </Text>
                            <Text style={resultadoModalStyles.passoItem}>
                                Os resultados do questionário não representam um diagnóstico.
                            </Text>
                        </View>
                    </View>
                </Modal>
	        </SafeAreaView>
	    );
	};
	
	const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF9EA', 
    },
    fundoImagem: {
         position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250, 
    width: '100%',
    resizeMode: 'cover',
    zIndex: 1, 
    },
    overlayContent: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0, 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'transparent', 
    },
    voltarBotao: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    botaoVoltarTexto: {
        fontSize: 16,
        marginLeft: 5,
        color: '#444',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 50,
        paddingTop: 50,
        backgroundColor: 'transparent', 
    },
    icone: {
        marginBottom: 20,
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#161C4E',
        textAlign: 'center',
        marginBottom: 15,
    },
    descricao: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 50,
        lineHeight: 20,
    },
    botaoComecar: {
        backgroundColor: '#6EBAD4', 
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 30,
        elevation: 3,
        width: '90%',
        marginBottom: 30,
    },
    botaoComecarTexto: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
});

	const modalStyles = StyleSheet.create({
	    centeredView: {
	        flex: 1,
	        justifyContent: 'center',
	        alignItems: 'center',
	        backgroundColor: 'rgba(0, 0, 0, 0.5)',
	        paddingHorizontal: 20,
	    },
	    modalView: {
	        width: '100%',
	        backgroundColor: '#FFF9EA', // Cor de fundo bege claro
	        borderRadius: 20,
	        paddingVertical: 25,
	        paddingHorizontal: 20,
	        alignItems: 'center',
	        shadowColor: '#000',
	        shadowOffset: { width: 0, height: 4 },
	        shadowOpacity: 0.25,
	        shadowRadius: 5,
	        elevation: 10,
	    },
	    modalTitle: {
	        fontSize: 20,
	        fontWeight: 'bold',
	        color: '#161C4E', // Cor escura para o título
	        textAlign: 'center',
	        marginBottom: 15,
	    },
	    termosContainer: {
	        marginBottom: 15,
	    },
	    termoItem: {
	        fontSize: 13,
	        color: '#555',
	        marginBottom: 8,
	        textAlign: 'justify',
	        lineHeight: 18,
	    },
	    termoNumero: {
	        fontWeight: 'bold',
	        color: '#161C4E',
	    },
	    modalFooter: {
	        fontSize: 15,
	        fontWeight: '600',
	        color: '#444',
	        textAlign: 'center',
	        marginBottom: 20,
	    },
	    buttonContainer: {
	        flexDirection: 'row',
	        justifyContent: 'space-between',
	        width: '100%',
	    },
	    button: {
	        flex: 1,
	        borderRadius: 25,
	        paddingVertical: 12,
	        marginHorizontal: 5,
	        alignItems: 'center',
	        justifyContent: 'center',
	        borderWidth: 1,
	    },
	    buttonCancel: {
	        backgroundColor: 'transparent', // Fundo transparente
	        borderColor: '#6EBAD4', // Borda azul claro
	    },
	    buttonAccept: {
	        backgroundColor: '#6EBAD4', // Cor azul claro
	        borderColor: '#6EBAD4',
	    },
	    textStyle: {
	        fontWeight: 'bold',
	        color: '#FFF', // Texto branco para o botão de aceitar
	    },
	    textStyleCancel: {
	        fontWeight: 'bold',
	        color: '#6EBAD4', // Texto azul claro para o botão de cancelar
	    },
	});
	
	const resultadoModalStyles = StyleSheet.create({
	    centeredView: {
	        flex: 1,
	        justifyContent: 'center',
	        alignItems: 'center',
	        backgroundColor: 'rgba(0, 0, 0, 0.5)',
	        paddingHorizontal: 20,
	    },
	    modalView: {
	        width: '100%',
	        backgroundColor: '#FFF9EA', // Cor de fundo da imagem
	        borderRadius: 16,
	        paddingVertical: 25,
	        paddingHorizontal: 20,
	        alignItems: 'center',
	        shadowColor: '#000',
	        shadowOffset: { width: 0, height: 2 },
	        shadowOpacity: 0.25,
	        shadowRadius: 4,
	        elevation: 5,
	        minHeight: '70%',
	    },
	    okButton: {
	        position: 'absolute',
	        top: 10,
	        right: 10,
	        padding: 10,
	        zIndex: 10,
	    },
	    okButtonText: {
	        fontSize: 16,
	        fontWeight: 'bold',
	        color: '#439AAB',
	    },
	    icone: {
	        marginTop: 20,
	        marginBottom: 10,
	    },
	    titulo: {
	        fontSize: 24,
	        fontWeight: 'bold',
	        color: '#161C4E',
	        marginBottom: 20,
	    },
	    botaoAguarde: {
	        flexDirection: 'row',
	        backgroundColor: '#161C4E',
	        paddingVertical: 8,
	        paddingHorizontal: 20,
	        borderRadius: 20,
	        alignItems: 'center',
	        marginBottom: 30,
	    },
	    botaoAguardeTexto: {
	        color: '#FFF',
	        fontWeight: 'bold',
	    },
	    descricao: {
	        fontSize: 14,
	        color: '#555',
	        textAlign: 'center',
	        lineHeight: 20,
	        marginBottom: 20,
	    },
	    divisor: {
	        height: 1,
	        backgroundColor: '#E0E0E0',
	        width: '100%',
	        marginVertical: 20,
	    },
	    subtitulo: {
	        fontSize: 18,
	        fontWeight: 'bold',
	        color: '#161C4E',
	        alignSelf: 'flex-start',
	        marginBottom: 10,
	    },
	    passoItem: {
	        fontSize: 14,
	        color: '#555',
	        marginBottom: 15,
	        lineHeight: 20,
	        textAlign: 'justify',
	    },
	});
	
	
	export default QuestionarioScreen;