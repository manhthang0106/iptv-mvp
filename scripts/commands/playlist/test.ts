#!/usr/bin/env node
import { glob } from 'glob'
import { readFileSync } from 'fs'
import { basename } from 'path'
import parser from 'iptv-playlist-parser'
import axios from 'axios'
import chalk from 'chalk'
import cliProgress from 'cli-progress'
import { STREAMS_DIR } from '../../constants.js'

interface TestResult {
  url: string
  name: string
  status: 'success' | 'failed' | 'error'
  statusCode?: number
  error?: string
}

async function testStreams() {
  console.log(chalk.blue('🧪 Testing stream URLs...\n'))

  try {
    const files = await glob(`${STREAMS_DIR}/*.m3u`)
    console.log(chalk.gray(`Found ${files.length} playlist file(s)\n`))

    const allStreams: Array<{ name: string, url: string }> = []

    // Collect all streams
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      const playlist = parser.parse(content)
      playlist.items.forEach((item: any) => {
        allStreams.push({ name: item.name, url: item.url })
      })
    }

    console.log(chalk.cyan(`Testing ${allStreams.length} stream(s)...\n`))

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format: 'Progress |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total} streams',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })

    progressBar.start(allStreams.length, 0)

    const results: TestResult[] = []
    let successCount = 0
    let failedCount = 0

    // Test streams with concurrency limit
    const concurrency = 5
    for (let i = 0; i < allStreams.length; i += concurrency) {
      const batch = allStreams.slice(i, i + concurrency)
      const batchResults = await Promise.all(
        batch.map(stream => testStream(stream.name, stream.url))
      )

      results.push(...batchResults)
      batchResults.forEach(result => {
        if (result.status === 'success') successCount++
        else failedCount++
      })

      progressBar.update(Math.min(i + concurrency, allStreams.length))
    }

    progressBar.stop()

    // Display failed streams
    const failed = results.filter(r => r.status !== 'success')
    if (failed.length > 0) {
      console.log(chalk.red('\n❌ Failed streams:\n'))
      failed.slice(0, 10).forEach(result => {
        console.log(chalk.gray(`   ${result.name}`))
        console.log(chalk.red(`   ${result.url}`))
        console.log(chalk.yellow(`   ${result.error || 'Connection failed'}\n`))
      })

      if (failed.length > 10) {
        console.log(chalk.gray(`   ... and ${failed.length - 10} more\n`))
      }
    }

    // Summary
    console.log(chalk.bold('\nTest Summary:'))
    console.log(chalk.green(`✓ Successful: ${successCount}`))
    console.log(chalk.red(`✗ Failed: ${failedCount}`))
    console.log(chalk.gray(`Total: ${allStreams.length}`))
    console.log(chalk.gray(`Success rate: ${((successCount / allStreams.length) * 100).toFixed(1)}%`))

  } catch (error) {
    console.error(chalk.red('\n❌ Error testing streams:'), error)
    process.exit(1)
  }
}

async function testStream(name: string, url: string): Promise<TestResult> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 3,
      validateStatus: () => true
    })

    if (response.status >= 200 && response.status < 400) {
      return { url, name, status: 'success', statusCode: response.status }
    } else {
      return { url, name, status: 'failed', statusCode: response.status, error: `HTTP ${response.status}` }
    }
  } catch (error: any) {
    return { url, name, status: 'error', error: error.message }
  }
}

testStreams()
