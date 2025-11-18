#!/usr/bin/env node
import { glob } from 'glob'
import { readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'
import parser from 'iptv-playlist-parser'
import chalk from 'chalk'
import { STREAMS_DIR, EOL } from '../../constants.js'
import { normalizeURL } from '../../utils.js'

async function formatPlaylists() {
  console.log(chalk.blue('🎨 Formatting playlists...\n'))

  try {
    const files = await glob(`${STREAMS_DIR}/*.m3u`)
    console.log(chalk.gray(`Found ${files.length} playlist file(s)\n`))

    let totalFormatted = 0

    for (const file of files) {
      console.log(chalk.cyan(`📝 Formatting: ${basename(file)}`))

      const content = readFileSync(file, 'utf-8')
      const playlist = parser.parse(content)

      // Generate formatted M3U
      let formatted = `#EXTM3U${EOL}`

      playlist.items.forEach((item: any) => {
        const attrs = []
        attrs.push('-1')

        if (item.tvg?.id) attrs.push(`tvg-id="${item.tvg.id}"`)
        if (item.tvg?.name) attrs.push(`tvg-name="${item.tvg.name}"`)
        if (item.tvg?.logo) attrs.push(`tvg-logo="${item.tvg.logo}"`)
        if (item.group?.title) attrs.push(`group-title="${item.group.title}"`)

        const title = item.name || 'Untitled'
        formatted += `#EXTINF:${attrs.join(' ')},${title}${EOL}`
        formatted += `${normalizeURL(item.url)}${EOL}`
      })

      // Write formatted file
      writeFileSync(file, formatted)
      console.log(chalk.green(`   ✓ Formatted ${playlist.items.length} streams`))
      totalFormatted++
    }

    console.log(chalk.green(`\n✨ Formatted ${totalFormatted} playlist(s) successfully!`))

  } catch (error) {
    console.error(chalk.red('❌ Error formatting playlists:'), error)
    process.exit(1)
  }
}

formatPlaylists()
