import React from "react";
import AudioProvider from "./app/context/AudioProvider";
import Player from "./app/screens/Player";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function App() {
  React.useEffect(() => {
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 4000);
  }, []);

  return (
    <AudioProvider>
      <Player />
    </AudioProvider>
  );
}
