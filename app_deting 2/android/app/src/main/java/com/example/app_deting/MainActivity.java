package com.example.app_deting;

import android.content.Context;
import android.media.AudioManager;
import android.os.Bundle;
import android.util.Log;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import androidx.annotation.NonNull;
import io.flutter.embedding.android.FlutterFragmentActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodChannel;
import io.flutter.plugins.GeneratedPluginRegistrant;
import android.content.Intent;
import io.flutter.embedding.android.FlutterActivityLaunchConfigs;
import com.facebook.FacebookSdk;
import com.facebook.appevents.AppEventsLogger;

public class MainActivity extends FlutterFragmentActivity {
    private static final String CHANNEL = "com.example.app_deting/audio";
    private AudioManager audioManager;
    

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FacebookSdk.sdkInitialize(getApplicationContext());
        AppEventsLogger.activateApp(getApplication());
        try {
            ApplicationInfo ai = getPackageManager().getApplicationInfo(getPackageName(), PackageManager.GET_META_DATA);
            Bundle meta = ai.metaData;
            String clientId = meta != null ? meta.getString("com.truecaller.android.sdk.ClientId", "") : "";
            Log.d("Truecaller", "ClientId=" + clientId);
        } catch (Exception e) {
            Log.d("Truecaller", "ClientId read error: " + e.getMessage());
        }
    }

    @Override
    public void configureFlutterEngine(@NonNull FlutterEngine flutterEngine) {
        super.configureFlutterEngine(flutterEngine);
        GeneratedPluginRegistrant.registerWith(flutterEngine);
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
                } else if (call.method.equals("resetAudio")) {
                    audioManager.setMode(AudioManager.MODE_NORMAL);
                    audioManager.setSpeakerphoneOn(false);
                    result.success(null);
                } else {
                    result.notImplemented();
                }
            });

    }

    @Override
    public FlutterActivityLaunchConfigs.BackgroundMode getBackgroundMode() {
        return FlutterActivityLaunchConfigs.BackgroundMode.transparent;
    }
}
