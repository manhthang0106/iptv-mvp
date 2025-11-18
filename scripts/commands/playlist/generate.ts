#!/usr/bin/env node
import { glob } from 'glob'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import parser from 'iptv-playlist-parser'
import chalk from 'chalk'
import { STREAMS_DIR, OUTPUT_DIR, EOL } from '../../constants.js'
import { normalizeURL } from '../../utils.js'

interface Stream {
  name: string
  url: string
  tvg: {
    id?: string
    name?: string
    logo?: string
  }
  group: {
    title?: string
  }
}

interface Playlist {
  header: {
    attrs: Record<string, string>
  }
  items: Array<{
    name: string
    url: string
    tvg: {
      id?: string
      name?: string
      logo?: string
    }
    group: {
      title?: string
    }
  }>
}

async function generatePlaylists() {
  console.log(chalk.blue('🚀 Generating playlists...\n'))

  try {
    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })

    // Find all M3U files
    const files = await glob(`${STREAMS_DIR}/*.m3u`)
    console.log(chalk.gray(`Found ${files.length} playlist file(s)\n`))

    const allStreams: Stream[] = []
    const categories = new Map<string, Stream[]>()

    // Parse all playlists
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      const playlist = parser.parse(content) as Playlist

      console.log(chalk.cyan(`📄 Processing: ${basename(file)}`))
      console.log(chalk.gray(`   Streams: ${playlist.items.length}`))

      playlist.items.forEach(item => {
        const stream: Stream = {
          name: item.name,
          url: normalizeURL(item.url),
          tvg: item.tvg,
          group: item.group
        }

        allStreams.push(stream)

        // Group by category
        const category = item.group?.title || 'Undefined'
        if (!categories.has(category)) {
          categories.set(category, [])
        }
        categories.get(category)!.push(stream)
      })
    }

    // Generate master playlist
    const masterPlaylist = generateM3U(allStreams, 'Master Playlist')
    const masterPath = join(OUTPUT_DIR, 'index.m3u')
    writeFileSync(masterPath, masterPlaylist)
    console.log(chalk.green(`\n✅ Master playlist: ${masterPath} (${allStreams.length} streams)`))

    // Generate category playlists
    console.log(chalk.blue('\n📂 Generating category playlists...'))
    categories.forEach((streams, category) => {
      const categoryPlaylist = generateM3U(streams, category)
      const categoryPath = join(OUTPUT_DIR, `${sanitizeFilename(category)}.m3u`)
      writeFileSync(categoryPath, categoryPlaylist)
      console.log(chalk.gray(`   ${category}: ${streams.length} streams`))
    })

    console.log(chalk.green(`\n✨ Generated ${categories.size + 1} playlists successfully!`))
  } catch (error) {
    console.error(chalk.red('❌ Error generating playlists:'), error)
    process.exit(1)
  }
}

function generateM3U(streams: Stream[], title: string): string {
  let content = `#EXTM3U${EOL}`

  streams.forEach(stream => {
    const attrs = []
    attrs.push('-1')
    if (stream.tvg?.id) attrs.push(`tvg-id="${stream.tvg.id}"`)
    if (stream.tvg?.name) attrs.push(`tvg-name="${stream.tvg.name}"`)
    if (stream.tvg?.logo) attrs.push(`tvg-logo="${stream.tvg.logo}"`)
    if (stream.group?.title) attrs.push(`group-title="${stream.group.title}"`)

    content += `#EXTINF:${attrs.join(' ')},${stream.name}${EOL}`
    content += `${stream.url}${EOL}`
  })

  return content
}

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

generatePlaylists()
