rootdir=/root
#rootdir="$1"

#instal dependencies
apt update
apt upgrade -y

#install Docker
apt remove -y docker docker-engine docker.io containerd runc
sudo apt install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
apt update
apt install -y docker-ce docker-ce-cli containerd.io

#install nodejs and puppeteer deps
curl -sL https://deb.nodesource.com/setup_15.x | sudo -E bash -
sudo apt install -y nodejs gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev

#copy files to app dir
cd $rootdir && git clone https://github.com/valerii15298/seo.git app && cd app/seo-app && npm init -y && npm i node-fetch express puppeteer googleapis && npm install -g pm2

# Configure Screaming frog
chmod +x $rootdir/app/screaming-frog/install-sf.sh && source $rootdir/app/screaming-frog/install-sf.sh
echo "unset DISPLAY" >>~/.bashrc

#configure docker private instance webpagetest server and agent
docker build -t local-wptserver "$rootdir/app/webpagetest/server"
docker run -d -p 4000:80 local-wptserver

docker build -t local-wptagent "$rootdir/app/webpagetest/agent"
docker run -d -p 4001:80 \
  --network="host" \
  -e "SERVER_URL=http://localhost:4000/work/" \
  -e "LOCATION=Test" \
  local-wptagent

# start application
pm2 start $rootdir/app/seo-app/testUrl.js --watch # start app and restart it automatically if source app changes
pm2 startup systemd                               # exec command that it shows
#pm2 restart testUrl.js # to restart app after changes run:
# pm2 logs # show logs

# update, upgrade and restart
apt update && apt upgrade -y
reboot
