import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  Image,
  Alert,            // Importado para exibir mensagens
  ActivityIndicator // Importado para mostrar carregamento
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- IMPORTS DO FIREBASE ---
import { auth, db } from '../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function TelaCadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  
  // Estado para controlar o carregamento
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    // 1. Validações Básicas
    if (nome === '' || email === '' || cpf === '' || senha === '' || confirmarSenha === '') {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 2. Criar usuário na Autenticação do Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 3. Salvar dados adicionais no Firestore
      // Usamos o user.uid para garantir que o ID do documento seja o mesmo da autenticação
      await setDoc(doc(db, "users", user.uid), {
        nome: nome,
        email: email,
        cpf: cpf,
        tipo: 'aluno', // IMPORTANTE: Define que este usuário é um aluno
        avatarUrl: null, // Começa sem foto
        createdAt: new Date().toISOString(), // Data de criação
        // Campos opcionais para o futuro:
        curso: 'Não informado',
        sintomasRecentes: 'Nenhum',
        nivelAnsiedade: 'baixo'
      });

      Alert.alert('Sucesso', 'Aluno cadastrado com sucesso!', [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() // Ou redirecionar para a Home
        }
      ]);

    } catch (error) {
      console.error("Erro no cadastro: ", error);
      
      // Tratamento de erros comuns do Firebase
      let mensagemErro = "Não foi possível cadastrar o aluno.";
      if (error.code === 'auth/email-already-in-use') {
        mensagemErro = "Este email já está em uso por outra conta.";
      } else if (error.code === 'auth/invalid-email') {
        mensagemErro = "O formato do email é inválido.";
      } else if (error.code === 'auth/weak-password') {
        mensagemErro = "A senha é muito fraca.";
      }
      
      Alert.alert('Erro', mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Image 
        source={require('../assets/fundologin.png')} 
        style={styles.imgFundo}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#000" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Cadastrar Aluno</Text>
          <Text style={styles.subtitle}>
            Cadastre o aluno de acordo com seu email educacional.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome"
              value={nome}
              onChangeText={setNome}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite o email"
              keyboardType="email-address"
              autoCapitalize="none" // Importante para emails
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite o CPF"
              keyboardType="numeric"
              value={cpf}
              onChangeText={setCpf}
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite a senha"
              secureTextEntry={!showSenha}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowSenha(!showSenha)}
            >
              <Ionicons
                name={showSenha ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              secureTextEntry={!showConfirmarSenha}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmarSenha(!showConfirmarSenha)}
            >
              <Ionicons
                name={showConfirmarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleCadastro}
            disabled={loading} // Desabilita botão durante carregamento
          >
            <View style={styles.buttonGradient}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Cadastrar</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF9EA',
  },
  imgFundo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250, 
    width: '100%',
    resizeMode: 'cover',
    zIndex: 1, 
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: 'absolute', 
    top: Platform.OS === 'android' ? 40 : 60, 
    left: 0,
    zIndex: 100, 
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
    color: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 200,
  },
  card: {
    padding: 30,
    marginTop: 10, 
    marginBottom: 40,
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#414562',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6EBAD4',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9EA',
    paddingHorizontal: 0,
    marginBottom: 15,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 15, 
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    width: '80%',
    marginTop: 30,
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    backgroundColor: '#6EBAD4', 
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});