#!/bin/bash
export NODE_ENV=production
export HOST=0.0.0.0
export ALLOW_REGISTRATION=true
node api/server/index.js
