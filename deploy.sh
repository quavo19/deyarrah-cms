#!/bin/bash
# Load environment variables
source /home/terminal_ideas/platinumvault-cms/.env

# Email settings
LOG_FILE="/tmp/deploy_$(date +%s).log"
DEPLOYMENT_TIME=$(date +"%Y-%m-%d %T %Z")
STATUS="FAILED"

# Clear previous log
> "$LOG_FILE"

{
echo "=== Deployment started at $DEPLOYMENT_TIME ==="

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Navigate to project directory (adjust path as needed)
cd ~/platinumvault-cms || { echo "CD failed"; exit 1; }

#use node version 20
nvm use 20

# Pull latest code
git pull origin main || { echo "Git pull failed"; exit 1; }

# delete and reInstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps || { echo "npm install failed"; exit 1; }

# Build and copy files
export NODE_OPTIONS=--max_old_space_size=4096
DISABLE_ESLINT_PLUGIN=true npm run build || { echo "Build failed"; exit 1; }

# Copy build files to serve path
#sudo rsync -av --delete out/ /var/www/serene/ || { echo "Copy failed"; exit 1; }

# Switch back to Node v18 for PM2 commands (PM2 is installed with v18)
nvm use 18

# Restart Next.js with PM2
# Start or reload app on port 3002 using PM2 (zero-downtime)
echo "Restarting PM2 process with ecosystem.config.cjs..."

# stop & remove old process if it exists
# pm2 delete platinumvault-cms || true

# start fresh using ecosystem config
#PORT=3002 pm2 start ecosystem.config.cjs --update-env

# save the PM2 process list so it auto-restores on reboot
#pm2 save
pm2 restart platinumvault-cms

echo "==== Deployment succeeded ==="
STATUS="SUCCESS"

} | tee -a "$LOG_FILE" 2>&1

# Get actual exit code of the deployment block
DEPLOY_EXIT_CODE=${PIPESTATUS[0]}

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
  STATUS="SUCCESS"
else
  STATUS="FAILED"
fi

# Get commit details
COMMIT_INFO=$(git log -1 --pretty="%h - %an, %ar: %s")

# Debug output
echo -e "\n=== SMTP Debug Info ===" | tee -a "$LOG_FILE"
echo "Server: $SMTP_SERVER:$SMTP_PORT" | tee -a "$LOG_FILE"
echo "User: $SMTP_USER" | tee -a "$LOG_FILE"
echo "Password: ${SMTP_PASSWORD:0:2}****" | tee -a "$LOG_FILE"
echo "Recipients: $ADMIN_EMAILS" | tee -a "$LOG_FILE"

# Send email via SMTP
# Send email via SMTP
sendemail \
  -f "$FROM_EMAIL" \
  -t "$ADMIN_EMAILS" \
  -u "Platinum Vault CMS Deploy $STATUS" \
  -m "Deployment result: $STATUS\nTime: $DEPLOYMENT_TIME\nCommit: $COMMIT_INFO\n\nLogs:\n$(cat "$LOG_FILE")" \
  -s smtp.mailgun.org:587 \
  -xu "$SMTP_USER" \
  -xp "$SMTP_PASSWORD" \
  -o tls=yes \
  -v 2>&1 | tee -a "$LOG_FILE"

# Final cleanup
rm "$LOG_FILE"

exit 0
