# IPTV MVP

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

MVP version of IPTV playlist management tool - Generate, validate, test, and organize M3U playlists.

This is a simplified version based on [iptv-org/iptv](https://github.com/iptv-org/iptv) focusing on core playlist management features.

## Features

✅ **M3U Playlist Generation** - Generate M3U playlists from stream data  
✅ **Playlist Validation & Linting** - Validate and lint M3U playlists using m3u-linter  
✅ **Stream Testing** - Test IPTV stream URLs for availability  
✅ **API Generation** - Generate API endpoints from stream data  
✅ **README Generation** - Auto-generate documentation with statistics  
✅ **Stream Formatting** - Format and normalize stream data and URLs  

## Installation

```bash
npm install
```

## Usage

### Playlist Management

```bash
# Generate playlists
npm run playlist:generate

# Validate playlists
npm run playlist:validate

# Format playlists
npm run playlist:format

# Test stream URLs
npm run playlist:test

# Lint playlists
npm run playlist:lint
```

### API & Documentation

```bash
# Generate API endpoints
npm run api:generate

# Update README with statistics
npm run readme:update
```

### Combined Commands

```bash
# Validate and lint
npm run check

# Generate all (playlists + API + README)
npm run update
```

## Project Structure

```
iptv-mvp/
├── scripts/
│   ├── commands/
│   │   ├── playlist/
│   │   │   ├── generate.ts    # Generate M3U playlists
│   │   │   ├── validate.ts    # Validate playlists
│   │   │   ├── format.ts      # Format playlists
│   │   │   └── test.ts        # Test stream URLs
│   │   ├── api/
│   │   │   └── generate.ts    # Generate API
│   │   └── readme/
│   │       └── update.ts      # Update README
│   ├── constants.ts           # Configuration constants
│   └── utils.ts               # Utility functions
├── streams/
│   └── example.m3u            # Example playlist
├── package.json
├── tsconfig.json
└── README.md
```

## Adding Streams

1. Create or edit M3U files in the `streams/` directory
2. Follow the M3U format:

```m3u
#EXTM3U
#EXTINF:-1 tvg-id="Channel1" tvg-name="Example Channel" tvg-logo="https://example.com/logo.png" group-title="News",Example Channel
http://example.com/stream.m3u8
```

3. Run `npm run playlist:validate` to check your playlist
4. Run `npm run playlist:lint` to ensure proper formatting

## Testing Stream URLs

The stream testing feature checks if URLs are accessible:

```bash
npm run playlist:test
```

This will:
- Parse all M3U files in `streams/`
- Test each stream URL with HTTP HEAD request
- Display results with status codes
- Show progress bar for large playlists

## Configuration

### M3U Linter Rules

Edit `m3u-linter.json` to customize validation rules:

```json
{
  "files": ["streams/*.m3u"],
  "rules": {
    "require-header": true,
    "require-title": true,
    "attribute-quotes": true
  }
}
```

### Directory Configuration

Edit `scripts/constants.ts` to customize directories:

```typescript
export const STREAMS_DIR = './streams'
export const OUTPUT_DIR = './output'
export const API_DIR = './.api'
```

## Development

```bash
# Run linting
npm run lint

# Run tests
npm test
```

## License

MIT

## Credits

Based on [iptv-org/iptv](https://github.com/iptv-org/iptv)
