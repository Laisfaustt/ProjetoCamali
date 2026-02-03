import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    Dimensions, 
    Modal, 
    Alert 
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer'; 
import { useFocusEffect } from '@react-navigation/native'; // Importante para atualizar ao abrir
import { Ionicons } from '@expo/vector-icons'; 
import { auth, db } from '../config/firebaseConfig'; // Adicionado db
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Adicionado para buscar dados

const { height, width } = Dimensions.get('window');

// Imagem padrão caso não tenha foto
const CAMALI_AVATAR_DEFAULT = require('../assets/camaliperfil.png'); 
const USUARIO_NOME_PLACEHOLDER = 'Carregando...'; 

const DrawerItem = ({ icon, label, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.drawerItem}>
        <Ionicons name={icon} size={24} color="#555" style={styles.drawerIcon} />
        <Text style={styles.drawerLabel}>{label}</Text>
    </TouchableOpacity>
);

const LogoutConfirmationModal = ({ isVisible, onConfirm, onCancel }) => {
    return (
        <Modal
            visible={isVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={onCancel}
        >
            <View style={modalStyles.fundo}>
                <View style={modalStyles.modalCard}>
                    <Text style={modalStyles.modaltitulo}>Sair</Text>
                    <Text style={modalStyles.modaltexto}>Deseja mesmo sair do Camali?</Text>

                    <View style={modalStyles.botaoContainer}>
                        <TouchableOpacity 
                            style={[modalStyles.modalBotao, modalStyles.cancelarBotao]} 
                            onPress={onCancel} 
                            activeOpacity={0.8}
                        >
                            <Text style={modalStyles.textoCancelarBotao}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[modalStyles.modalBotao, modalStyles.confirmarBotao]} 
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={modalStyles.textoConfirmarBotao}>Sair</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function Menu(props) {
    const { navigation } = props;
    
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [nomeUsuario, setNomeUsuario] = useState(USUARIO_NOME_PLACEHOLDER); 
    const [avatarUrl, setAvatarUrl] = useState(null); // Estado para a foto

    // useFocusEffect garante que os dados sejam recarregados sempre que o menu for aberto
    useFocusEffect(
        useCallback(() => {
            const fetchUserProfile = async () => {
                const user = auth.currentUser;
                if (user) {
                    try {
                        const docRef = doc(db, "users", user.uid);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            // Prioriza o nome do Firestore, senão o do Auth, senão "Aluno"
                            setNomeUsuario(data.nome || user.displayName || 'Aluno Camali');
                            // Pega a foto do Firestore
                            setAvatarUrl(data.avatarUrl || user.photoURL || null);
                        } else {
                            // Fallback se não tiver documento no banco ainda
                            setNomeUsuario(user.displayName || 'Aluno Camali');
                            setAvatarUrl(user.photoURL || null);
                        }
                    } catch (error) {
                        console.error("Erro ao buscar perfil no menu:", error);
                    }
                }
            };

            fetchUserProfile();
        }, [])
    );

    const handleOpenLogoutModal = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = async () => {
        try {
            await signOut(auth);
            setShowLogoutModal(false);
            navigation.closeDrawer(); 
            navigation.reset({
                index: 0,
                routes: [{ name: 'TelaInicial' }], 
            });
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            Alert.alert("Erro ao Sair", "Não foi possível desconectar. Tente novamente.");
            setShowLogoutModal(false);
        }
    };

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };
    
    return (
        <View style={styles.mainContainer}> 
            <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
                <View style={styles.perfilContainer}>
                    {/* Lógica para mostrar a foto do usuário ou a padrão */}
                    <Image 
                        source={avatarUrl ? { uri: avatarUrl } : CAMALI_AVATAR_DEFAULT} 
                        style={styles.avatar} 
                    />
                    <Text style={styles.perfilnome}>{nomeUsuario}</Text>
                    <View style={styles.divider} />
                </View>

                <View style={styles.menuContainer}>
                    <DrawerItem 
                        icon="create-outline" 
                        label="Editar perfil" 
                        onPress={() => navigation.navigate('Perfil')}
                    />
                    <DrawerItem 
                        icon="happy-outline" 
                        label="Bem-estar mental" 
                        onPress={() => navigation.navigate('BemEstar')} 
                    />
                    <DrawerItem 
                        icon="chatbubble-ellipses-outline" 
                        label="Chat " 
                        onPress={() => navigation.navigate('chat')} 
                    />
                    <DrawerItem 
                        icon="settings-outline" 
                        label="Configuração " 
                        onPress={() => navigation.navigate('Configuracao')} 
                    />
                </View>
            </DrawerContentScrollView>

            <View style={styles.footer}>
                <DrawerItem 
                    icon="log-out-outline" 
                    label="Sair "
                    onPress={handleOpenLogoutModal}
                />
            </View>
            
            <LogoutConfirmationModal
                isVisible={showLogoutModal}
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
            />

        </View>
    );
}

// ----------------------------------------------------
// ESTILOS
// ----------------------------------------------------

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#FDFBF4', 
    },
    scrollView: {
        paddingBottom: 20, 
    },
    perfilContainer: {
        padding: 20, 
        alignItems: 'center'
    },
    avatar: {
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        marginBottom: 10,
        backgroundColor: '#DCDCDC',
        borderWidth: 2,      // Adicionei uma borda para ficar mais bonito
        borderColor: '#6EBAD4' // Cor do tema
    },
    perfilnome: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#333',
        textAlign: 'center'
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd', 
        width: '100%', 
        marginTop: 15 
    },
    menuContainer: {
        paddingTop: 10, 
    },
    footer: {
        padding: 20, 
        borderTopWidth: 1, 
        borderTopColor: '#ddd', 
        backgroundColor: '#FDFBF4' 
    },
    drawerItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 15, 
        paddingHorizontal: 20 
    },
    drawerIcon: { 
        marginRight: 20 
    },
    drawerLabel: { 
        fontSize: 16, 
        color: '#333' 
    },
});

const modalStyles = StyleSheet.create({
    fundo: {
        flex: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center', 
        justifyContent: 'center', 
    },
    modalCard: {
        width: '80%', 
        maxWidth: 350, 
        backgroundColor: '#FFF9EA', 
        borderRadius: 20, 
        padding: 25, 
        alignItems: 'center',
        shadowColor: '#000', 
        shadowOffset: { 
            width: 0, 
            height: 4 
        }, 
        shadowOpacity: 0.25, 
        shadowRadius: 5, 
        elevation: 10,
    },
    modaltitulo: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#161C4E', 
        marginBottom: 10, 
        textAlign: 'center', 
    },
    modaltexto: { 
        fontSize: 16, 
        color: '#555', 
        textAlign: 'center', 
        marginBottom: 25, 
    },
    botaoContainer: { 
        width: '100%', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
    },
    modalBotao: { 
        flex: 1, 
        paddingVertical: 12, 
        borderRadius: 25, 
        marginHorizontal: 5, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
    },
    confirmarBotao: { 
        backgroundColor: '#6EBAD4', 
        borderColor: '#6EBAD4', 
    },
    textoConfirmarBotao: { 
        color: '#FFF', 
        fontSize: 16, 
        fontWeight: 'bold', 
    },
    cancelarBotao: {
        backgroundColor: 'transparent', 
        borderColor: '#6EBAD4', 
    },
    textoCancelarBotao: {
        color: '#6EBAD4', 
        fontSize: 16,
        fontWeight: 'bold',
    },
});