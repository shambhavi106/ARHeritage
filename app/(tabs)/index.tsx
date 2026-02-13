import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ARViewer from '../../components/ARViewer';
import AudioPlayer from '../../components/AudioPlayer';
import { HeritageSite, heritageSites } from '../../constants/sites';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const [selectedSite, setSelectedSite] = useState<HeritageSite | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'list' | 'details' | 'quiz' | 'ar'>('list');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
  };

  const renderSiteItem = ({ item, index }: { item: HeritageSite; index: number }) => (
    <TouchableOpacity 
      style={[styles.siteCard, { marginLeft: index % 2 === 0 ? 0 : 10 }]}
      onPress={() => {
        setSelectedSite(item);
        setCurrentScreen('details');
        resetQuiz();
      }}
    >
      <View style={styles.cardContainer}>
        <Image source={item.image} style={styles.siteImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.cardOverlay}
        >
          <View style={styles.siteInfo}>
            <Text style={styles.siteName}>{item.name}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#FF6B6B" />
              <Text style={styles.siteLocation}>{item.location}</Text>
            </View>
            <Text style={styles.siteEra}>{item.era}</Text>
          </View>
          <View style={styles.cardActions}>
            <View style={styles.arBadge}>
              <Ionicons name="cube-outline" size={16} color="#4CAF50" />
              <Text style={styles.arLabel}>AR Ready</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.cardBorder} />
      </View>
    </TouchableOpacity>
  );

  const handleAnswer = (selectedOption: number) => {
    if (!selectedSite) return;
    const correct = selectedSite.quiz[currentQuestion].correct;
    if (selectedOption === correct) {
      setScore(score + 1);
      Alert.alert('Correct! ✅', 'Well done!');
    } else {
      Alert.alert('Wrong! ❌', `Correct answer: ${selectedSite.quiz[currentQuestion].options[correct]}`);
    }
    if (currentQuestion + 1 < selectedSite.quiz.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  // Site Details Screen - Beautiful Heritage Style
  if (currentScreen === 'details' && selectedSite) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8B4513" />
        
        {/* Heritage-style header with ornamental design */}
        <LinearGradient colors={['#8B4513', '#D2691E', '#CD853F']} style={styles.heritageHeader}>
          <View style={styles.ornamentalBorder}>
            <View style={styles.detailsHeaderContent}>
              <TouchableOpacity 
                style={styles.heritageBackButton}
                onPress={() => setCurrentScreen('list')}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.heritageTitle}>{selectedSite.name}</Text>
                <View style={styles.ornamentalLine} />
              </View>
              <View style={styles.placeholder} />
            </View>
          </View>
        </LinearGradient>

        {/* Hero Image with Heritage Frame */}
        <View style={styles.heroImageContainer}>
          <View style={styles.imageFrame}>
            <Image source={selectedSite.image} style={styles.heritageImage} />
            <View style={styles.imageOverlay}>
              <LinearGradient
                colors={['transparent', 'rgba(139,69,19,0.3)']}
                style={styles.imageGradient}
              />
            </View>
          </View>
        </View>
        
        {/* Content with Heritage Styling */}
        <ScrollView style={styles.heritageContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            
            {/* Ornamental Divider */}
            <View style={styles.ornamentalDivider}>
              <View style={styles.diamondShape} />
              <View style={styles.ornamentalLineHorizontal} />
              <View style={styles.diamondShape} />
            </View>
            
            {/* Description with Heritage Typography */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.heritageDescription}>{selectedSite.description}</Text>
            </View>
            
            {/* Audio Guide Section */}
            <View style={styles.audioSection}>
              <Text style={styles.sectionTitle}>🎧 Audio Guide</Text>
              <AudioPlayer 
                audioAsset={selectedSite.audio}
                transcript={selectedSite.audioTranscript}
                siteName={selectedSite.name}
              />
            </View>

            {/* Action Buttons with Heritage Design */}
            <View style={styles.heritageActionButtons}>
              <TouchableOpacity 
                style={styles.heritageButton}
                onPress={() => setCurrentScreen('ar')}
              >
                <LinearGradient colors={['#4CAF50', '#45A049']} style={styles.heritageButtonGradient}>
                  <View style={styles.buttonContent}>
                    <Ionicons name="cube-outline" size={24} color="white" />
                    <Text style={styles.heritageButtonText}>AR Experience</Text>
                    <Text style={styles.heritageButtonSubtext}>Immersive 3D View</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.heritageButton}
                onPress={() => {
                  resetQuiz();
                  setCurrentScreen('quiz');
                }}
              >
                <LinearGradient colors={['#FF6B6B', '#E55353']} style={styles.heritageButtonGradient}>
                  <View style={styles.buttonContent}>
                    <Ionicons name="help-circle-outline" size={24} color="white" />
                    <Text style={styles.heritageButtonText}>Take Quiz</Text>
                    <Text style={styles.heritageButtonSubtext}>Test Your Knowledge</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Heritage Facts */}
            <View style={styles.factsSection}>
              <Text style={styles.sectionTitle}>✨ Heritage Facts</Text>
              <View style={styles.factItem}>
                <Ionicons name="calendar-outline" size={20} color="#8B4513" />
                <Text style={styles.factText}>Era: {selectedSite.era}</Text>
              </View>
              <View style={styles.factItem}>
                <Ionicons name="location-outline" size={20} color="#8B4513" />
                <Text style={styles.factText}>Location: {selectedSite.location}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // AR Screen
  if (currentScreen === 'ar' && selectedSite) {
    return (
      <ARViewer
        modelAsset={selectedSite.model}
        siteName={selectedSite.name}
        onBack={() => setCurrentScreen('details')}
      />
    );
  }

  // Quiz Screen (Enhanced)
  if (currentScreen === 'quiz' && selectedSite) {
    if (showResult) {
      const percentage = Math.round((score / selectedSite.quiz.length) * 100);
      return (
        <SafeAreaView style={styles.container}>
          <LinearGradient colors={['#9B59B6', '#8E44AD', '#663399']} style={styles.quizContainer}>
            <Text style={styles.quizComplete}>🏆 Quiz Complete!</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{score}/{selectedSite.quiz.length}</Text>
              <Text style={styles.percentageText}>{percentage}%</Text>
              <Text style={styles.resultMessage}>
                {percentage >= 80 ? '🌟 Excellent Knowledge!' : 
                 percentage >= 60 ? '👍 Good Understanding!' : 
                 '📚 Keep Learning!'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.backToDetailsButton}
              onPress={() => setCurrentScreen('details')}
            >
              <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']} style={styles.resultButtonGradient}>
                <Text style={styles.backButtonText}>← Back to Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </SafeAreaView>
      );
    }

    const question = selectedSite.quiz[currentQuestion];
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#3498DB', '#2980B9', '#1F618D']} style={styles.quizContainer}>
          <Text style={styles.quizTitle}>Heritage Quiz: {selectedSite.name}</Text>
          <Text style={styles.questionCounter}>
            Question {currentQuestion + 1} of {selectedSite.quiz.length}
          </Text>
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>
          
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAnswer(index)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.quizBackButton}
            onPress={() => setCurrentScreen('details')}
          >
            <Text style={styles.backButtonText}>← Back to Details</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Main List Screen (Enhanced)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <LinearGradient colors={['#1A237E', '#3F51B5', '#5C6BC0']} style={styles.container}>
        
        {/* Enhanced Header with Heritage Elements */}
        <View style={styles.mainHeader}>
          <Text style={styles.mainHeaderTitle}>🏛️ Heritage AR Explorer</Text>
          <Text style={styles.mainHeaderSubtitle}>Discover India's Cultural Treasures</Text>
          <View style={styles.headerOrnament}>
            <View style={styles.ornamentDot} />
            <View style={styles.ornamentLine} />
            <View style={styles.ornamentDot} />
          </View>
        </View>

        <FlatList
          data={heritageSites}
          renderItem={renderSiteItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Enhanced Main Header
  mainHeader: { 
    alignItems: 'center', 
    paddingVertical: 35, 
    paddingHorizontal: 20 
  },
  mainHeaderTitle: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1
  },
  mainHeaderSubtitle: { 
    fontSize: 18, 
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15
  },
  headerOrnament: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  ornamentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700'
  },
  ornamentLine: {
    width: 60,
    height: 2,
    backgroundColor: '#FFD700'
  },

  // Enhanced List
  listContainer: { 
    padding: 20 
  },
  siteCard: { 
    flex: 0.48,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  cardContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  siteImage: { 
    width: '100%', 
    height: 160,
    resizeMode: 'cover'
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15
  },
  cardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 15,
    opacity: 0.3
  },
  siteInfo: {
    marginBottom: 10
  },
  siteName: { 
    fontSize: 17, 
    fontWeight: 'bold', 
    color: 'white',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  siteLocation: { 
    fontSize: 13, 
    color: '#FF6B6B',
    marginLeft: 5,
    fontWeight: '500'
  },
  siteEra: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic'
  },
  cardActions: {
    alignItems: 'flex-end'
  },
  arBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50'
  },
  arLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5
  },

  // Heritage Details Screen
  heritageHeader: {
    paddingVertical: 20
  },
  ornamentalBorder: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#FFD700',
    paddingVertical: 15
  },
  detailsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  heritageBackButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#FFD700'
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center'
  },
  heritageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1
  },
  ornamentalLine: {
    width: 80,
    height: 2,
    backgroundColor: '#FFD700',
    marginTop: 5
  },
  placeholder: { width: 40 },

  // Hero Image
  heroImageContainer: {
    paddingHorizontal: 20,
    marginTop: -10
  },
  imageFrame: {
    borderWidth: 4,
    borderColor: '#FFD700',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  heritageImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover'
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60
  },
  imageGradient: {
    flex: 1
  },

  // Heritage Content
  heritageContent: {
    flex: 1,
    backgroundColor: '#FFF8DC',
    marginTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30
  },
  contentContainer: {
    padding: 25
  },
  ornamentalDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 15
  },
  diamondShape: {
    width: 12,
    height: 12,
    backgroundColor: '#8B4513',
    transform: [{ rotate: '45deg' }]
  },
  ornamentalLineHorizontal: {
    flex: 1,
    height: 2,
    backgroundColor: '#8B4513'
  },
  descriptionContainer: {
    marginBottom: 25
  },
  heritageDescription: {
    fontSize: 16,
    lineHeight: 26,
    color: '#2F4F4F',
    textAlign: 'justify',
    fontWeight: '400',
    letterSpacing: 0.5
  },
  audioSection: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
    textAlign: 'center'
  },

  // Heritage Action Buttons
  heritageActionButtons: {
    gap: 20,
    marginVertical: 25
  },
  heritageButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  heritageButtonGradient: {
    padding: 20,
    alignItems: 'center'
  },
  buttonContent: {
    alignItems: 'center'
  },
  heritageButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4
  },
  heritageButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontStyle: 'italic'
  },

  // Facts Section
  factsSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(139,69,19,0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(139,69,19,0.2)'
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8
  },
  factText: {
    fontSize: 16,
    color: '#2F4F4F',
    marginLeft: 15,
    fontWeight: '500'
  },

  // Enhanced Quiz styles
  quizContainer: { 
    flex: 1, 
    padding: 25, 
    justifyContent: 'center' 
  },
  quizTitle: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: 'white', 
    textAlign: 'center', 
    marginBottom: 15,
    letterSpacing: 1
  },
  questionCounter: { 
    fontSize: 18, 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center', 
    marginBottom: 25,
    fontWeight: '500'
  },
  questionContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25
  },
  questionText: { 
    fontSize: 20, 
    color: 'white', 
    textAlign: 'center', 
    lineHeight: 30,
    fontWeight: '500'
  },
  optionButton: { 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    padding: 18, 
    marginBottom: 12, 
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  optionText: { 
    fontSize: 16, 
    color: '#333', 
    textAlign: 'center',
    fontWeight: '500'
  },
  quizBackButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  quizComplete: { 
    fontSize: 36, 
    color: 'white', 
    textAlign: 'center', 
    marginBottom: 30,
    letterSpacing: 1
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  scoreText: { 
    fontSize: 52, 
    color: '#4CAF50', 
    textAlign: 'center', 
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5
  },
  percentageText: { 
    fontSize: 28, 
    color: 'white', 
    textAlign: 'center', 
    marginTop: 10,
    fontWeight: 'bold'
  },
  resultMessage: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic'
  },
  backToDetailsButton: { 
    alignSelf: 'center',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  resultButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15
  },
  backButtonText: { 
    color: '#333', 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center'
  }
});
