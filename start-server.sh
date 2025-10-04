#!/bin/bash
# 🎙️ Chatterbox TTS Server Starter
# Simple shell script to start the modular TTS server

# Activate virtual environment and start server
source chatterbox_env/bin/activate
export PYTHONWARNINGS="ignore::UserWarning:perth.perth_net,ignore::DeprecationWarning"
python -m chatterbox_server "$@"