# node-simple-crud-api

## Required Node version ^18.14.0

The `availableParallelism()` was added to Node 18.14.0. Please check if your Node version not older than 18.14.0

## Setup

1. Run `npm i`

2. To customize the PORT or enable "Parallelism" mode on PROD please use `.env` file:

```bash
export PORT=9000
export MULTI=true
```

### `.env` file at the working dir will be used

If you run `node build/main-bundle.js`, your `.env` file should be in the root dir. If you change your dir to `build` and run `node main-bundle.js`, your `.env` file should be in the build dir.
