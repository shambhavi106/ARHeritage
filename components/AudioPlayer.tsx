import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  audioAsset: any;
  transcript: string;
  siteName: string;
};

export default function AudioPlayer({ audioAsset, transcript, siteName }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);

  useEffect(() => {
    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playAudio = async () => {
    try {
      setIsLoading(true);
      
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          audioAsset,
          { shouldPlay: true }
        );
        setSound(newSound);
        
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setPosition(status.positionMillis || 0);
            
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        });
        
        setIsPlaying(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Audio Error', 'Failed to play audio file');
      setIsLoading(false);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setPosition(0);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎧 Audio Guide: {siteName}</Text>
      
      {/* Progress Bar */}
      {duration > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${(position / duration) * 100}%` }]} 
            />
          </View>
          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>
      )}
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.playButton]} 
          onPress={playAudio}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Loading...' : isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.stopButton]} 
          onPress={stopAudio}
          disabled={!sound}
        >
          <Text style={styles.buttonText}>⏹️ Stop</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.transcriptButton]} 
          onPress={() => setShowTranscript(!showTranscript)}
        >
          <Text style={styles.buttonText}>
            {showTranscript ? '📝 Hide Text' : '📝 Show Text'}
          </Text>
        </TouchableOpacity>
      </View>

      {showTranscript && (
        <ScrollView style={styles.transcriptContainer}>
          <Text style={styles.transcriptTitle}>Audio Transcript:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    marginBottom: 5,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 80,
  },
  playButton: {
    backgroundColor: '#27ae60',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  transcriptButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  transcriptContainer: {
    maxHeight: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  transcriptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 13,
    color: '#34495e',
    lineHeight: 18,
  },
});
