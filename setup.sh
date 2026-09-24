#!/bin/bash

function command_exists() {
    command -v "$1" &> /dev/null
}

if ! command_exists wget; then
    echo "wget is not installed. Please install wget to use this script."
    exit 1
fi

if ! command_exists unzip; then
    echo "unzip is not installed. Please install unzip to use this script."
    exit 1
fi

wget https://github.com/khulnasoft-bot/cursor/releases/download/beta/resources.zip
wget https://github.com/khulnasoft-bot/cursor/releases/download/beta/lsp.zip

unzip resources.zip
unzip lsp.zip

rm ./resources.zip
rm ./lsp.zip
