#!/bin/sh
set -ex

PORT=5188
DIST=../../dist
tmp=$(mktemp -d)

# Build the package
(cd $DIST; npm pack)
TGZ=$(realpath "$DIST/react-three-drei-0.0.0-semantic-release.tgz")

snapshot() {
  local UPDATE_SNAPSHOTS=""
  if [ "$PLAYWRIGHT_UPDATE_SNAPSHOTS" = "1" ]; then
    UPDATE_SNAPSHOTS="--update-snapshots"
  fi
  npx playwright test $UPDATE_SNAPSHOTS snapshot.test.ts
}

kill_app() {
  kill -9 $(lsof -ti:$PORT) || echo "ok, no previous running process on port $PORT"
}
kill_app || true
trap kill_app EXIT INT TERM HUP

#
# ██╗   ██╗██╗████████╗███████╗
# ██║   ██║██║╚══██╔══╝██╔════╝
# ██║   ██║██║   ██║   █████╗  
# ╚██╗ ██╔╝██║   ██║   ██╔══╝  
#  ╚████╔╝ ██║   ██║   ███████╗
#   ╚═══╝  ╚═╝   ╚═╝   ╚══════╝
#

appname=viteapp
appdir="$tmp/$appname"

# create app
(cd $tmp; npm create -y vite@latest $appname -- --template react-ts)

# drei
(cd $appdir; npm i @types/react@latest @types/react-dom@latest react@latest react-dom@latest @react-three/fiber@rc $TGZ)

# App.tsx
cp App.tsx $appdir/src/App.tsx

# build+start+playwright
(cd $appdir; npm run build; npm run preview -- --host --port $PORT &)
snapshot
kill_app

#
# ███╗   ██╗███████╗██╗  ██╗████████╗
# ████╗  ██║██╔════╝╚██╗██╔╝╚══██╔══╝
# ██╔██╗ ██║█████╗   ╚███╔╝    ██║   
# ██║╚██╗██║██╔══╝   ██╔██╗    ██║   
# ██║ ╚████║███████╗██╔╝ ██╗   ██║   
# ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝   ╚═╝   
#

appname=nextapp
appdir="$tmp/$appname"

# create app
(cd $tmp; npx -y create-next-app@latest $appname --ts --no-eslint --no-tailwind --no-src-dir --app --import-alias "@/*")

# drei
(cd $appdir; npm i $TGZ)

# App.tsx
cp App.tsx $appdir/app/page.tsx

# build+start+playwright
(cd $appdir; npm run build; npm start -- -p $PORT &)
snapshot
kill_app

#  ██████╗     ██╗███████╗
# ██╔════╝     ██║██╔════╝
# ██║          ██║███████╗
# ██║     ██   ██║╚════██║
# ╚██████╗╚█████╔╝███████║
#  ╚═════╝ ╚════╝ ╚══════╝
# 
# (using Next.js)
#

appname=cjsapp
appdir="$tmp/$appname"

# create app
(cd $tmp; npx -y create-next-app@latest $appname --ts --no-eslint --no-tailwind --no-src-dir --app --import-alias "@/*")

# drei
(cd $appdir; npm i $TGZ)

# App.tsx
cp App.tsx $appdir/app/page.tsx

# next.config.mjs
cat <<EOF >$appdir/next.config.mjs
console.log('🦆 CJS override (next.config.mjs)')
import path from 'path'

/** @type {import('next').NextConfig} */
export default {
  //
  // We force Next to use drei's CJS version here
  //
  webpack: (config) => {
    config.resolve.alias['@react-three/drei'] = path.resolve('node_modules/@react-three/drei/index.cjs.js')
    return config
  },
}
EOF

# build+start+playwright
(cd $appdir; npm run build; npm start -- -p $PORT &)
snapshot
kill_app

#
#  ██████╗██████╗  █████╗ 
# ██╔════╝██╔══██╗██╔══██╗
# ██║     ██████╔╝███████║
# ██║     ██╔══██╗██╔══██║
# ╚██████╗██║  ██║██║  ██║
#  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝
#

# appname=craapp
# appdir="$tmp/$appname"

# # create app
# (cd $tmp; npx create-react-app $appname --template typescript)

# # drei
# (cd $appdir; npm i $TGZ)

# # App.tsx
# cp App.tsx $appdir/src/App.tsx

# # build+start+playwright
# (cd $appdir; npm run build; npx serve -s -p $PORT build &)
# snapshot
# kill_app

#
# Teardown
#

echo "✅ e2e ok"
