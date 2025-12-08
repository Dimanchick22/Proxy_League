#!/bin/bash

echo "==================================="
echo "Перезапуск бэкенд сервера"
echo "==================================="

if command -v docker &> /dev/null; then
    echo "Перезапуск Docker контейнера..."
    docker-compose restart backend 2>/dev/null || docker restart proxyleague-backend 2>/dev/null || {
        echo "Docker контейнер не найден. Запускаем локально..."
        cd /home/user/ProxyLeague/backend
        ./bin/server
    }
else
    echo "Docker не найден. Запускаем локально..."
    cd /home/user/ProxyLeague/backend
    ./bin/server
fi
