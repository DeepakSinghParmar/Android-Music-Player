import React, { useContext, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import Screen from "../components/Screen";
import color from "../misc/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import PlayerButton from "../components/PlayerButton";
import { AudioContext } from "../context/AudioProvider";
import { pause, play, playNext, resume } from "../misc/audioController";
import { storeAudioForNextOpening } from "../misc/helper";
import RBSheet from "react-native-raw-bottom-sheet";
import AudioList from "./AudioList";

const { width } = Dimensions.get("window");

const Player = () => {
  const [spinAnim, setSpinAnim] = React.useState(new Animated.Value(0));

  const context = useContext(AudioContext);
  const { playbackPosition, playbackDuration } = context;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", context.isPlaying ? "360deg" : "0deg"],
  });

  const calculateSeebBar = () => {
    if (playbackPosition !== null && playbackDuration !== null) {
      return playbackPosition / playbackDuration;
    }
    return 0;
  };
  useEffect(() => {
    context.loadPreviousAudio();
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handlePlayPause = async () => {
    // play
    if (context.soundObj === null) {
      const audio = context.currentAudio;
      const status = await play(context.playbackObj, audio.uri);
      context.playbackObj.setOnPlaybackStatusUpdate(
        context.onPlaybackStatusUpdate
      );
      return context.updateState(context, {
        soundObj: status,
        currentAudio: audio,
        isPlaying: true,
        currentAudioIndex: context.currentAudioIndex,
      });
    }
    // pause
    if (context.soundObj && context.soundObj.isPlaying) {
      const status = await pause(context.playbackObj);
      return context.updateState(context, {
        soundObj: status,
        isPlaying: false,
      });
    }
    // resume
    if (context.soundObj && !context.soundObj.isPlaying) {
      const status = await resume(context.playbackObj);
      return context.updateState(context, {
        soundObj: status,
        isPlaying: true,
      });
    }
  };

  const handleNext = async () => {
    const { isLoaded } = await context.playbackObj.getStatusAsync();
    const isLastAudio =
      context.currentAudioIndex + 1 === context.totalAudioCount;
    let audio = context.audioFiles[context.currentAudioIndex + 1];
    let index;
    let status;

    if (!isLoaded && !isLastAudio) {
      index = context.currentAudioIndex + 1;
      status = await play(context.playbackObj, audio.uri);
    }

    if (isLoaded && !isLastAudio) {
      index = context.currentAudioIndex + 1;
      status = await playNext(context.playbackObj, audio.uri);
    }

    if (isLastAudio) {
      index = 0;
      audio = context.audioFiles[index];
      if (isLoaded) {
        status = await playNext(context.playbackObj, audio.uri);
      } else {
        status = await play(context.playbackObj, audio.uri);
      }
    }

    context.updateState(context, {
      currentAudio: audio,
      playbackObj: context.playbackObj,
      soundObj: status,
      isPlaying: true,
      currentAudioIndex: index,
      playbackPosition: null,
      playbackDuration: null,
    });
    storeAudioForNextOpening(audio, index);
  };

  const handlePrevious = async () => {
    const { isLoaded } = await context.playbackObj.getStatusAsync();
    const isFirstAudio = context.currentAudioIndex <= 0;
    let audio = context.audioFiles[context.currentAudioIndex - 1];
    let index;
    let status;

    if (!isLoaded && !isFirstAudio) {
      index = context.currentAudioIndex - 1;
      status = await play(context.playbackObj, audio.uri);
    }

    if (isLoaded && !isFirstAudio) {
      index = context.currentAudioIndex - 1;
      status = await playNext(context.playbackObj, audio.uri);
    }

    if (isFirstAudio) {
      index = context.totalAudioCount - 1;
      audio = context.audioFiles[index];
      if (isLoaded) {
        status = await playNext(context.playbackObj, audio.uri);
      } else {
        status = await play(context.playbackObj, audio.uri);
      }
    }

    context.updateState(context, {
      currentAudio: audio,
      playbackObj: context.playbackObj,
      soundObj: status,
      isPlaying: true,
      currentAudioIndex: index,
      playbackPosition: null,
      playbackDuration: null,
    });
    storeAudioForNextOpening(audio, index);
  };

  if (!context.currentAudio) return null;

  const refRBSheet = React.useRef();

  return (
    <Screen>
      <StatusBar backgroundColor={"black"} />

      <View style={styles.container}>
        <Text style={styles.audioCount}>{`${context.currentAudioIndex + 1} / ${
          context.totalAudioCount
        }`}</Text>
        <View style={styles.midBannerContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialCommunityIcons
              name="music-circle"
              size={300}
              color={context.isPlaying ? color.PLAYC : color.PLAY}
            />
          </Animated.View>
        </View>

        <View style={styles.audioPlayerContainer}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              color: color.FONT,
              padding: 15,
              position: "relative",
              top: -70,
              color: context.isPlaying ? color.PLAYC : color.PLAY,
              width: 300,
            }}
          >
            {context.currentAudio.filename}
          </Text>
          <Slider
            style={{ width: width, height: 40, position: "relative", top: -60 }}
            minimumValue={0}
            maximumValue={1}
            value={calculateSeebBar()}
            minimumTrackTintColor={color.FONT_MEDIUM}
            maximumTrackTintColor={color.ACTIVE_BG}
          />
          <View style={styles.audioControllers}>
            <PlayerButton
              style={{ color: context.isPlaying ? color.PLAYC : color.PLAY }}
              iconType={context.isPlaying ? "PREV" : "NPREV"}
              onPress={handlePrevious}
            />
            <PlayerButton
              onPress={handlePlayPause}
              style={{
                marginHorizontal: 25,
                color: context.isPlaying ? color.PLAYC : color.PLAY,
              }}
              iconType={context.isPlaying ? "PLAY" : "PAUSE"}
            />

            <PlayerButton
              style={{ color: context.isPlaying ? color.PLAYC : color.PLAY }}
              iconType={context.isPlaying ? "NEXT" : "NNEXT"}
              onPress={handleNext}
            />

            <PlayerButton
              style={{
                color: context.isPlaying ? color.PLAYC : color.PLAY,
                position: "relative",
                top: -105,
                right: -70,
                fontSize: 25,
              }}
              iconType="PLAYLIST"
              onPress={() => refRBSheet.current.open()}
            />
          </View>
          <RBSheet
            ref={refRBSheet}
            closeOnDragDown={true}
            closeOnPressMask={true}
            height={323}
            customStyles={{
              wrapper: {
                backgroundColor: "transparent",
              },
              draggableIcon: {
                backgroundColor: "#000",
              },
            }}
          >
            <AudioList />
          </RBSheet>
        </View>
        <Text
          style={{
            color: "#3c3c3c",
            position: "absolute",
            bottom: 10,
            width: "100%",
            textAlign: "center",
          }}
        >
          Deepak Singh Parmar
        </Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  audioControllers: {
    width,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    position: "relative",
    top: -50,
    left: 15,
  },
  playlist: {
    padding: 15,
    color: color.FONT_LIGHT,
    fontSize: 14,
    textAlign: "right",
  },
  container: {
    flex: 1,
  },
  audioCount: {
    textAlign: "right",
    padding: 15,
    color: color.FONT_LIGHT,
    fontSize: 14,
  },
  midBannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    top: -40,
  },
});

export default Player;
