#instal dependencies
curl -sL https://deb.nodesource.com/setup_15.x | sudo -E bash -
sudo apt install -y nodejs gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev


#copy files to app dir


#to restart app after changes run: pm2 restart testUrl.js
# pm2 logs


# Configure Screaming frog
wget https://seo.tl/wayd -O install.sh && chmod +x install.sh && source ./install.sh && rm install.sh

echo "unset DISPLAY" >> ~/.bashrc


cd && mkdir app && cd app && npm init -y && npm i node-fetch express puppeteer googleapis && npm install -g pm2


# start application
pm2 start testUrl.js
pm2 startup systemd # exec command that it shows
