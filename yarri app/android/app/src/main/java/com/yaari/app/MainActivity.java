package com.yaari.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.util.Log;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        try {
            super.onCreate(savedInstanceState);
            
            // Configure window settings safely
            try {
                // Set to true so system handles insets properly
                WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } catch (Exception e) {
                Log.e(TAG, "Error configuring window settings", e);
            }
            
            Log.d(TAG, "MainActivity created successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
            // Don't crash the app, just log the error
        }
    }
    
    @Override
    public void onResume() {
        try {
            super.onResume();
            Log.d(TAG, "MainActivity resumed");
        } catch (Exception e) {
            Log.e(TAG, "Error in onResume", e);
        }
    }
    
    @Override
    public void onPause() {
        try {
            super.onPause();
            Log.d(TAG, "MainActivity paused");
        } catch (Exception e) {
            Log.e(TAG, "Error in onPause", e);
        }
    }
}
