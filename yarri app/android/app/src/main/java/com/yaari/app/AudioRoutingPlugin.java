package com.yaari.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioRouting")
public class AudioRoutingPlugin extends Plugin {
    private static final String TAG = "AudioRouting";
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private boolean lastSpeakerOn = false;

    @Override
    public void load() {
        try {
            audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            Log.d(TAG, "AudioRoutingPlugin loaded");
        } catch (Exception e) {
            Log.e(TAG, "Failed to load", e);
        }
    }

    @PluginMethod
    public void enterCommunicationMode(PluginCall call) {
        try {
            if (audioManager == null) {
                call.reject("AudioManager null");
                return;
            }
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            requestAudioFocus();
            // Default to earpiece
            applyRoute(false);
            Log.d(TAG, "Entered communication mode; default route: earpiece");
            call.resolve(new JSObject().put("status", "ok"));
        } catch (Exception e) {
            Log.e(TAG, "enterCommunicationMode error", e);
            call.reject("Error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setSpeakerphoneOn(PluginCall call) {
        try {
            if (audioManager == null) {
                call.reject("AudioManager null");
                return;
            }
            
            boolean on = call.getBoolean("on", false);
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            applyRoute(on);
            // Retry for stubborn devices
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                try { applyRoute(on); } catch (Exception ignored) {}
            }, 150);
            lastSpeakerOn = on;
            Log.d(TAG, "Route applied. Speaker: " + on);
            call.resolve(new JSObject().put("status", "ok").put("speakerOn", on));
        } catch (Exception e) {
            Log.e(TAG, "setSpeakerphoneOn error", e);
            call.reject("Error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resetAudio(PluginCall call) {
        try {
            if (audioManager == null) {
                call.reject("AudioManager null");
                return;
            }
            // Clear any forced routing and return to normal mode
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    audioManager.clearCommunicationDevice();
                }
            } catch (Throwable ignored) {}
            stopBluetoothScoSafe();
            audioManager.setSpeakerphoneOn(false);
            audioManager.setMode(AudioManager.MODE_NORMAL);
            abandonAudioFocus();
            call.resolve(new JSObject().put("status", "ok"));
        } catch (Exception e) {
            Log.e(TAG, "resetAudio error", e);
            call.reject("Error: " + e.getMessage());
        }
    }

    private void requestAudioFocus() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                    .setAudioAttributes(attrs)
                    .setOnAudioFocusChangeListener(i -> {})
                    .build();
                audioManager.requestAudioFocus(focusRequest);
            } else {
                audioManager.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
            }
        } catch (Exception e) {
            Log.e(TAG, "requestAudioFocus error", e);
        }
    }

    private void abandonAudioFocus() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
                audioManager.abandonAudioFocusRequest(focusRequest);
            } else {
                audioManager.abandonAudioFocus(null);
            }
        } catch (Exception e) {
            Log.e(TAG, "abandonAudioFocus error", e);
        }
    }

    private void applyRoute(boolean speakerOn) {
        // Ensure we are in comms mode
        try { audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION); } catch (Throwable ignored) {}
        // Disable BT SCO which can hijack routing on some OEMs
        stopBluetoothScoSafe();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+: Explicitly select communication device
            AudioDeviceInfo target = findCommunicationDevice(
                speakerOn ? AudioDeviceInfo.TYPE_BUILTIN_SPEAKER : AudioDeviceInfo.TYPE_BUILTIN_EARPIECE
            );
            if (target == null && !speakerOn) {
                // Some devices (tablets) have no earpiece; fallback to speaker
                target = findCommunicationDevice(AudioDeviceInfo.TYPE_BUILTIN_SPEAKER);
            }
            if (target != null) {
                boolean ok = audioManager.setCommunicationDevice(target);
                Log.d(TAG, "setCommunicationDevice(" + (speakerOn ? "speaker" : "earpiece") + ") => " + ok);
                if (!ok) {
                    // Fallback
                    audioManager.setSpeakerphoneOn(speakerOn);
                }
            } else {
                // Fallback if device not found
                audioManager.setSpeakerphoneOn(speakerOn);
            }
        } else {
            // Legacy behavior
            audioManager.setSpeakerphoneOn(speakerOn);
        }
    }

    private AudioDeviceInfo findCommunicationDevice(int type) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                for (AudioDeviceInfo d : audioManager.getAvailableCommunicationDevices()) {
                    if (d.getType() == type) return d;
                }
            }
        } catch (Throwable e) {
            Log.w(TAG, "findCommunicationDevice error", e);
        }
        return null;
    }

    private void stopBluetoothScoSafe() {
        try {
            // These calls are safe no-ops if SCO is not active
            audioManager.stopBluetoothSco();
            audioManager.setBluetoothScoOn(false);
        } catch (Throwable ignored) {}
    }
}
