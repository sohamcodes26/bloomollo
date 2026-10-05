# Bloomollo web client

See [the repository README](../README.md) for features, limitations, contribution guidance and license status.

Run from this directory:

```sh
npm ci
npm run dev
```

Production validation and preview:

```sh
npm run build
npm run lint
npm test
npm run preview
```

Build before testing: validation reads generated files in `dist/`. See [SEO-LAUNCH.md](./SEO-LAUNCH.md) for deployment and [.env.example](./.env.example) for build variables.
