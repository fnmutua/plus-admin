 sudo pm2 stop production
 sudo pm2 delete production
 sudo pm2 start production.js
 sudo pm2 start server/websocket-chat.js


sudo pm2 stop server/websocket-chat-https.js
sudo pm2 delete server/websocket-chat-https.js
sudo pm2 start server/websocket-chat-https.js




