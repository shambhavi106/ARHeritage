export type HeritageSite = {
  id: string;
  name: string;
  location: string;
  era: string;
  description: string;
  image: any;
  model: any; // Back to 'any' to use require()
  audio: any;
  audioTranscript: string;
  quiz: {
    question: string;
    options: string[];
    correct: number;
  }[];
};

export const heritageSites: HeritageSite[] = [
  {
    id: 'konark',
    name: 'Konark Sun Temple',
    location: 'Konark, Odisha',
    era: 'c.1250 CE',
    description: 'A 13th-century Sun Temple built by Narasimhadeva I—famous for its chariot-shaped layout and exquisite stone carvings.',
    image: require('../assets/images/konark.jpg'),
    model: require('../assets/models/konark.glb'), // Your real GLB file
    audio: require('../assets/audio/konark.mp3'),
    audioTranscript: "Welcome to the magnificent Konark Sun Temple, also known as the Black Pagoda. Built in the 13th century by King Narasimhadeva I, this architectural marvel is designed as a colossal chariot with 24 wheels, each about 10 feet in diameter. The temple is dedicated to the Sun God, Surya, and its walls are adorned with intricate carvings depicting dancers, musicians, and mythical creatures. The temple's alignment allows the first rays of the sun to strike the main entrance, symbolizing the chariot of the Sun God traveling across the heavens.",
    quiz: [
      { question: 'Which king built the Konark Sun Temple?', options: ['Narasimhadeva I', 'Ashoka', 'Raja Raja Chola'], correct: 0 },
      { question: 'The temple is designed as a colossal what?', options: ['Chariot', 'Lotus', 'Temple Tower'], correct: 0 },
      { question: 'Konark is famous for carvings of?', options: ['Dancers & animals', 'Metalwork', 'Calligraphy'], correct: 0 },
      { question: 'Which coast is Konark near?', options: ['Eastern coast', 'Western coast', 'Northern coast'], correct: 0 },
      { question: 'The temple is dedicated to which deity?', options: ['Sun God', 'Lord Vishnu', 'Lord Shiva'], correct: 0 }
    ]
  },
  {
    id: 'taj',
    name: 'Taj Mahal',
    location: 'Agra, Uttar Pradesh',
    era: '1631–1653',
    description: 'Ivory-white marble mausoleum commissioned by Mughal emperor Shah Jahan in memory of his wife Mumtaz Mahal.',
    image: require('../assets/images/taj.jpg'),
    model: require('../assets/models/taj.glb'), // Your real GLB file
    audio: require('../assets/audio/taj.mp3'),
    audioTranscript: "Behold the Taj Mahal, one of the world's most beautiful monuments and a UNESCO World Heritage Site. Emperor Shah Jahan commissioned this ivory-white marble mausoleum between 1631 and 1653 in memory of his beloved wife Mumtaz Mahal. The Taj Mahal combines elements from Islamic, Persian, Ottoman Turkish and Indian architectural styles. Its central dome is surrounded by four smaller domes, and the entire complex is set in formal gardens divided by a long reflecting pool. The monument changes color throughout the day, appearing pinkish in the morning, white during the day, and golden in the moonlight.",
    quiz: [
      { question: 'Who built the Taj Mahal?', options: ['Shah Jahan', 'Akbar', 'Aurangzeb'], correct: 0 },
      { question: 'Which material is primarily used?', options: ['White marble', 'Red sandstone', 'Granite'], correct: 0 },
      { question: 'For whom was it built?', options: ['Mumtaz Mahal', 'Jodha Bai', 'Nur Jahan'], correct: 0 },
      { question: 'In which city is it located?', options: ['Agra', 'Delhi', 'Jaipur'], correct: 0 },
      { question: 'What type of building is it?', options: ['Mausoleum', 'Palace', 'Fort'], correct: 0 }
    ]
  },
  {
    id: 'jagannath',
    name: 'Jagannath Temple',
    location: 'Puri, Odisha',
    era: '12th Century',
    description: 'A major Hindu temple dedicated to Lord Jagannath—famous for the annual Rath Yatra chariot festival.',
    image: require('../assets/images/jagannath.jpg'),
    model: require('../assets/models/jagannath.glb'), // Your real GLB file
    audio: require('../assets/audio/jagannath.mp3'),
    audioTranscript: "Welcome to the sacred Jagannath Temple in Puri, one of the four Char Dham pilgrimage sites for Hindus. This 12th-century temple is dedicated to Lord Jagannath, considered a form of Lord Vishnu. The temple is famous worldwide for its annual Rath Yatra festival, where the deities are taken out in massive wooden chariots pulled by thousands of devotees. The temple's architecture features a 214-foot tall main spire and is built in the traditional Kalinga architectural style. Only Hindus are allowed inside the temple, and the kitchen here is said to be one of the largest in the world, feeding thousands of devotees daily.",
    quiz: [
      { question: 'The Jagannath Temple festival is called?', options: ['Rath Yatra', 'Diwali', 'Holi'], correct: 0 },
      { question: 'The temple is located in which city?', options: ['Puri', 'Bhubaneswar', 'Cuttack'], correct: 0 },
      { question: 'Which deity is worshipped here?', options: ['Lord Jagannath', 'Lord Shiva', 'Lord Brahma'], correct: 0 },
      { question: 'What does Rath Yatra involve?', options: ['Chariot procession', 'Fire ceremony', 'Water ritual'], correct: 0 },
      { question: 'In which state is this temple?', options: ['Odisha', 'West Bengal', 'Jharkhand'], correct: 0 }
    ]
  }
];
