package com.oryx.app;

import android.content.Context;
import android.media.AudioManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "OryXSystemVolume")
public class OryXSystemVolumePlugin extends Plugin {
    private AudioManager audio() {
        return (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }

    @PluginMethod
    public void getVolume(PluginCall call) {
        AudioManager manager = audio();
        if (manager == null) { call.reject("AudioManager indisponível"); return; }
        int max = manager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        int current = manager.getStreamVolume(AudioManager.STREAM_MUSIC);
        JSObject result = new JSObject();
        result.put("volume", max > 0 ? (double) current / max : 0);
        call.resolve(result);
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        Double volume = call.getDouble("volume");
        if (volume == null) { call.reject("Volume obrigatório"); return; }
        AudioManager manager = audio();
        if (manager == null) { call.reject("AudioManager indisponível"); return; }
        int max = manager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        int level = (int) Math.round(Math.max(0, Math.min(1, volume)) * max);
        manager.setStreamVolume(AudioManager.STREAM_MUSIC, level, 0);
        call.resolve();
    }
}
