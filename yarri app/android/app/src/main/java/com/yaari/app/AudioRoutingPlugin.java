package com.yaari.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioDeviceCallback;
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
    private boolean lastSpeakerOn = false;
    private boolean commsActive = false;
    private AudioDeviceCallback deviceCallback;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        // Monitor device changes to react to BT disconnects
        if (audioManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            deviceCallback = new AudioDeviceCallback() {
                @Override
                public void onAudioDevicesAdded(AudioDeviceInfo[] added) {
                    // No-op: We allow system to route to BT when connected
                }

                @Override
                public void onAudioDevicesRemoved(AudioDeviceInfo[] removed) {
                    if (!commsActive || audioManager == null) return;
                    boolean btRemoved = false;
                    for (AudioDeviceInfo dev : removed) {
                        int t = dev.getType();
                        if (t == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP || t == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
                            btRemoved = true;
                            break;
                        }
                    }
                    if (btRemoved) {
                        try {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                audioManager.setCommunicationDevice(null);
                            }
                        } catch (Throwable ignored) {}
                        // Re-apply last desired route (earpiece vs speaker)
                        applyRoute(lastSpeakerOn);
                    }
                }
            };
            audioManager.registerAudioDeviceCallback(deviceCallback, null);
        }
    }

    @PluginMethod
    public void enterCommunicationMode(PluginCall call) {
        try {
            if (audioManager != null) {
                // Ensure we aren't stuck on BT SCO
                try { audioManager.stopBluetoothSco(); } catch (Throwable ignored) {}
                try { audioManager.setBluetoothScoOn(false); } catch (Throwable ignored) {}
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                // Default to earpiece in communication mode
                try { audioManager.setSpeakerphoneOn(false); } catch (Throwable ignored) {}
                requestAudioFocus();
                commsActive = true;
                lastSpeakerOn = false;
                applyRoute(false);
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
                // Stop any bluetooth routing first
                try { audioManager.stopBluetoothSco(); } catch (Throwable ignored) {}
                try { audioManager.setBluetoothScoOn(false); } catch (Throwable ignored) {}
                
                // Set communication mode
                audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                lastSpeakerOn = on;
                applyRoute(on);
                
                // Force apply with delay for stubborn devices
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    try {
                        applyRoute(on);
                    } catch (Exception ignored) {}
                }, 200);
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
                commsActive = false;
            }
            call.resolve(new JSObject().put("status", "ok"));
        } catch (Exception e) {
            call.reject("Failed to reset audio: " + e.getMessage());
        }
    }

    private void applyRoute(boolean speakerOn) {
        if (audioManager == null) return;
        try {
            // Ensure communication mode is active
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            
            // If Android 12+, select explicit builtin device
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                try { audioManager.setCommunicationDevice(null); } catch (Throwable ignored) {}
                AudioDeviceInfo target = null;
                AudioDeviceInfo[] outputs = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                for (AudioDeviceInfo dev : outputs) {
                    int type = dev.getType();
                    if (!speakerOn && type == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE) { target = dev; break; }
                    if (speakerOn && type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) { target = dev; break; }
                }
                if (target != null) {
                    boolean success = audioManager.setCommunicationDevice(target);
                    android.util.Log.d("AudioRouting", "setCommunicationDevice " + (speakerOn ? "SPEAKER" : "EARPIECE") + ": " + success);
                } else {
                    audioManager.setSpeakerphoneOn(speakerOn);
                    android.util.Log.d("AudioRouting", "setSpeakerphoneOn: " + speakerOn);
                }
            } else {
                // Legacy routing - immediate + delayed enforcement
                audioManager.setSpeakerphoneOn(speakerOn);
                android.util.Log.d("AudioRouting", "Legacy setSpeakerphoneOn: " + speakerOn);
                
                // Multiple retries for Samsung devices
                android.os.Handler h = new android.os.Handler(android.os.Looper.getMainLooper());
                int[] delays = new int[] { 50, 150, 300, 500 };
                for (int d : delays) {
                    h.postDelayed(() -> {
                        try {
                            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
                            audioManager.setSpeakerphoneOn(speakerOn);
                        } catch (Exception ignored) {}
                    }, d);
                }
            }
        } catch (Throwable e) {
            android.util.Log.e("AudioRouting", "applyRoute failed", e);
        }
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
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