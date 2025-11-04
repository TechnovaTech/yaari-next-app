package com.yaari.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioRouting")
public class AudioRoutingPlugin extends Plugin {
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    @PluginMethod
    public void enterCommunicationMode(PluginCall call) {
        try {
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                requestAudioFocus();
            }
            call.resolve(new JSObject().put("status", "ok"));
        } catch (Exception e) {
            call.reject("Failed to enter communication mode: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setSpeakerphoneOn(PluginCall call) {
        boolean on = call.getBoolean("on", true);
        try {
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);

                // Prefer explicit communication device routing on Android 12+
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    // Proactively disable BT SCO to avoid hijacking route
                    try { audioManager.stopBluetoothSco(); } catch (Throwable ignored) {}
                    try { audioManager.setBluetoothScoOn(false); } catch (Throwable ignored) {}

                    AudioDeviceInfo[] outputs = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                    int desiredType = on ? AudioDeviceInfo.TYPE_BUILTIN_SPEAKER : AudioDeviceInfo.TYPE_BUILTIN_EARPIECE;
                    AudioDeviceInfo target = null;
                    for (AudioDeviceInfo dev : outputs) {
                        if (dev.getType() == desiredType) {
                            target = dev;
                            break;
                        }
                    }
                    // If target device found, set it; otherwise fallback to legacy toggle
                    if (target != null) {
                        audioManager.setCommunicationDevice(target);
                        // Double-assurance: some OEMs ignore communication device for WebView audio
                        if (!on) {
                            audioManager.setSpeakerphoneOn(false);
                            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                            audioManager.setSpeakerphoneOn(false);
                        } else {
                            audioManager.setSpeakerphoneOn(true);
                        }
                    } else {
                        audioManager.setSpeakerphoneOn(on);
                    }
                } else {
                    // Legacy routing
                    if (!on) {
                        // Ensure BT SCO is not forcing route away from earpiece
                        try { audioManager.stopBluetoothSco(); } catch (Throwable ignored) {}
                        try { audioManager.setBluetoothScoOn(false); } catch (Throwable ignored) {}
                        // Some OEMs require reasserting mode and toggling twice
                        audioManager.setSpeakerphoneOn(false);
                        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                        audioManager.setSpeakerphoneOn(false);
                    } else {
                        audioManager.setSpeakerphoneOn(true);
                    }
                }
            }
            call.resolve(new JSObject().put("status", "ok").put("speakerOn", on));
        } catch (Exception e) {
            call.reject("Failed to set speakerphone: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resetAudio(PluginCall call) {
        try {
            if (audioManager != null) {
                // Turn off speaker and reset mode
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    // Clear any explicit communication device routing
                    audioManager.setCommunicationDevice(null);
                }
                try { audioManager.stopBluetoothSco(); } catch (Throwable ignored) {}
                try { audioManager.setBluetoothScoOn(false); } catch (Throwable ignored) {}
                audioManager.setSpeakerphoneOn(false);
                audioManager.setMode(AudioManager.MODE_NORMAL);
                abandonAudioFocus();
            }
            call.resolve(new JSObject().put("status", "ok"));
        } catch (Exception e) {
            call.reject("Failed to reset audio: " + e.getMessage());
        }
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(attrs)
                .setOnAudioFocusChangeListener(focusChange -> {})
                .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest != null) {
                audioManager.abandonAudioFocusRequest(focusRequest);
            }
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }
}