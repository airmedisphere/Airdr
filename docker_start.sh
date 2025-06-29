docker stop airdrive
docker build -t airdrive .
docker run -d --name airdrive -p 80:80 airdrive