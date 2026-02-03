import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    TextInput,
    Platform,
    Modal, 
    Dimensions, 
    Alert, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

const { height, width } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans';
import * as SplashScreen from 'expo-splash-screen';

import { auth, db } from './config/firebaseConfig';
// ADICIONADO: signOut para deslogar caso o email não seja permitido no auto-login
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Telas
import TelaPotinho from './telas/TelaPotinho';
import InicioScreen from './telas/inicio';
import Menu from './telas/Menu';
import PerfilScreen from './telas/Perfil'; 
import Configuracao from './telas/Configuracao'; 
import chat from './telas/chat'; 
import BemEstar from './telas/BemEstar'; 
import TelaOrientadora from './telas/TelaOrientadora';
import MenuOrientadora from './telas/MenuOrientadora';
import TelaCadastro from './telas/telaCadastro';
import PerfilAlunoScreen from './telas/perfilAluno';
import historico from './telas/historico';
import estadoEmocional from './telas/estadoEmocional';
import questionario from './telas/questionario';
import cuidarMente from './telas/cuidarMente';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// --- CONSTANTE DO DOMÍNIO PERMITIDO ---
const DOMINIO_ORIENTADORA = '@orientador.senai.br';

//drawer para aluno
function AppPrincipalDrawer() {
    return (
        <Drawer.Navigator
            drawerContent={props => <Menu {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: { backgroundColor: '#FDFBF4', width: 280 },
            }}
        >
            <Drawer.Screen name="Meu Potinho" component={TelaPotinho} />
            <Drawer.Screen name="Perfil" component={PerfilScreen} />
            <Drawer.Screen name="Configuracao" component={Configuracao} />
            <Drawer.Screen name="chat" component={chat} />
            <Drawer.Screen name="BemEstar" component={BemEstar} />
            <Drawer.Screen name="historico" component={historico} />
            <Drawer.Screen name="estadoEmocional" component={estadoEmocional} />
            <Drawer.Screen name="questionario" component={questionario} />
            <Drawer.Screen name="cuidarMente" component={cuidarMente} />
        </Drawer.Navigator>
    );
}

//drawer para orientadora
function AppOrientadoraDrawer() {
    return (
        <Drawer.Navigator
            drawerContent={props => <MenuOrientadora {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: { backgroundColor: '#FDFBF4', width: 280 },
            }}
        >
            <Drawer.Screen name="Tela Orientadora" component={TelaOrientadora} />
            <Drawer.Screen name="Perfil" component={PerfilScreen} />
            <Drawer.Screen name="Configuracao" component={Configuracao} />
            <Drawer.Screen name="TelaCadastro" component={TelaCadastro} />
            <Drawer.Screen name="perfilAluno" component={PerfilAlunoScreen} />
            <Drawer.Screen name="historico" component={historico} />
        </Drawer.Navigator>
    );
}

function TelaInicial({ navigation }) {
    return (
        <LinearGradient
            colors={['#FFF9EA', '#FFF9EA', '#73BCD5']}
            locations={[0, 0.5, 1]}
            style={estilos.container}>
            <Text style={estilos.titulo}>Olá, Seja bem-vindo </Text>
            <Image
                source={require('./assets/logoCamaliLetra.png')}
                style={estilos.logo}
                resizeMode="contain"
            />
            <Text style={estilos.subtitulo}>Faça seu login como:  </Text>
            <TouchableOpacity
                style={estilos.botaoPrimario}
                onPress={() => navigation.navigate('Login', { tipoUsuario: 'aluno' })}>
                <Text style={estilos.textoBotaoPrimario}>      Aluno (a)     </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={estilos.botaoSecundario}
                onPress={() => navigation.navigate('Login', { tipoUsuario: 'orientadora' })}>
                <Text style={estilos.textoBotaoSecundario}>Orientador (a)  </Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}

function TelaLogin({ navigation, route }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showConsentModal, setShowConsentModal] = useState(false); 
    const tipoUsuario = route.params?.tipoUsuario || 'aluno';
    const orientadora = tipoUsuario === 'orientadora';

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha o email e a senha.');
            return;
        }

        // --- TRAVA DE SEGURANÇA NO LOGIN ---
        // Remove espaços em branco antes e depois do email com .trim()
        const emailLimpo = email.trim().toLowerCase();

        if (orientadora) {
            if (!emailLimpo.includes(DOMINIO_ORIENTADORA)) {
                Alert.alert(
                    'Acesso Restrito', 
                    `Acesso de Orientador permitido apenas para emails terminados em ${DOMINIO_ORIENTADORA}`
                );
                return; // Para tudo e não tenta logar
            }
        }

        try {
            // Tenta logar no Firebase
            await signInWithEmailAndPassword(auth, emailLimpo, password);
            
            // Se passou pelo login e é orientadora, o AuthNavigator vai fazer uma
            // segunda verificação, mas aqui já garantimos o domínio.
            mostrarAvisoConsentimento();

        } catch (error) {
            let errorMessage = "Ocorreu um erro ao fazer login.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'Email ou senha inválidos.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'O formato do email é inválido.';
            }
            Alert.alert('Erro de Login', errorMessage);
        }
    };

    const mostrarAvisoConsentimento = () => {
        if (orientadora) {
            // Redirecionamento manual caso o AuthNavigator demore
            navigation.replace('AppOrientadora');
            return;
        }
        setShowConsentModal(true);
    };

    const handleAceitarConsentimento = () => {
        setShowConsentModal(false);
        navigation.replace('AppPrincipal');
    };

    const handleCancelarConsentimento = () => {
        setShowConsentModal(false);
    };

    return (
        <View style={estilosLogin.container}>
            <View style={estilos.topo}>
                <Image source={require('./assets/fundologin.png')} style={estilos.topo} />
            </View>

            <View style={estilosLogin.card}>
                <Text style={estilosLogin.titulo}>Bem vindo!</Text>
                <Text style={estilosLogin.subtitulo}>
                    {orientadora ? 'Acesso restrito a Orientadores' : 'Faça seu login com o email educacional'}
                </Text>

                <TextInput 
                    style={estilosLogin.input} 
                    placeholder={orientadora ? "seu.nome@orientador.senai.br" : "Digite seu email"} 
                    value={email} 
                    onChangeText={setEmail} 
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={estilosLogin.input}
                    placeholder="Digite sua senha"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => navigation.navigate('RecuperarSenhaEmail', { tipoUsuario: tipoUsuario })}>
                    <Text style={estilosLogin.link}>Esqueci a senha</Text>
                </TouchableOpacity>

                <TouchableOpacity style={estilosLogin.botaoEntrar} onPress={handleLogin}>
                    <Text style={estilosLogin.textoBotao}>Entrar</Text>
                </TouchableOpacity>
                {!orientadora && (
                    <>
                        <Text style={estilosLogin.conta}>Não tem uma conta?</Text>
                        <Text style={estilosLogin.linkNegrito}>Entre em contato com a orientadora.</Text>
                    </>
                )}
            </View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={showConsentModal}
                onRequestClose={handleCancelarConsentimento}
            >
                <View style={modalStyles.backdrop}>
                    <View style={modalStyles.modalCard}>
                        <Text style={modalStyles.modalTitulo}>Aviso de Privacidade</Text>
                        <Text style={modalStyles.modaltext}>
                            Ao realizar o login no aplicativo, você concorda que sua orientadora terá acesso às informações que você compartilhar dentro da plataforma.
                        </Text>
                        <View style={modalStyles.avisoCaixa}>
                            <Ionicons name="information-circle-outline" size={20} color="#6EBAD4" style={modalStyles.avisoIcone} />
                            <Text style={modalStyles.avisoTexto}>Seus dados serão compartilhados apenas com a orientadora.</Text>
                        </View>
                        <Text style={modalStyles.modaltextoBotao}>Você concorda com os termos?</Text>
                        <View style={modalStyles.botaoContainer}>
                            <TouchableOpacity style={[modalStyles.modalBotao, modalStyles.cancelarBotao]} onPress={handleCancelarConsentimento}>
                                <Text style={modalStyles.cancelarbotaoTexto}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[modalStyles.modalBotao, modalStyles.confirmarBotao]} onPress={handleAceitarConsentimento}>
                                <Text style={modalStyles.confirmarBotaoTexto}>Aceitar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function TelaRecuperarSenhaEmail({ navigation, route }) {
    return (
        <View style={estilosRecuperar.container}>
            <View style={estilosRecuperar.topoSenha}>
                <Image source={require('./assets/fundologin.png')} style={estilos.topo} />
            </View>
            <Text style={estilosRecuperar.label}>Digite seu email</Text>
            <TextInput style={estilosRecuperar.input} keyboardType="email-address" />
            <TouchableOpacity
                style={estilosRecuperar.botao}
                onPress={() => navigation.navigate('NovaSenha', { tipoUsuario: route.params?.tipoUsuario })}>
                <Text style={estilosRecuperar.textoBotao}>Enviar</Text>
            </TouchableOpacity>
            <View style={estilosRecuperar.rodapeSenha}>
                <Image source={require('./assets/rodapefundo.png')} />
            </View>
        </View>
    );
}

function TelaNovaSenha({ navigation, route }) {
    const handleSave = () => {
        const tipoUsuario = route.params?.tipoUsuario;
        const telaDestino = tipoUsuario === 'orientadora' ? 'AppOrientadora' : 'AppPrincipal';
        navigation.replace(telaDestino);
    };
    return (
        <View style={estilosRecuperar.container}>
            <View style={estilosRecuperar.topoNovaSenha}>
                <Image source={require('./assets/fundologin.png')} />
            </View>
            <Text style={estilosRecuperar.label1}>Nova Senha:</Text>
            <TextInput style={estilosRecuperar.input} secureTextEntry />
            <Text style={estilosRecuperar.label2}>Confirmar Senha:</Text>
            <TextInput style={estilosRecuperar.input} secureTextEntry />
            <TouchableOpacity style={estilosRecuperar.botao2} onPress={handleSave}>
                <Text style={estilosRecuperar.textoBotao}>Salvar</Text>
            </TouchableOpacity>
            <View>
                <Image source={require('./assets/rodapefundo.png')} style={estilosRecuperar.rodapefundo2} />
            </View>
        </View>
    );
}

// --- VERIFICAÇÃO DE SEGURANÇA AUTOMÁTICA ---
// Roda sempre que o app abre ou o usuário muda
function AuthNavigator() {
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    
                    if (userData.tipo === 'orientadora') {
                        // 🚨 SEGURANÇA EXTRA:
                        // Se no banco diz que é orientadora, MAS o email não tem o domínio certo
                        // Desloga imediatamente.
                        if (!user.email.includes(DOMINIO_ORIENTADORA)) {
                            Alert.alert("Acesso Revogado", "Seu email não corresponde ao domínio de orientadores.");
                            await signOut(auth);
                            navigation.replace('TelaInicial');
                            return;
                        }
                        navigation.replace('AppOrientadora');
                    } else {
                        // É aluno (ou outro tipo)
                        navigation.replace('AppPrincipal');
                    }
                } else {
                    // Usuário autenticado mas sem documento no banco (Erro raro ou cadastro incompleto)
                    // Se tiver o domínio de orientador, deixa passar para criar o perfil depois?
                    // Ou manda para tela inicial? Vamos mandar para tela inicial por segurança.
                    await signOut(auth);
                    navigation.replace('TelaInicial');
                }
            } else {
                navigation.replace('TelaInicial');
            }
        });

        return unsubscribe;
    }, [navigation]);

    return <InicioScreen />;
}

export default function App() {
    let [fontsLoaded] = useFonts({
        InstrumentSansSemiBold: InstrumentSans_600SemiBold,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen name="Splash" component={AuthNavigator} options={{ headerShown: false }} />
                    <Stack.Screen name="TelaInicial" component={TelaInicial} options={{ headerShown: false }} />
                    <Stack.Screen name="Login" component={TelaLogin} options={{ headerShown: false }} />
                    <Stack.Screen name="RecuperarSenhaEmail" component={TelaRecuperarSenhaEmail} options={{ headerShown: false }} />
                    <Stack.Screen name="NovaSenha" component={TelaNovaSenha} options={{ headerShown: false }} />
                    
                    <Stack.Screen name="AppPrincipal" component={AppPrincipalDrawer} options={{ headerShown: false }} />
                    <Stack.Screen name="AppOrientadora" component={AppOrientadoraDrawer} options={{ headerShown: false }} />
                    
                    <Stack.Screen name="Configuracao" component={Configuracao} options={{ headerShown: false }} />
                    <Stack.Screen name="TelaCadastro" component={TelaCadastro} options={{ headerShown: false }} />
                    <Stack.Screen name="chat" component={chat} options={{ headerShown: false }} />
                    <Stack.Screen name="BemEstar" component={BemEstar} options={{ headerShown: false }} />
                    <Stack.Screen name="perfilAluno" component={PerfilAlunoScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="historico" component={historico} options={{ headerShown: false }} />
                    <Stack.Screen name="estadoEmocional" component={estadoEmocional} options={{ headerShown: false }} />
                    <Stack.Screen name="cuidarMente" component={cuidarMente} options={{ headerShown: false }} />
                    <Stack.Screen name="questionario" component={questionario} options={{ headerShown: false }} />
                </Stack.Navigator>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
}

// Estilos
const estilos = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    titulo: {
        fontSize: 22,
        color: '#6EBAD4',
        marginBottom: 20,
        fontFamily: 'InstrumentSansSemiBold',
    },
    subtitulo: {
        fontSize: 16,
        color: '#6EBAD4',
        marginBottom: 20,
        fontFamily: 'InstrumentSansSemiBold',
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 30,
    },
    botaoPrimario: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 60,
        borderRadius: 25,
        marginBottom: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    textoBotaoPrimario: {
        fontSize: 16,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#000',
    },
    botaoSecundario: {
        borderWidth: 1,
        borderColor: '#000',
        paddingVertical: 12,
        paddingHorizontal: 60,
        borderRadius: 25,
        marginBottom: 10,
    },
    textoBotaoSecundario: {
        fontSize: 16,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#000',
    },
    topo: { },
});

const estilosLogin = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9EA',
    },
    card: {},
    titulo: {
        fontSize: 24,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#414562',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 100,
    },
    subtitulo: {
        fontSize: 14,
        color: '#6EBAD4',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#FFF9EA',
        borderRadius: 10,
        padding: 15, 
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#ccc',
        marginHorizontal: 60, 
    },
    link: {
        color: '#6EBAD4',
        textAlign: 'right',
        marginBottom: 25,
        fontSize: 12,
        marginRight: 60,
        marginTop: -12,
    },
    botaoEntrar: {
        backgroundColor: '#6EBAD4',
        borderRadius: 25,
        paddingVertical: 14,
        marginHorizontal: 70, 
        alignItems: 'center',
        marginTop: 10,
    },
    textoBotao: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'InstrumentSansSemiBold',
    },
    conta: {
        textAlign: 'center',
        fontSize: 14,
        color: '#000',
        marginTop: 20,
    },
    linkNegrito: {
        color: '#6EBAD4',
        fontWeight: 'bold',
        textAlign: 'center',
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
        backgroundColor: '#E1F5FE', 
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
        color: '#161C4E', 
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
    },
    confirmarBotao: {
        backgroundColor: '#6EBAD4', 
        borderColor: '#6EBAD4',
    },
    confirmarBotaoTexto: {
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

const estilosRecuperar = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9EA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topoSenha: {
        marginTop: 0,
        marginBottom: 100,
    },
    topoNovaSenha: {
        marginTop: -250,
    },
    input: {
        width: '70%',
        backgroundColor: '#FFF9EA',
        borderRadius: 8,
        padding: 12,
        borderColor: '#ccc',
        borderWidth: 2,
    },
    label: {
        alignSelf: 'flex-start',
        marginLeft: '15%',
        marginBottom: 5,
        fontSize: 14,
        color: '#888',
        margin: 5,
        marginTop: 100,
    },
    label1: {
        alignSelf: 'flex-start',
        alignItems: 'center',
        marginLeft: '15%',
        marginBottom: 5,
        fontSize: 14,
        color: '#888',
        margin: 5,
        marginTop: 150,
    },
    label2: {
        alignSelf: 'flex-start',
        marginLeft: '15%',
        marginBottom: 5,
        fontSize: 14,
        color: '#888',
        margin: 5,
        marginTop: 10,
    },
    botao: {
        backgroundColor: '#6EBAD4',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 3,
        marginTop: 10,
        marginBottom:150,
    },
    botao2: {
        backgroundColor: '#6EBAD4',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 3,
        marginTop: 10,
        marginBottom:120,
    },
    textoBotao: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rodapeSenha: {
        marginBottom: 0,
    },
    rodapefundo2: {
        marginBottom: -260,
    }
});