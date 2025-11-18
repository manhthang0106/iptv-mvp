#!/usr/bin/env node
import { glob } from 'glob'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { basename, join } from 'path'
import parser from 'iptv-playlist-parser'
import chalk from 'chalk'
import { STREAMS_DIR, API_DIR } from '../../constants.js'

interface StreamAPI {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
  tvgId?: string
}

interface CategoryAPI {
  name: string
  count: number
  streams: StreamAPI[]
}

async function generateAPI() {
  console.log(chalk.blue('🔧 Generating API...\n'))

  try {
    // Create API directory
    mkdirSync(API_DIR, { recursive: true })

    const files = await glob(`${STREAMS_DIR}/*.m3u`)
    console.log(chalk.gray(`Found ${files.length} playlist file(s)\n`))

    const allStreams: StreamAPI[] = []
    const categories = new Map<string, StreamAPI[]>()

    // Parse playlists
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      const playlist = parser.parse(content)

      playlist.items.forEach((item: any, index: number) => {
        const stream: StreamAPI = {
          id: `${basename(file, '.m3u')}-${index}`,
          name: item.name,
          url: item.url,
          logo: item.tvg?.logo,
          group: item.group?.title,
          tvgId: item.tvg?.id
        }

        allStreams.push(stream)

        const category = item.group?.title || 'Undefined'
        if (!categories.has(category)) {
          categories.set(category, [])
        }
        categories.get(category)!.push(stream)
      })
    }

    // Generate streams.json
    const streamsAPI = {
      total: allStreams.length,
      streams: allStreams
    }
    writeFileSync(
      join(API_DIR, 'streams.json'),
      JSON.stringify(streamsAPI, null, 2)
    )
    console.log(chalk.green(`✓ Generated streams.json (${allStreams.length} streams)`))

    // Generate categories.json
    const categoriesAPI: CategoryAPI[] = Array.from(categories.entries()).map(([name, streams]) => ({
      name,
      count: streams.length,
      streams
    }))
    writeFileSync(
      join(API_DIR, 'categories.json'),
      JSON.stringify({ total: categoriesAPI.length, categories: categoriesAPI }, null, 2)
    )
    console.log(chalk.green(`✓ Generated categories.json (${categoriesAPI.length} categories)`))

    // Generate stats.json
    const stats = {
      totalStreams: allStreams.length,
      totalCategories: categoriesAPI.length,
      totalPlaylists: files.length,
      categories: categoriesAPI.map(c => ({ name: c.name, count: c.count })),
      generatedAt: new Date().toISOString()
    }
    writeFileSync(
      join(API_DIR, 'stats.json'),
      JSON.stringify(stats, null, 2)
    )
    console.log(chalk.green(`✓ Generated stats.json`))

    console.log(chalk.green(`\n✨ API generated successfully in ${API_DIR}!`))

  } catch (error) {
    console.error(chalk.red('❌ Error generating API:'), error)
    process.exit(1)
  }
}

generateAPI()
