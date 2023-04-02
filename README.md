# Firefly (DNSv3)
#### Not using bun anymore (very unstable)

Firefly (DNSv3) is a reverse proxy server with a web-gui, a bit like nginx

```bash
# Install dependencies
pnpm install
```

```bash
# Run
node index.js
```

```bash
# Creating user accounts
node addUser.js <username>
```

The client side interface is bundled with browserify
```bash
# Bundling with browserify
browserify ./assets/js/main.js -o ./assets/js/bundle.js
```