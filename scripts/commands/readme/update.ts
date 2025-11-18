#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import { API_DIR, ROOT_DIR } from '../../constants.js'

interface Stats {
  totalStreams: number
  totalCategories: number
  totalPlaylists: number
  categories: Array<{ name: string, count: number }>
  generatedAt: string
}

async function updateReadme() {
  console.log(chalk.blue('📝 Updating README...\n'))

  try {
    const statsPath = join(API_DIR, 'stats.json')

    if (!existsSync(statsPath)) {
      console.log(chalk.yellow('⚠️  No stats.json found. Run "npm run api:generate" first.'))
      return
    }

    const stats: Stats = JSON.parse(readFileSync(statsPath, 'utf-8'))
    const readmePath = join(ROOT_DIR, 'README.md')
    let readme = readFileSync(readmePath, 'utf-8')

    // Generate statistics section
    const statsSection = `## 📊 Statistics

- **Total Streams:** ${stats.totalStreams}
- **Total Categories:** ${stats.totalCategories}
- **Total Playlists:** ${stats.totalPlaylists}
- **Last Updated:** ${new Date(stats.generatedAt).toLocaleString()}

### Categories

${stats.categories.map(c => `- **${c.name}:** ${c.count} streams`).join('\n')}
`

    // Replace or append statistics section
    const statsMarker = '## 📊 Statistics'
    if (readme.includes(statsMarker)) {
      const startIndex = readme.indexOf(statsMarker)
      const endIndex = readme.indexOf('\n## ', startIndex + 1)
      if (endIndex !== -1) {
        readme = readme.substring(0, startIndex) + statsSection + readme.substring(endIndex)
      } else {
        readme = readme.substring(0, startIndex) + statsSection
      }
    } else {
      readme += '\n\n' + statsSection
    }

    writeFileSync(readmePath, readme)
    console.log(chalk.green('✅ README.md updated successfully!'))
    console.log(chalk.gray(`\nStatistics:`))
    console.log(chalk.gray(`  Streams: ${stats.totalStreams}`))
    console.log(chalk.gray(`  Categories: ${stats.totalCategories}`))
    console.log(chalk.gray(`  Playlists: ${stats.totalPlaylists}`))

  } catch (error) {
    console.error(chalk.red('❌ Error updating README:'), error)
    process.exit(1)
  }
}

updateReadme()
