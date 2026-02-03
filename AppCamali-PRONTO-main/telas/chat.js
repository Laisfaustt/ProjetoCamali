import React, { useState, useRef, useEffect } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    Image, 
    FlatList, 
    Platform, 
    KeyboardAvoidingView,
    SafeAreaView,
    StatusBar,
    TextInput,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// --- IMPORTS DO FIREBASE ---
import { auth, db } from '../config/firebaseConfig';
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from 'firebase/firestore';

const CAMALI_LOGO = require('../assets/camaliperfil.png'); 

const MessageBubble = ({ message, isLast }) => {
    // Verifica se a mensagem é minha
    const isSent = message.senderId === auth.currentUser?.uid;
    
    const bubbleStyle = isSent ? styles.sentBubble : styles.receivedBubble;
    const textStyle = isSent ? styles.sentText : styles.receivedText;
    const containerStyle = isSent ? styles.sentContainer : styles.receivedContainer;

    // Formata hora
    let timeString = '';
    if (message.createdAt) {
        // Se for timestamp do firebase, converte. Se for data normal, usa direto.
        const date = message.createdAt.toDate ? message.createdAt.toDate() : new Date();
        timeString = date.toLocaleTimeString('pt-BR', { hour: '2-digit' , minute: '2-digit'  });
    }

    return (
        <View style={[containerStyle, { marginBottom: isLast ? 15 : 5 }]}>
            {!isSent && (
                <Image source={CAMALI_LOGO} style={styles.avatar} />
            )}
            
            <View style={styles.bubbleContent}>
                <View style={bubbleStyle}>
                    <Text style={textStyle}>{message.text}</Text>
                </View>
                <Text style={styles.timeText}>{timeString}</Text>
            </View>
        </View>
    );
};

const ChatScreen = ({ route }) => {
    const navigation = useNavigation();
    const flatListRef = useRef(null);

    const [messages, setMessages] = useState([]); 
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);

    const user = auth.currentUser;

    // --- LÓGICA CRÍTICA DA SALA DE CHAT ---
    // 1. Se veio um 'alunoId' pela rota, significa que sou a ORIENTADORA visitando o aluno.
    // 2. Se NÃO veio, significa que sou o ALUNO entrando no meu próprio chat.
    const chatRoomId = route.params?.alunoId || user?.uid;
    
    // Título do Header
    const nomeExibicao = route.params?.nomeAluno || 'Orientadora';

    useEffect(() => {
        if (!user) {
            Alert.alert("Erro", "Você precisa estar logado.");
            navigation.goBack();
            return;
        }

        if (!chatRoomId) {
            console.error("ERRO: ID da sala é nulo.");
            setLoading(false);
            return;
        }

        console.log("Entrando na sala de chat:", chatRoomId);

        // Referência: chats/{ID_DO_ALUNO}/messages
        const messagesRef = collection(db, "chats", chatRoomId, "messages");
        // Ordena por data de criação
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = [];
            querySnapshot.forEach((doc) => {
                msgs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            setMessages(msgs);
            setLoading(false);
            
            // Rola para o final
            setTimeout(() => {
                if(msgs.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }
            }, 500);
        }, (error) => {
            console.error("Erro ao ler mensagens:", error);
            Alert.alert("Erro", "Não foi possível carregar as mensagens.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatRoomId]);

    const handleSendMessage = async () => {
        if (inputText.trim() === '' || !chatRoomId) return;

        const textToSend = inputText.trim();
        setInputText(''); 

        try {
            const messagesRef = collection(db, "chats", chatRoomId, "messages");
            await addDoc(messagesRef, {
                text: textToSend,
                senderId: user.uid,
                senderEmail: user.email,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Erro ao enviar:", error);
            Alert.alert("Erro", "Mensagem não enviada.");
            setInputText(textToSend); // Devolve o texto
        }
    };

    const isTexting = inputText.trim().length > 0;

    return (
        <SafeAreaView style={styles.fullScreenContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#6EBAD4" /> 

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={30} color="#FFF" />
                </TouchableOpacity>

                <Image source={CAMALI_LOGO} style={styles.headerAvatar} />
                <Text style={styles.headerTitle}>{nomeExibicao}</Text>
            </View>

            <View style={styles.chatBody}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {loading ? (
                        <ActivityIndicator size="large" color="#6EBAD4" style={{marginTop: 50}} />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={item => item.id}
                            renderItem={({ item, index }) => (
                                <MessageBubble 
                                    message={item} 
                                    isLast={index === messages.length - 1}
                                />
                            )}
                            contentContainerStyle={styles.flatListContent}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyChatContainer}>
                                    <Text style={styles.systemText}>Nenhuma mensagem </Text>
                                </View>
                            )}
                        />
                    )}

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Digite uma mensagem..."
                                placeholderTextColor="#A0A0A0"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.sendButton, { backgroundColor: isTexting ? '#6EBAD4' : '#ccc' }]} 
                            onPress={handleSendMessage}
                            disabled={!isTexting}
                        >
                            <MaterialCommunityIcons name="send" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#B0E5F7', 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
        paddingHorizontal: 15,
    },
    backButton: {
        paddingRight: 10,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#fff'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFF9EB', 
        flex: 1,
    },
    chatBody: {
        flex: 1,
        backgroundColor: '#FFF9EA', 
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    flatListContent: {
        paddingHorizontal: 15,
        paddingTop: 20,
        paddingBottom: 10, 
    },
    emptyChatContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    systemText: {
        color: '#999',
        backgroundColor: '#EBEBEB',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
    },
    receivedContainer: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        maxWidth: '80%',
        marginBottom: 10,
    },
    sentContainer: {
        alignSelf: 'flex-end',
        maxWidth: '80%',
        marginBottom: 10,
        alignItems: 'flex-end',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
        marginTop: 5,
    },
    bubbleContent: {
        flexDirection: 'column',
    },
    receivedBubble: {
        backgroundColor: '#EBEBEB',
        padding: 10,
        borderRadius: 15,
        borderTopLeftRadius: 0,
    },
    sentBubble: {
        backgroundColor: '#6EBAD4', 
        padding: 10,
        borderRadius: 15,
        borderTopRightRadius: 0,
    },
    receivedText: {
        color: '#333',
        fontSize: 16,
    },
    sentText: {
        color: '#FFF',
        fontSize: 16,
    },
    timeText: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
        alignSelf: 'flex-end'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end', 
        padding: 10,
        backgroundColor: '#FFF', 
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        minHeight: 45,
        justifyContent: 'center'
    },
    textInput: {
        fontSize: 16,
        color: '#333',
        maxHeight: 100,
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
    },
});

export default ChatScreen;