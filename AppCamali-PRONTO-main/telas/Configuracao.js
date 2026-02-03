import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    Image, 
    TouchableOpacity, 
    Switch, 
    ScrollView, 
    Platform, 
    Linking, 
    Dimensions, 
    Modal,
    StatusBar,
    Alert, // Importante para avisos de erro
    ActivityIndicator // Para mostrar carregamento durante a exclusão
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; 

// --- IMPORTS DO FIREBASE ADICIONADOS ---
import { auth, db } from '../config/firebaseConfig';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

const { height, width } = Dimensions.get('window');
const CAMALI_LOGO = require('../assets/logoCamaliLetra.png'); 

const SettingsItem = ({ iconName, label, onPress, isExpanded, children }) => (
    <View style={styles.itemWrapper}>
        <TouchableOpacity 
            style={styles.settingsItem} 
            onPress={onPress}
            activeOpacity={0.7} 
        >
            <Ionicons name={iconName} size={22} color="#444" style={styles.itemIcone} />
            <Text style={styles.itemLabel}>{label}</Text>
            <View style={styles.itemContent}>
                {children}
                {typeof isExpanded === 'boolean' && (
                    <MaterialCommunityIcons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={24} 
                        color="#444" 
                    />
                )}
            </View>
        </TouchableOpacity>

        {label === "Privacidade e segurança" && isExpanded && (
            <View style={styles.expandidoContent}>
                <Text style={styles.textoExpandido}>
                    Seus dados são tratados com confidencialidade e protegidos conforme a legislação vigente. As informações coletadas são utilizadas apenas para aprimorar os serviços do aplicativo.
                </Text>
                <Text style={styles.textoExpandido}>
                    Seus dados serão compartilhados apenas com a orientadora.
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.camaliapp.com.br')}>
                    <Text style={styles.linkTexto}>Saiba mais sobre o app www.camaliapp.com.br</Text>
                </TouchableOpacity>
            </View>
        )}

        {label === "Termos de uso" && isExpanded && (
            <View style={styles.expandidoContent}>
                <Text style={styles.textoExpandidoTitulo}>Última atualização: 01/01/2024</Text>
                <Text style={styles.textoExpandido}>
                    Ao usar o aplicativo Camali, você concorda em cumprir integralmente os Termos de Uso. O uso é concedido sob uma licença não exclusiva, intransferível e revogável.
                </Text>
                <Text style={styles.textoExpandido}>
                    Você é responsável pela segurança de sua conta e por todas as atividades realizadas sob ela. Reservamos o direito de suspender ou encerrar contas que violem estes termos.
                </Text>
                <Text style={styles.textoExpandido}>
                    A propriedade intelectual de todo o conteúdo do app Camali (textos, gráficos, interface, etc.) pertence à Camali ou seus licenciadores. O uso não autorizado é proibido.
                    Detalhes
                </Text>
            </View>
        )}
    </View>
);

const DeleteConfirmationModal = ({ isVisible, onClose, onConfirm, isLoading }) => {
    return (
        <Modal
            animationType="fade" 
            transparent={true}    
            visible={isVisible}   
            onRequestClose={onClose}
        >
            <View style={modalStyles.backdrop}> 
                <View style={modalStyles.modalCard}>
                    <Text style={modalStyles.modalTitulo}>Excluir conta permanentemente?</Text>
                    
                    <Text style={modalStyles.modaltext}>
                        Ao excluir sua conta, todos os seus dados, incluindo o histórico de humor e demais informações registradas, serão permanentemente apagados.
                    </Text>

                    <View style={modalStyles.avisoCaixa}>
                        <MaterialCommunityIcons 
                            name="alert-outline" 
                            size={20} 
                            color="#D84F45" 
                            style={modalStyles.avisoIcone} 
                        />
                        <Text style={modalStyles.avisoTexto}>
                            Essa ação é irreversível, e não será possível recuperar os dados após a exclusão.
                        </Text>
                    </View>

                    <Text style={modalStyles.modaltextoBotao}>
                        Você tem certeza que deseja excluir sua conta?
                    </Text>

                    {/* Action Buttons */}
                    <View style={modalStyles.botaoContainer}>
                        <TouchableOpacity 
                            style={[modalStyles.modalBotao, modalStyles.deletarBotao]} 
                            onPress={onConfirm}
                            activeOpacity={0.8}
                            disabled={isLoading} // Desabilita se estiver carregando
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={modalStyles.deletarBotaoTexto}>Excluir</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[modalStyles.modalBotao, modalStyles.cancelarBotao]} 
                            onPress={onClose}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            <Text style={modalStyles.cancelarbotaoTexto}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const ConfiguracoesScreen = () => {
    const navigation = useNavigation(); 

    const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
    const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);
    const [isTermsExpanded, setIsTermsExpanded] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); // Estado de carregamento
    
    const toggleNotifications = () => 
        setIsNotificationsEnabled(previousState => !previousState);

    const handleBack = () => navigation.goBack(); 

    const handlePrivacyPress = () => {
        setIsPrivacyExpanded(prev => !prev);
        if (!isPrivacyExpanded) setIsTermsExpanded(false); 
    };

    const handleTermsPress = () => {
        setIsTermsExpanded(prev => !prev);
        if (!isTermsExpanded) setIsPrivacyExpanded(false); 
    };
    
    const handleDeleteAccount = () => {
        setIsDeleteModalVisible(true);
    };

    // --- FUNÇÃO DE EXCLUSÃO IMPLEMENTADA ---
    const handleConfirmDelete = async () => {
        const user = auth.currentUser;

        if (!user) {
            setIsDeleteModalVisible(false);
            return;
        }

        setIsDeleting(true); // Inicia loading

        try {
            // 1. Excluir dados do Firestore (Perfil do usuário)
            // É boa prática excluir os dados antes de excluir a autenticação
            const userDocRef = doc(db, "users", user.uid);
            await deleteDoc(userDocRef);

            // Nota: Se você tiver subcoleções ou documentos em 'emocoes', 
            // eles não são apagados automaticamente pelo deleteDoc do pai.
            // Para um app simples, apagar o usuário e o Auth geralmente é suficiente para impedir o acesso.

            // 2. Excluir usuário da Autenticação (Auth)
            await deleteUser(user);

            // 3. Sucesso
            setIsDeleting(false);
            setIsDeleteModalVisible(false);
            
            Alert.alert("Conta Excluída", "Sua conta foi removida com sucesso.");
            
            // Redirecionar para tela inicial/login
            navigation.reset({
                index: 0,
                routes: [{ name: 'TelaInicial' }], 
            });

        } catch (error) {
            setIsDeleting(false);
            console.error("Erro ao excluir conta: ", error);

            // Tratamento específico para erro de login recente necessário
            if (error.code === 'auth/requires-recent-login') {
                setIsDeleteModalVisible(false);
                Alert.alert(
                    "Segurança",
                    "Para excluir sua conta, é necessário que você tenha feito login recentemente. Por favor, saia do aplicativo, entre novamente e tente excluir a conta."
                );
            } else {
                Alert.alert("Erro", "Ocorreu um erro ao tentar excluir sua conta. Tente novamente mais tarde.");
            }
        }
    };

    const handleCloseModal = () => {
        if (!isDeleting) {
            setIsDeleteModalVisible(false);
        }
    };

    return (
        <View style={styles.screenWrapper}> 
            <StatusBar barStyle="dark-content" /> 
            <LinearGradient
                colors={['#B0E5F7', '#D1F0F7', '#FFF9EA']}
                locations={[0, 0.5, 1]}
                style={styles.gradientContainer}
            >
                
                <TouchableOpacity onPress={handleBack} style={styles.botaoVoltar}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#000" />
                    <Text style={styles.botaoVoltarTexto}>Voltar </Text>
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.container}>
                    
                    <Text style={styles.tituloPrincipal}>Configurações</Text>
                    <Text style={styles.subtitulo}>Configurações e privacidade  </Text>

                    <View style={styles.card}>
                        
                        <SettingsItem 
                            iconName="shield-checkmark-outline" 
                            label="Privacidade e segurança" 
                            onPress={handlePrivacyPress}
                            isExpanded={isPrivacyExpanded}
                        />

                        <SettingsItem 
                            iconName="document-text-outline" 
                            label="Termos de uso" 
                            onPress={handleTermsPress}
                            isExpanded={isTermsExpanded}
                        />

                        <SettingsItem 
                            iconName="notifications-outline" 
                            label="Notificações" 
                            onPress={() => toggleNotifications()}
                            isExpanded={false}
                        >
                            <Switch
                                trackColor={{ false: "#767577", true: "#6EBAD4" }} 
                                thumbColor={isNotificationsEnabled ? "#fff" : "#f4f3f4"}
                                onValueChange={toggleNotifications}
                                value={isNotificationsEnabled}
                            />
                        </SettingsItem>
                    
                        <TouchableOpacity onPress={handleDeleteAccount} style={styles.deletarBotao}>
                            <Text style={styles.botaoDeletarTexto}>Excluir conta</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.footerLogoContainer}>
                        <Image source={CAMALI_LOGO} style={styles.camaliLogo} />
                    </View>

                </ScrollView>
            </LinearGradient>
            
            <DeleteConfirmationModal
                isVisible={isDeleteModalVisible}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting} // Passa o estado de loading para o modal
            />
        </View>
    );
};

const modalStyles = StyleSheet.create({
    backdrop: {
        flex: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCard: {
        width: '85%',
        maxWidth: 400, 
        backgroundColor: '#FFF9EA', 
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 10,
    },
    modalTitulo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#161C4E', 
        textAlign: 'center',
        marginBottom: 15,
    },
    modaltext: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 20,
    },
    modaltextoBotao: {
        fontSize: 15,
        color: '#444',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
    },
    avisoCaixa: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFE9E7', 
        borderRadius: 10,
        padding: 15,
        width: '100%',
        marginBottom: 20,
    },
    avisoIcone: {
        marginRight: 10,
        marginTop: 2,
    },
    avisoTexto: {
        flex: 1,
        fontSize: 13,
        color: '#D84F45', 
        lineHeight: 18,
    },
    botaoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalBotao: {
        flex: 1,
        borderRadius: 25,
        paddingVertical: 12,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        height: 50, // Altura fixa para manter o botão estável com o loading
    },
    deletarBotao: {
        backgroundColor: '#6EBAD4', 
        borderColor: '#6EBAD4',
    },
    deletarBotaoTexto: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelarBotao: {
        backgroundColor: 'transparent', 
        borderColor: '#6EBAD4', 
    },
    cancelarbotaoTexto: {
        color: '#6EBAD4', 
        fontSize: 16,
        fontWeight: 'bold',
    },
});

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
    },
    gradientContainer: {
        flex: 1,
    },
    container: {
        marginTop: 180, 
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    botaoVoltar: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 20 : 60,
        left: 20,
        zIndex: 100,
        padding: 5,
    },
    botaoVoltarTexto: {
        fontSize: 16,
        marginLeft: 5,
        color: '#000',
    },
    tituloPrincipal: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#161C4E',
        marginBottom: 5,
        marginTop: Platform.OS === 'android' ? 20 : 0,
    },
    subtitulo: {
        fontSize: 16,
        color: '#161C4E',
        marginBottom: 30,
    },
    card: {
        width: '100%',
        backgroundColor: '#FFF9EA',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        paddingHorizontal: 0, 
        paddingVertical: 10,
        marginBottom: 30,
    },
    itemWrapper: {
        width: '100%',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20, 
        justifyContent: 'space-between',
    },
    itemIcone: {
        marginRight: 15,
    },
    itemLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600', 
        flex: 1,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandidoContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    textoExpandido: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
        lineHeight: 20,
    },
    linkTexto: {
        fontSize: 14,
        color: '#6EBAD4', 
        fontWeight: '600',
        textDecorationLine: 'underline',
        marginTop: 5,
    },
    deletarBotao: {
        width: '90%', 
        alignSelf: 'center',
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#6EBAD4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
        marginTop: 50, 
    },
    botaoDeletarTexto: {
        fontSize: 16,
        color: '#6EBAD4',
        fontWeight: '500',
    },
    footerLogoContainer: {
        alignItems: 'center',
        marginTop: 'auto',
    },
    camaliLogo: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    textoExpandidoTitulo: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
        lineHeight: 20,
        fontWeight: 'bold', 
    },
});

export default ConfiguracoesScreen;