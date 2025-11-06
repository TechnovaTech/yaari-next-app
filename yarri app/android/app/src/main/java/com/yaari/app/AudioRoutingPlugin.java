package com.yaari.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioRouting")
public class AudioRoutingPlugin extends Plugin {
    private static final String TAG = "AudioRoutingPlugin";
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;

    @Override
    public void load() {
        super.load();
        try {
            audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (audioManager == null) {
                Log.e(TAG, "AudioManager not available");
            } else {
                Log.d(TAG, "AudioRoutingPlugin loaded successfully");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error loading AudioRoutingPlugin", e);
        }
    }

    @PluginMethod
    public void enterCommunicationMode(PluginCall call) {
        if (audioManager == null) {
            call.reject("AudioManager not available");
            return;
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build();
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                        .setAudioAttributes(playbackAttributes)
                        .setAcceptsDelayedFocusGain(false)
                        .setOnAudioFocusChangeListener(i -> { })
                        .build();
                audioManager.requestAudioFocus(audioFocusRequest);
            } else {
                audioManager.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE);
            }
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            Log.d(TAG, "Entered communication mode");
            JSObject result = new JSObject();
            result.put("status", "entered_communication_mode");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error entering communication mode", e);
            call.reject("Failed to enter communication mode", e);
        }
    }

    @PluginMethod
    public void setSpeakerphoneOn(PluginCall call) {
        if (audioManager == null) {
            call.reject("AudioManager not available");
            return;
        }
        boolean on = call.getBoolean("on", false);
        try {
            audioManager.setSpeakerphoneOn(on);
            Log.d(TAG, "Speakerphone set to: " + on);
            JSObject result = new JSObject();
            result.put("status", "success");
            result.put("speakerOn", audioManager.isSpeakerphoneOn());
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error setting speakerphone", e);
            call.reject("Failed to set speakerphone", e);
        }
    }

    @PluginMethod
    public void resetAudio(PluginCall call) {
        if (audioManager == null) {
            call.reject("AudioManager not available");
            return;
        }
        try {
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.setSpeakerphoneOn(false);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
            } else {
                audioManager.abandonAudioFocus(null);
            }
            Log.d(TAG, "Audio reset to normal mode");
            JSObject result = new JSObject();
            result.put("status", "audio_reset");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error resetting audio", e);
            call.reject("Failed to reset audio", e);
        }
    }
}