import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// IMPORTS DO FIREBASE
import { db, auth } from '../config/firebaseConfig';
import { collection, query, onSnapshot, where, doc, getDoc } from 'firebase/firestore';

const CAMALI_PERFIL_PADRAO = require('../assets/camaliperfil.png');

// Componente de Item da Lista 
const AlunoItem = ({ aluno, onPress }) => {
  const imageSource = aluno.avatarUrl ? { uri: aluno.avatarUrl } : CAMALI_PERFIL_PADRAO;

  return (
    <TouchableOpacity style={styles.alunoCard} onPress={() => onPress(aluno)}>
      <View style={styles.alunoInfo}>
        
        {/* Foto de Perfil */}
        <View style={styles.caixaPerfil}>
            {aluno.avatarUrl ? (
                <Image source={imageSource} style={styles.imagemPerfil} />
            ) : (
                <Text style={styles.textoPerfil}>{aluno.nome ? aluno.nome[0].toUpperCase() : '?'}</Text>
            )}
        </View>

        <View style={styles.textoCaixa}>
          {/* 1. NOME */}
          <Text style={styles.alunoNome}>
            {aluno.nome || 'Nome não informado'}
          </Text>
          
          {/* 2. EMAIL (Adicionado conforme pedido) */}
          <Text style={styles.alunoEmail}>
             {aluno.email || 'Email não informado'}
          </Text>
          
          {/* 3. ANOTAÇÕES (Vindas do perfilAluno.js) */}
          <Text style={styles.alunoAnotacoes} numberOfLines={2}>
             {aluno.anotacoes ? `Notas: ${aluno.anotacoes}` : 'Sem anotações...'}
          </Text>
        </View>
      </View>

      <View style={styles.setaContainer}>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );
};

export default function TelaOrientadora({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [alunos, setAlunos] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const diagnostico = async () => {
      const user = auth.currentUser;
      
      if (!user) {
          setLoading(false);
          return;
      }

      // Query para buscar apenas alunos
      const q = query(collection(db, "users"), where("tipo", "==", "aluno"));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const lista = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            lista.push({
                id: doc.id,
                nome: data.nome || data.displayName || 'Sem Nome',
                email: data.email,
                avatarUrl: data.avatarUrl || null,
                // Pega as anotações salvas no banco
                anotacoes: data.anotacoes || '', 
                
                curso: data.curso || '', 
                status: data.nivelAnsiedade || 'baixo', 
            });
        });
        setAlunos(lista); 
        setLoading(false);
      }, (error) => {
         console.error("Erro na lista de alunos:", error);
         setLoading(false);
      });

      return () => unsubscribe();
    };

    diagnostico();
  }, []);
  
  const handleAlunoPress = (aluno) => {
    navigation.navigate('perfilAluno', { aluno: aluno });
  };
  
  const filteredData = alunos.filter(aluno =>
    (aluno.nome && aluno.nome.toLowerCase().includes(searchText.toLowerCase())) ||
    (aluno.email && aluno.email.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <LinearGradient
      colors={['#B3E5FC', '#E1F5FE']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={30} color="#444" />
          </TouchableOpacity>
          
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar aluno..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          </View>
        </View>

        <Text style={styles.mainTitle}>Alunos Cadastrados</Text>

        {loading ? (
            <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#444" />
                <Text style={{marginTop: 10, color: '#555'}}>Carregando alunos...</Text>
            </View>
        ) : (
            <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <AlunoItem aluno={item} onPress={handleAlunoPress} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
                </View>
            }
            />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    width: '75%', 
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingRight: 5,
  },
  searchIcon: {
    marginLeft: 5,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alunoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
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
  alunoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  caixaPerfil: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden', 
  },
  imagemPerfil: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textoPerfil: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  textoCaixa: {
    flex: 1,
    justifyContent: 'center',
  },
  alunoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  // Novo estilo para o Email
  alunoEmail: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  // Estilo atualizado para anotações
  alunoAnotacoes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  setaContainer: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 30,
  },
  emptyText: {
    textAlign: 'center',
    color: '#444',
    fontSize: 18,
    fontWeight: 'bold',
  }
});