# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2021-08-31

### Added

- Qutoes are now indexed and searched with RediSearch. To migrate existing quotes,
  build and run the migration script in [packages/migrations](./packages/migrations/src/0001_redisearch.ts).