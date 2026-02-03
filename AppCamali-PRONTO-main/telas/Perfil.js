import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

// Importando os serviços configurados
import { auth, db, storage } from '../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile, updatePassword } from "firebase/auth";

const CAMALI_AVATAR_DEFAULT = require('../assets/camaliperfil.png');

// Função auxiliar para upload no Android
const getBlobFromUri = async (uri) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.log(e);
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

const EditableProfileField = ({ label, value, onChangeText, isEditable, secureTextEntry, rightIcon, onIconPress, keyboardType, isReadOnly, placeholder }) => (
  <View style={styles.campoContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput
        style={[styles.textInput, isReadOnly && styles.textInputReadOnly]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        editable={isEditable && !isReadOnly}
        keyboardType={keyboardType || 'default'}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
      />
      {rightIcon && (
        <TouchableOpacity onPress={onIconPress} style={styles.iconButton}>
          <Feather name={rightIcon} size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const PerfilScreen = () => {
  const navigation = useNavigation();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  
  const [novaSenha, setNovaSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [avatarUri, setAvatarUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setNome(userData.nome || user.displayName || '');
            setEmail(userData.email || user.email || '');
            setAvatarUri(userData.avatarUrl || null);
          } else {
            // Fallback: Dados do Auth se não tiver no Firestore
            setNome(user.displayName || '');
            setEmail(user.email || '');
            setAvatarUri(user.photoURL || null);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSaveChanges = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Atualizar Nome (Auth e Firestore)
      if (nome !== user.displayName) {
        await updateProfile(user, { displayName: nome });
        
        const userDocRef = doc(db, "users", user.uid);
        // setDoc com merge garante a criação/atualização segura
        await setDoc(userDocRef, { nome: nome }, { merge: true });
      }

      // 2. Atualizar Senha (se digitada)
      if (novaSenha.trim().length > 0) {
        if (novaSenha.trim().length < 6) {
          Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres.");
          return;
        }
        await updatePassword(user, novaSenha);
        Alert.alert("Sucesso", "Dados e senha atualizados! Use a nova senha no próximo login.");
        setNovaSenha(''); 
      } else {
        Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      }

    } catch (error) {
      console.error("Erro ao atualizar:", error);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert("Segurança", "Para mudar a senha, faça logout e entre novamente.");
      } else {
        Alert.alert("Erro", "Não foi possível atualizar: " + error.message);
      }
    }
  };

  const handleChangeAvatar = async () => {
    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (galleryPermission.status !== 'granted') {
      Alert.alert("Permissão necessária", "Precisamos de acesso à galeria.");
      return;
    }

    Alert.alert(
      'Alterar Foto',
      'Escolha a origem:',
      [
        {
          text: 'Galeria',
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5, 
            });
            if (!result.canceled) uploadImage(result.assets[0].uri);
          },
        },
        {
          text: 'Câmera',
          onPress: async () => {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
             if (cameraPermission.status !== 'granted') {
                Alert.alert("Erro", "Permissão da câmera negada.");
                return;
             }
            let result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) uploadImage(result.assets[0].uri);
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const uploadImage = async (uri) => {
    if (!uri) return;
    setUploadingImage(true);
    let blob = null;
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuário não logado");

      // Verifica se storage foi carregado corretamente do config
      if (!storage) {
          throw new Error("Erro de Configuração: 'storage' não encontrado. Verifique firebaseConfig.js");
      }

      blob = await getBlobFromUri(uri);

      const filename = `avatars/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      
      await updateProfile(user, { photoURL: downloadURL });
      
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { avatarUrl: downloadURL }, { merge: true });

      setAvatarUri(downloadURL);
      Alert.alert("Sucesso", "Foto atualizada!");
      
    } catch (error) {
      console.error("Erro Upload:", error);
      
      if (error.message.includes('storage')) {
          Alert.alert("Erro Config", error.message);
      } else if (error.code === 'storage/unknown') {
          Alert.alert("Erro Storage", "Verifique o nome do 'storageBucket' no firebaseConfig.js.");
      } else {
          Alert.alert("Erro", "Falha ao enviar imagem.");
      }
    } finally {
      if (blob) blob.close(); 
      setUploadingImage(false);
    }
  };

  const handleBack = () => navigation.goBack();
  const handleTogglePasswordVisibility = () => setShowPassword(prev => !prev);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6EBAD4" />
          <Text>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Image source={require('../assets/fundologin.png')} style={styles.imgFundo} />

      <TouchableOpacity onPress={handleBack} style={styles.voltarbotao}>
        <MaterialCommunityIcons name="chevron-left" size={24} color="#000" />
        <Text style={styles.voltarbotaotexto}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.avatarContainer}>
        {uploadingImage ? (
          <View style={[styles.avatarimagem, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}>
            <ActivityIndicator size="large" color="#6EBAD4" />
          </View>
        ) : (
          <Image
            source={avatarUri ? { uri: avatarUri } : CAMALI_AVATAR_DEFAULT}
            style={styles.avatarimagem}
          />
        )}
        <TouchableOpacity onPress={handleChangeAvatar} style={styles.camerabotao} disabled={uploadingImage}>
          <MaterialCommunityIcons name="camera" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.informacoesContainer}>
          <EditableProfileField
            label="Nome completo"
            value={nome}
            onChangeText={setNome}
            isEditable={true}
            rightIcon="edit"
            onIconPress={() => {}}
          />

          <EditableProfileField
            label="Email"
            value={email}
            isEditable={false}
            isReadOnly={true}
          />

          <EditableProfileField
            label="Alterar Senha"
            value={novaSenha}
            onChangeText={setNovaSenha}
            isEditable={true}
            secureTextEntry={!showPassword}
            placeholder="Digite a nova senha"
            onIconPress={handleTogglePasswordVisibility}
            rightIcon={showPassword ? 'eye-off' : 'eye'}
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Estilização
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF9EA',
  },
  container: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 40,
    marginLeft: 20,
    marginRight: 20,
    paddingTop: 180,
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
  voltarbotao: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 60,
    left: 20,
    zIndex: 100,
    padding: 5,
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    position: 'absolute',
    top: 85,
    alignSelf: 'center',
    zIndex: 10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voltarbotaotexto: {
    fontSize: 16,
    marginLeft: 5,
    color: '#000',
  },
  avatarimagem: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#8E8E8E',
  },
  camerabotao: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  informacoesContainer: {
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 80,
  },
  campoContainer: {
    marginBottom: 15,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
    paddingTop: 10,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  textInputReadOnly: {
    color: '#999',
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#6EBAD4',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PerfilScreen;