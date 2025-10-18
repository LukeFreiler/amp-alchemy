We need to get the server up and running. If it's already running, I need it restarted because I'm having issues.
Run this bash command in the background: (fuser -k 3000/tcp || true) && sleep 1 && PORT=3000 pnpm dev
