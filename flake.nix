{
  description = "userstyles.club";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.just
            pkgs.podman
            pkgs.podman-compose

            pkgs.nodejs_26
            pkgs.pnpm

            pkgs.postgresql_17
          ];
        };
      }
    );
}
