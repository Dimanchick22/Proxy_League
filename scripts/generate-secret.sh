#!/bin/bash

# Скрипт для генерации безопасного JWT секрета

echo "Генерация нового JWT Secret..."
echo ""

# Генерируем случайную строку
SECRET=$(openssl rand -base64 64 | tr -d '\n')

echo "Новый JWT Secret:"
echo "================================"
echo "$SECRET"
echo "================================"
echo ""
echo "Скопируйте эту строку и вставьте в .env файл:"
echo "JWT_SECRET=$SECRET"
echo ""
echo "⚠️  Храните этот секрет в безопасности!"
echo "⚠️  Не коммитьте .env файл в git!"
