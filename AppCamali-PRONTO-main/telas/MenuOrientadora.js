import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image,
    Modal, 
    Dimensions,
    Alert 
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // IMPORTANTE: Para atualizar ao abrir

// --- Imports e Configurações Firebase ---
import { auth, db } from '../config/firebaseConfig'; // Adicionado db
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Adicionado para buscar dados
// --- Fim dos Imports Firebase ---

const { height, width } = Dimensions.get('window');
const CAMALI_PERFIL_PADRAO = require('../assets/camaliperfil.png');

const LogoutConfirmationModal = ({ isVisible, onConfirm, onCancel }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onCancel}
        >
            <View style={modalStyles.backdrop}>
                <View style={modalStyles.modalCard}>
                    <Text style={modalStyles.modalTitulo}>Sair</Text>
                    <Text style={modalStyles.modaltext}>Deseja mesmo sair?</Text>

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

const CustomDrawerItem = ({ iconName, label, onPress }) => (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={iconName} size={24} color="#414562" style={styles.icon} />
            <Text style={styles.label}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
);

export default function MenuOrientadora(props) {
    const { navigation } = props;
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    
    // Estados para dados dinâmicos
    const [nomeOrientadora, setNomeOrientadora] = useState('Carregando...');
    const [avatarUrl, setAvatarUrl] = useState(null);

    // --- BUSCA DADOS DO FIRESTORE AO ABRIR O MENU ---
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                const user = auth.currentUser;
                if (user) {
                    try {
                        // Busca o documento do usuário logado
                        const docRef = doc(db, "users", user.uid);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            // Atualiza o nome e a foto com os dados do banco
                            setNomeOrientadora(data.nome || user.displayName || 'Orientadora');
                            setAvatarUrl(data.avatarUrl || null);
                        }
                    } catch (error) {
                        console.error("Erro ao buscar perfil no menu:", error);
                    }
                }
            };

            fetchProfile();
        }, [])
    );

    const handleNavigation = (screenName) => {
        navigation.navigate(screenName);
    };

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
        <View style={styles.container}>
        
            <View style={styles.perfilSection}>
                {/* Foto Dinâmica */}
                <Image
                    source={avatarUrl ? { uri: avatarUrl } : CAMALI_PERFIL_PADRAO} 
                    style={styles.avatar}
                />
                {/* Nome Dinâmico */}
                <Text style={styles.name}>{nomeOrientadora}</Text>
                <View style={styles.divisor} />
            </View>
            
            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                <CustomDrawerItem
                    iconName="pencil-outline"
                    label="Editar Perfil"
                    onPress={() => handleNavigation('Perfil')} 
                />
                <CustomDrawerItem
                    iconName="person-add-outline"
                    label="Cadastrar Aluno"
                    onPress={() => handleNavigation('TelaCadastro')}
                />
                <CustomDrawerItem
                    iconName="settings-outline"
                    label="Configurações"
                    onPress={() => handleNavigation('Configuracao')} 
                />
            </DrawerContentScrollView>

            <View style={styles.footerSection}>
                <CustomDrawerItem
                    iconName="log-out-outline"
                    label="Sair"
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

// --- Estilos ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF4', 
    },
    perfilSection: {
        padding: 20,
        paddingTop: 40, 
        alignItems: 'flex-start',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
        backgroundColor: '#ddd', // Cor de fundo enquanto carrega a imagem
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#414562',
        marginTop: 5,
    },
    divisor: {
        height: 1,
        backgroundColor: '#E0E0E0',
        width: '100%',
        marginTop: 10,
        marginBottom: 10,
    },

    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    icon: {
        marginRight: 15,
    },
    label: {
        flex: 1,
        fontSize: 16,
        color: '#414562',
    },
    footerSection: {
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
});

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
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 25,
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