#!/usr/bin/env node
import { glob } from 'glob'
import { readFileSync } from 'fs'
import { basename } from 'path'
import parser from 'iptv-playlist-parser'
import chalk from 'chalk'
import { STREAMS_DIR } from '../../constants.js'
import { isURI } from '../../utils.js'

interface ValidationResult {
  file: string
  valid: boolean
  errors: string[]
  warnings: string[]
  streamsCount: number
}

async function validatePlaylists() {
  console.log(chalk.blue('🔍 Validating playlists...\n'))

  try {
    const files = await glob(`${STREAMS_DIR}/*.m3u`)
    console.log(chalk.gray(`Found ${files.length} playlist file(s)\n`))

    const results: ValidationResult[] = []
    let totalErrors = 0
    let totalWarnings = 0

    for (const file of files) {
      const result: ValidationResult = {
        file: basename(file),
        valid: true,
        errors: [],
        warnings: [],
        streamsCount: 0
      }

      try {
        const content = readFileSync(file, 'utf-8')

        // Check for header
        if (!content.startsWith('#EXTM3U')) {
          result.errors.push('Missing #EXTM3U header')
          result.valid = false
        }

        // Parse playlist
        const playlist = parser.parse(content)
        result.streamsCount = playlist.items.length

        // Validate each stream
        playlist.items.forEach((item: any, index: number) => {
          // Check for title
          if (!item.name || item.name.trim() === '') {
            result.warnings.push(`Stream ${index + 1}: Missing title`)
          }

          // Check for valid URL
          if (!item.url || item.url.trim() === '') {
            result.errors.push(`Stream ${index + 1}: Missing URL`)
            result.valid = false
          } else if (!isURI(item.url)) {
            result.errors.push(`Stream ${index + 1}: Invalid URL format`)
            result.valid = false
          }

          // Check for duplicate URLs
          const duplicates = playlist.items.filter((i: any) => i.url === item.url)
          if (duplicates.length > 1) {
            result.warnings.push(`Stream ${index + 1}: Duplicate URL detected`)
          }
        })

        totalErrors += result.errors.length
        totalWarnings += result.warnings.length

      } catch (error) {
        result.errors.push(`Parse error: ${error}`)
        result.valid = false
        totalErrors++
      }

      results.push(result)
    }

    // Display results
    console.log(chalk.bold('Validation Results:\n'))
    results.forEach(result => {
      const status = result.valid ? chalk.green('✓') : chalk.red('✗')
      console.log(`${status} ${chalk.cyan(result.file)} (${result.streamsCount} streams)`)

      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(chalk.red(`   ❌ ${error}`))
        })
      }

      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`   ⚠️  ${warning}`))
        })
      }

      console.log()
    })

    // Summary
    const validCount = results.filter(r => r.valid).length
    const totalStreams = results.reduce((sum, r) => sum + r.streamsCount, 0)

    console.log(chalk.bold('Summary:'))
    console.log(chalk.gray(`Total playlists: ${results.length}`))
    console.log(chalk.gray(`Valid playlists: ${validCount}`))
    console.log(chalk.gray(`Total streams: ${totalStreams}`))
    console.log(chalk.gray(`Errors: ${totalErrors}`))
    console.log(chalk.gray(`Warnings: ${totalWarnings}`))

    if (totalErrors > 0) {
      console.log(chalk.red('\n❌ Validation failed!'))
      process.exit(1)
    } else {
      console.log(chalk.green('\n✅ All playlists are valid!'))
    }

  } catch (error) {
    console.error(chalk.red('❌ Error during validation:'), error)
    process.exit(1)
  }
}

validatePlaylists()
