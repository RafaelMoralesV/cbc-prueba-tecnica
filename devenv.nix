{ pkgs, ... }:

{
  packages = with pkgs; [
    nodejs
    docker
    docker-compose
  ];

  languages.javascript = {
    enable = true;
    npm.enable = true;
  };

  scripts.up.exec = "docker compose up --build";
  scripts.mock.exec = "docker compose up --build mock-api";

  enterShell = ''
    echo "Node version: $(node --version)"
    echo "Docker version: $(docker --version)"
  '';
}
