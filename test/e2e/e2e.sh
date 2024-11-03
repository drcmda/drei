#!/bin/sh
set -ex

PORT=5188
DIST=../../dist

(cd $DIST; npm pack)
TGZ=$(realpath "$DIST/react-three-drei-0.0.0-semantic-release.tgz")

kill_app() {
  kill -9 $(lsof -ti:$PORT) || echo "ok, no previous running process on port $PORT"
}

cleanup() {
  kill_app
}
cleanup || true
trap cleanup EXIT INT TERM HUP

tmp=$(mktemp -d)

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
(cd $appdir; npm i; npm i $TGZ)

# App.tsx
cp App.tsx $appdir/src/App.tsx

# build+start+playwright
(cd $appdir; npm run build; npm run preview -- --host --port $PORT &)
npx playwright test snapshot.test.js
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
(cd $tmp; npx -y create-next-app@14 $appname --ts --no-eslint --no-tailwind --no-src-dir --app --import-alias "@/*")

# drei
(cd $appdir; npm i $TGZ)

# App.tsx
cp App.tsx $appdir/app/page.tsx

# build+start+playwright
(cd $appdir; npm run build; npm start -- -p $PORT &)
npx playwright test snapshot.test.js
kill_app

#
#  ██████╗██████╗  █████╗ 
# ██╔════╝██╔══██╗██╔══██╗
# ██║     ██████╔╝███████║
# ██║     ██╔══██╗██╔══██║
# ╚██████╗██║  ██║██║  ██║
#  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝
#

appname=craapp
appdir="$tmp/$appname"

# create app
(cd $tmp; npx create-react-app $appname --template typescript)

# drei
(cd $appdir; npm i $TGZ)

# App.tsx
cp App.tsx $appdir/src/App.tsx

# build+start+playwright
(cd $appdir; npm run build; npx serve -s -p $PORT build &)
npx playwright test snapshot.test.js
kill_app

#
# Teardown
#

echo "✅ e2e ok"
