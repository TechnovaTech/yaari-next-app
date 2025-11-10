package com.example.app_deting;

import android.content.Context;
import android.media.AudioManager;
import androidx.annotation.NonNull;
import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodChannel;

public class MainActivity extends FlutterActivity {
    private static final String CHANNEL = "com.example.app_deting/audio";
    private AudioManager audioManager;

    @Override
    public void configureFlutterEngine(@NonNull FlutterEngine flutterEngine) {
        super.configureFlutterEngine(flutterEngine);
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), CHANNEL)
            .setMethodCallHandler((call, result) -> {
                if (call.method.equals("setSpeakerOn")) {
                    audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                    audioManager.setSpeakerphoneOn(true);
                    int max = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL);
                    int target = Math.max(1, (int)(max * 0.8));
                    audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, target, 0);
                    result.success(null);
                } else if (call.method.equals("setSpeakerOff")) {
                    audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                    audioManager.setSpeakerphoneOn(false);
                    int max = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL);
                    int target = Math.max(1, (int)(max * 0.6));
                    audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, target, 0);
                    result.success(null);
                } else {
                    result.notImplemented();
                }
            });
    }
}
