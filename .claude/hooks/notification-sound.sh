#!/bin/bash
# Cross-platform notification sound
# Plays a notification sound on macOS, Linux, and Windows

play_sound() {
    case "$OSTYPE" in
        darwin*)
            # macOS - use afplay with system sound
            for i in 1 2; do
                afplay /System/Library/Sounds/Funk.aiff 2>/dev/null
            done
            ;;
        linux*)
            # Linux - try paplay (PulseAudio), then aplay (ALSA), then beep
            if command -v paplay &>/dev/null; then
                for i in 1 2; do
                    paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || \
                    paplay /usr/share/sounds/sound-icons/prompt.wav 2>/dev/null
                done
            elif command -v aplay &>/dev/null; then
                for i in 1 2; do
                    aplay /usr/share/sounds/sound-icons/prompt.wav 2>/dev/null
                done
            elif command -v beep &>/dev/null; then
                beep -f 800 -l 200 2>/dev/null
                beep -f 800 -l 200 2>/dev/null
            fi
            ;;
        msys*|cygwin*|mingw*)
            # Windows (Git Bash, Cygwin, MSYS2)
            powershell.exe -c "[console]::beep(800,200); [console]::beep(800,200)" 2>/dev/null
            ;;
        *)
            # Unknown - try terminal bell as fallback
            printf '\a'
            sleep 0.2
            printf '\a'
            ;;
    esac
}

play_sound
exit 0
