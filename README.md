
# RhythmVision 🎶✨ 

**(Work In Progress, eraly stages)**

**RhythmVision** is an interactive music visualizer built with **Three.js**. It transforms audio data from your favorite music into dynamic, artistic visualizations that respond to rhythms, tones, and frequencies in real time. Perfect for DJs, music enthusiasts, and developers looking for a creative way to visualize music. 🎧🌈


![image](https://github.com/user-attachments/assets/10b7bfcf-e3ba-41e1-86c9-74120ddc8b14)


## Features 🚀

- **Real-Time Music Visualization** 🎥: Visualize your music with animated, interactive 3D elements.
- **Dynamic Frequency Visualization** 🎶: The visuals adapt to different frequency ranges of the music in real-time.
- **Interactive Controls** 🎮: Modify parameters and change the appearance of the visualization live.
- **Supports Multiple Audio Formats** 🎵: Compatible with MP3, WAV, and OGG audio files.
- **Responsive Design** 📱💻: Works on a variety of devices and screen sizes.
- **Audio File Upload** 📂: Upload audio files directly from your device to create visualizations.

## Installation 🛠️

### Prerequisites 📋

- **Node.js** (version 12.x or higher)
- **NPM** or **Yarn**

### Steps to Install 🚶‍♂️

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/RhythmVision.git
   ```

2. **Navigate into the project folder:**
   ```bash
   cd RhythmVision
   ```

3. **Install dependencies:**
   If you're using NPM:
   ```bash
   npm install
   ```

   Or with Yarn:
   ```bash
   yarn install
   ```

4. **Start the project locally:**
   ```bash
   npm start
   ```

   Or:
   ```bash
   yarn start
   ```

   Now you can open `http://localhost:3000` in your browser to see the visualization in action! 🚀

## Features Explained 💡

- **Audio Input** 🎧: The visualizer takes in an audio file via a file input element and visualizes the music in real-time.
- **Interactive UI** 🎮: The visualization's parameters can be adjusted dynamically using **dat.GUI**.
  - **Audio Reaction** 🧠: The background reacts based on audio input, creating a fluid, responsive experience.
  - **Regular and Quantized Points** 📊: Adjust the size and appearance of visual elements in the 3D space.
  - **Shadow Blur** 🌑: Customize the shadow appearance for the visual elements in the scene.

## Future Plans 🚀

### TODO List ✅

- **Live Audio Input** 🎤: Add support for live audio input (e.g., microphone or streaming sources) to visualize real-time music or sound.
- **Video Background** 🎬: Incorporate video backgrounds alongside the audio visualizer, offering a richer user experience with moving visuals or clips that react to the audio.
- **Standalone App with Electron** 💻: Package the visualizer as a standalone desktop application using **Electron** for a smoother user experience across platforms (Windows, macOS, Linux).

## Contributing 🤝

We welcome contributions! If you'd like to help improve RhythmVision, feel free to fork the repository, create a branch, and submit a pull request. Please ensure your code follows the existing style and includes tests for any new features.

## License 📜

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Built with ❤️ using [Three.js](https://threejs.org/) for 3D graphics.
- Special thanks to the open-source community for providing the tools and libraries that make this project possible!

Enjoy visualizing your favorite music with RhythmVision! 🎶✨
