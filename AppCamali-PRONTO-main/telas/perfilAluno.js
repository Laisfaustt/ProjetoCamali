import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    Image, 
    TouchableOpacity, 
    SafeAreaView, 
    ScrollView, 
    Platform,
    TextInput,
    Alert 
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useNavigation, useRoute } from '@react-navigation/native';

// IMPORTS DO FIREBASE
import { db } from '../config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const initialAlunoData = {
    id: '12345', 
    nome: 'Aluno Exemplo',
    avatarUrl: require('../assets/camaliperfil.png'),
    anotacoes: '',
};

const InfoField = ({ label, value, isEditable, onEditPress, isEditing, onChangeText }) => {
    const Icone = Feather; 
    const iconName = isEditing ? "save" : "edit-3";
    const iconColor = isEditing ? "#6EBAD4" : "#666";

    return (
        <View style={styles.infoFieldContainer}>
            <Text style={styles.infoLabel}>{label}</Text>
            <View style={styles.infoValueWrapper}>
                {isEditing && isEditable ? (
                    <TextInput
                        style={[styles.infoValue, styles.textInput]}
                        value={value}
                        onChangeText={onChangeText}
                        multiline={true}
                        autoFocus={true}
                        placeholder="Digite suas anotações aqui..."
                    />
                ) : (
                    <Text style={styles.infoValue}>{value || 'Nenhuma anotação salva.'}</Text>
                )}
                
                {isEditable && (
                    <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
                        <Icone name={iconName} size={24} color={iconColor} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const ReportCard = ({ onConsultPress }) => (
    <View style={styles.reportCard}>
        <Text style={styles.reportTitle}>Relatório do Aluno</Text>
        <Text style={styles.reportSubtitle}>
            Consulte as informações relativas aos resultados do questionário respondido pelo aluno.
        </Text>
        <TouchableOpacity style={styles.reportButton} onPress={onConsultPress}>
            <Text style={styles.reportButtonText}>Ver resultados</Text>
        </TouchableOpacity>
    </View>
);

const HistoryCard = ({ onConsultPress }) => (
    <View style={styles.reportCard}> 
        <Text style={styles.reportTitle}>Histórico do Aluno</Text>
        <Text style={styles.reportSubtitle}>
            Consulte o histórico emocional completo do aluno.
        </Text>
        <TouchableOpacity style={styles.reportButton} onPress={onConsultPress}>
            <Text style={styles.reportButtonText}>Ver histórico</Text>
        </TouchableOpacity>
    </View>
);

export default function PerfilAlunoScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    
    const aluno = route.params?.aluno || initialAlunoData;

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [anotacoes, setAnotacoes] = useState(aluno.anotacoes || '');

    const handleBack = () => navigation.goBack();
    
    const handleViewResults = () => {
        const url = 'https://docs.google.com/spreadsheets/d/1fgroHk2xFhtCZDi-Mh07ooRJPe1t4cAmKSixgCPiRUc/edit?usp=sharing';
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const handleViewHistory = () => {
        navigation.navigate('historico', { 
            userId: aluno.id, 
            nomeAluno: aluno.nome 
        });
    };

    // --- CORREÇÃO AQUI ---
    const handleStartChat = () => {
        navigation.navigate('chat', { 
            nomeAluno: aluno.nome,
            alunoId: aluno.id  // <--- OBRIGATÓRIO: Passar o ID para abrir a sala certa
        });
    };

    const handleEditNotes = async () => {
        if (isEditingNotes) {
            try {
                const alunoRef = doc(db, "users", aluno.id);
                await updateDoc(alunoRef, {
                    anotacoes: anotacoes
                });
                console.log("Anotações salvas com sucesso!");
                Alert.alert("Sucesso", "Anotação atualizada!");
            } catch (error) {
                console.error("Erro ao salvar anotações:", error);
                Alert.alert("Erro", "Não foi possível salvar a anotação.");
            }
        }
        setIsEditingNotes(!isEditingNotes);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color="#000" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={aluno.avatarUrl ? {uri: aluno.avatarUrl} : require('../assets/camaliperfil.png')}
                        style={styles.avatarImage}
                    />
                </View>

                <View style={styles.contentContainer}>
                    <InfoField
                        label="Nome completo"
                        value={aluno.nome}
                        isEditable={false}
                    />

                    <InfoField
                        label="Anotações da Orientadora"
                        value={anotacoes}
                        isEditable={true}
                        onEditPress={handleEditNotes}
                        isEditing={isEditingNotes}
                        onChangeText={setAnotacoes}
                    />
                    
                    <ReportCard onConsultPress={handleViewResults} />
                    
                    <HistoryCard onConsultPress={handleViewHistory} />
                </View>
            </ScrollView>
            
            <View style={styles.footer}>
                <TouchableOpacity style={styles.botaoChat} onPress={handleStartChat}>
                    <Text style={styles.botaoIniciarChat}>Iniciar Conversa</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#C8E6F0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 30,
    },
    backButtonText: {
        fontSize: 16,
        color: '#000',
    },
    scrollContent: {
        alignItems: 'center',
        paddingTop: 100,
        paddingBottom: 100,
    },
    avatarContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#fff',
        borderWidth: 5,
        borderColor: '#414562',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 75,
    },
    contentContainer: {
        width: '90%',
        alignItems: 'center',
    },
    infoFieldContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    infoValueWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', 
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    textInput: {
        minHeight: 60, 
        paddingVertical: 0,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 5,
        textAlignVertical: 'top', 
    },
    editButton: {
        padding: 5,
    },
    reportCard: {
        width: '100%',
        marginTop: 10, 
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    reportTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#414562',
        marginBottom: 5,
    },
    reportSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
    },
    reportButton: {
        backgroundColor: '#6EBAD4', 
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    reportButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#C8E6F0', 
    },
    botaoChat: {
        width: '90%',
        backgroundColor: '#6EBAD4',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    botaoIniciarChat: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});